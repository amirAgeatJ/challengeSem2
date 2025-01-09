// Initialise IndexedDB pour TransactionDatabase
function initTransactionDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("TransactionDatabase", 4);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("transactions")) {
        db.createObjectStore("transactions", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("budgets")) {
        db.createObjectStore("budgets", { keyPath: "userId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Initialise IndexedDB pour UserDatabase
function initUserDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("UserDatabase", 7);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Récupère les transactions pour un utilisateur
async function getTransactionsForUser(userId: string): Promise<any[]> {
  const db = await initTransactionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("transactions", "readonly");
    const store = transaction.objectStore("transactions");
    const request = store.getAll();

    request.onsuccess = () =>
      resolve((request.result || []).filter((t: any) => t.userId === userId));
    request.onerror = () => reject("Erreur lors de la récupération des transactions.");
  });
}

// Récupère un utilisateur par ID
async function getUserById(userId: string): Promise<any | null> {
  const db = await initUserDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("users", "readonly");
    const store = transaction.objectStore("users");
    const request = store.get(userId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject("Erreur lors de la récupération de l’utilisateur.");
  });
}

// Supprime une transaction par ID et met à jour le budget
async function deleteTransaction(
  transactionId: number,
  userId: string,
  type: string,
  category: string,
  amount: number
): Promise<void> {
  const db = await initTransactionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("transactions", "readwrite");
    const store = transaction.objectStore("transactions");
    const request = store.delete(transactionId);

    request.onsuccess = async () => {
      await updateBudgetAfterDeletion(userId, type, category, amount);
      resolve();
    };

    request.onerror = () => reject("Erreur lors de la suppression de la transaction.");
  });
}

// Récupère le budget pour un utilisateur
async function getUserBudget(userId: string): Promise<any | null> {
  const db = await initTransactionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("budgets", "readonly");
    const store = transaction.objectStore("budgets");
    const request = store.get(userId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject("Erreur lors de la récupération du budget.");
  });
}

// Met à jour le budget après suppression d'une transaction
async function updateBudgetAfterDeletion(
  userId: string,
  type: string,
  category: string,
  amount: number
): Promise<void> {
  const db = await initTransactionDB();
  const existingBudget = await getUserBudget(userId);

  if (!existingBudget) {
    console.error("Aucun budget trouvé pour l’utilisateur connecté.");
    return;
  }

  const updatedBudget = { ...existingBudget };
  const adjustment = type === "income" ? -amount : amount;

  updatedBudget.global += adjustment;
  updatedBudget[category] = (updatedBudget[category] || 0) + adjustment;

  const tx = db.transaction("budgets", "readwrite");
  const store = tx.objectStore("budgets");
  store.put(updatedBudget);

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e);
  });
}

// Retourne une icône pour une catégorie donnée
function getCategoryIcon(category: string): string {
  const iconsMap: { [key: string]: string } = {
    food: '<i class="bi bi-utensils"></i>',
    education: '<i class="bi bi-book"></i>',
    transport: '<i class="bi bi-bus-front"></i>',
    leisure: '<i class="bi bi-controller"></i>',
    health: '<i class="bi bi-heart-pulse"></i>',
    housing: '<i class="bi bi-house-door"></i>',
    default: '<i class="bi bi-question-circle"></i>',
  };

  return iconsMap[category] || iconsMap["default"];
}

// Affiche les transactions avec des icônes et un bouton Supprimer
async function displayTransactions() {
  const userId = localStorage.getItem("idUser");
  if (!userId) {
    console.error("Utilisateur non connecté.");
    return;
  }

  try {
    // Récupérer les transactions et les informations de l'utilisateur en parallèle
    const [transactions, user] = await Promise.all([
      getTransactionsForUser(userId),
      getUserById(userId),
    ]);

    const transactionList = document.getElementById("transactionList");

    if (!transactionList) return;

    if (transactions.length === 0) {
      transactionList.innerHTML = `<p class="text-center text-gray-500">Aucune transaction trouvée.</p>`;
      return;
    }

    // Générer le HTML pour chaque transaction
    transactionList.innerHTML = transactions
      .map((transaction) => {
        const typeLabel = transaction.type === "income" ? "Revenu" : "Dépense";
        const categoryIcon = getCategoryIcon(transaction.category);
        const userPhoto = user?.profileImage
          ? `<img src="${user.profileImage}" alt="Profile" class="transaction-user-photo">`
          : `<img src="assets/img/default-profile.png" alt="Profile" class="transaction-user-photo">`;
        const username = user?.username || "Utilisateur";

        return `
          <div class="transaction-item">
            <div class="transaction-user-info">
              ${userPhoto}
              <span class="transaction-username">${username}</span>
            </div>
            <div class="category-icon">${categoryIcon}</div>
            <div class="transaction-details">
              <p class="transaction-category">${transaction.category}</p>
              <p class="transaction-amount">${transaction.amount.toFixed(2)} €</p>
              <p class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</p>
            </div>
            <button
              class="delete-button"
              data-id="${transaction.id}"
              data-type="${transaction.type}"
              data-category="${transaction.category}"
              data-amount="${transaction.amount}"
            >
              Supprimer
            </button>
          </div>
        `;
      })
      .join("");

    // Ajouter des écouteurs d'événements aux boutons Supprimer
    document.querySelectorAll(".delete-button").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) return;

        const transactionId = parseInt(target.dataset.id || "", 10);
        const type = target.dataset.type || "";
        const category = target.dataset.category || "";
        const amount = parseFloat(target.dataset.amount || "0");

        if (transactionId && userId) {
          if (confirm("Êtes-vous sûr de vouloir supprimer cette transaction ?")) {
            try {
              await deleteTransaction(transactionId, userId, type, category, amount);
              alert("Transaction supprimée avec succès.");
              await displayTransactions();
            } catch (error) {
              console.error("Erreur lors de la suppression de la transaction :", error);
              alert("Une erreur s'est produite. Veuillez réessayer.");
            }
          }
        }
      });
    });
  } catch (error) {
    console.error("Erreur lors de l'affichage des transactions :", error);
    const transactionList = document.getElementById("transactionList");
    if (transactionList) {
      transactionList.innerHTML = `<p class="text-center text-red-500">Une erreur est survenue lors de l'affichage des transactions.</p>`;
    }
  }
}

// Affiche l'image de profil de l'utilisateur connecté
async function displayUserProfile() {
  const userId = localStorage.getItem("idUser");
  if (!userId) {
    console.error("Utilisateur non connecté.");
    return;
  }

  const user = await getUserById(userId);
  const userProfileImage = document.getElementById("userProfileImage") as HTMLImageElement;

  if (user && user.profileImage) {
    userProfileImage.src = user.profileImage;
  } else {
    userProfileImage.src = "assets/img/default-profile.png";
  }
}
function redirectToProfile() {
  window.location.href = 'profile.html'; // Remplacez 'profile.html' par le chemin réel de votre page Profile
}

// Initialisation
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await displayTransactions();
    await displayUserProfile();
  } catch (error) {
    console.error("Erreur lors de l'affichage des données :", error);
  }
});
