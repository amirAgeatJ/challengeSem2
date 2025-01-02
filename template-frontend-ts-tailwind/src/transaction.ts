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
      const request = indexedDB.open("UserDatabase", 6);
  
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
  async function deleteTransaction(transactionId: number, userId: string, type: string, category: string, amount: number): Promise<void> {
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

  
  async function getUserBudget(userId: string): Promise<any | null> {
    const db = await initTransactionDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('budgets', 'readonly');
      const store = transaction.objectStore('budgets');
      const request = store.get(userId);
  
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject('Erreur lors de la récupération du budget.');
    });
  }

  // Met à jour le budget après suppression d'une transaction
  async function updateBudgetAfterDeletion(userId: string, type: string, category: string, amount: number): Promise<void> {
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
  
  // Affiche les transactions avec un bouton Supprimer
  async function displayTransactions() {
    const userId = localStorage.getItem("idUser");
    if (!userId) {
      console.error("Utilisateur non connecté.");
      return;
    }
  
    const transactions = await getTransactionsForUser(userId);
    const transactionList = document.getElementById("transactionList");
  
    if (!transactionList) return;
  
    if (transactions.length === 0) {
      transactionList.innerHTML = `<p class="text-center text-gray-500">Aucune transaction trouvée.</p>`;
      return;
    }
  
    const enhancedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const user = await getUserById(transaction.userId);
        return {
          ...transaction,
          username: user?.username || "Utilisateur inconnu",
          userPhoto: user?.profileImage || "",
        };
      })
    );
  
    transactionList.innerHTML = enhancedTransactions
      .map(
        (transaction) => `
          <div class="p-4 border border-gray-300 rounded flex items-center gap-4">
            <img src="${transaction.userPhoto}" alt="Photo utilisateur" class="w-10 h-10 rounded-full">
            <div class="flex-grow">
              <p><strong>Utilisateur :</strong> ${transaction.username}</p>
              <p><strong>Type :</strong> ${transaction.type}</p>
              <p><strong>Catégorie :</strong> ${transaction.category}</p>
              <p><strong>Montant :</strong> ${transaction.amount.toFixed(2)} €</p>
              <p><strong>Date :</strong> ${new Date(transaction.date).toLocaleDateString()}</p>
            </div>
            <button class="delete-button bg-red-500 text-white p-2 rounded" data-id="${transaction.id}" data-type="${transaction.type}" data-category="${transaction.category}" data-amount="${transaction.amount}">Supprimer</button>
          </div>
        `
      )
      .join("");
  
    // Ajoute des gestionnaires d'événements pour les boutons Supprimer
    document.querySelectorAll(".delete-button").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const target = event.target as HTMLButtonElement;
        const transactionId = parseInt(target.dataset.id || "", 10);
        const type = target.dataset.type || "";
        const category = target.dataset.category || "";
        const amount = parseFloat(target.dataset.amount || "0");
  
        if (transactionId && userId) {
          if (confirm("Êtes-vous sûr de vouloir supprimer cette transaction ?")) {
            try {
              await deleteTransaction(transactionId, userId, type, category, amount);
              alert("Transaction supprimée avec succès.");
              await displayTransactions(); // Recharge les transactions après suppression
            } catch (error) {
              console.error("Erreur lors de la suppression de la transaction :", error);
              alert("Une erreur est survenue. Veuillez réessayer.");
            }
          }
        }
      });
    });
  }
  
  // Initialisation
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await displayTransactions();
    } catch (error) {
      console.error("Erreur lors de l’affichage des données :", error);
    }
  });
  