/**************************************************
 * about.ts
 **************************************************/

// ------------------------------
// Variables globales
// ------------------------------
let currentCurrency: 'EUR' | 'USD' = 'EUR';
let usdRate: number = 1; // Taux de conversion USD/EUR (par défaut = 1)

// ------------------------------
// Fonctions utilitaires
// ------------------------------
function initTransactionDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TransactionDatabase', 4);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('budgets')) {
        db.createObjectStore('budgets', { keyPath: 'userId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function initUserDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 7);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ------------------------------
// Fonctions de récupération (CRUD)
// ------------------------------
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

async function displayUserProfile() {
    const userId = localStorage.getItem('idUser');
    if (!userId) {
        console.error('Utilisateur non connecté.');
        return;
    }

    const user = await getUserById(userId);
    const userProfileImage = document.getElementById('userProfileImage') as HTMLImageElement;

    if (user && user.profileImage) {
        userProfileImage.src = user.profileImage;
    } else {
        userProfileImage.src = 'assets/img/default-profile.png'; // Image par défaut
    }
}

async function getTransactionsForUser(userId: string): Promise<any[]> {
  const db = await initTransactionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('transactions', 'readonly');
    const store = transaction.objectStore('transactions');
    const request = store.getAll();

    request.onsuccess = () => {
      const allTransactions = request.result || [];
      const userTransactions = allTransactions.filter((t: any) => t.userId === userId);
      resolve(userTransactions);
    };
    request.onerror = () => reject('Erreur lors de la récupération des transactions.');
  });
}

async function getUserById(userId: string): Promise<any | null> {
  const db = await initUserDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(userId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject("Erreur lors de la récupération de l'utilisateur.");
  });
}

// ------------------------------
// Gestion du taux de change
// ------------------------------
async function fetchUsdRate(): Promise<void> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
    const data = await response.json();
    // Exemple: data.rates.USD = 1.1  => 1 EUR = 1.1 USD
    usdRate = data.rates.USD;
  } catch (error) {
    console.error('Erreur lors de la récupération du taux de change :', error);
  }
}

// ------------------------------
// Fonctions d'affichage
// ------------------------------

/**
 * Affiche le budget de l'utilisateur
 */
async function displayUserBudget() {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    console.error('Utilisateur non connecté.');
    return;
  }

  const budget = await getUserBudget(userId);
  const budgetSummary = document.getElementById('budgetSummary');

  if (!budget || !budgetSummary) {
    console.error("Aucun budget trouvé pour l'utilisateur connecté.");
    return;
  }

  const factor = currentCurrency === 'USD' ? usdRate : 1;
  const symbol = currentCurrency === 'USD' ? '$' : '€';

  budgetSummary.innerHTML = `
    <p><strong>Global :</strong> ${(budget.global || 0) * factor} ${symbol}</p>
    <p><strong>Transport :</strong> ${(budget.transport || 0) * factor} ${symbol}</p>
    <p><strong>Loisir :</strong> ${(budget.leisure || 0) * factor} ${symbol}</p>
    <p><strong>Santé :</strong> ${(budget.health || 0) * factor} ${symbol}</p>
    <p><strong>Logement :</strong> ${(budget.housing || 0) * factor} ${symbol}</p>
    <p><strong>Éducation :</strong> ${(budget.education || 0) * factor} ${symbol}</p>
  `;
}


async function displayTotalBudget() {
    const userId = localStorage.getItem('idUser');
    if (!userId) {
        console.error('Utilisateur non connecté.');
        return;
    }

    const budget = await getUserBudget(userId);
    const totalBudgetElement = document.getElementById('totalBudget');

    if (!budget || !totalBudgetElement) {
        console.error("Aucun budget trouvé pour l'utilisateur connecté.");
        totalBudgetElement.textContent = '0 €';
        return;
    }

    const factor = currentCurrency === 'USD' ? usdRate : 1;
    const symbol = currentCurrency === 'USD' ? '$' : '€';

    const totalBudget = [
        budget.global,
        budget.transport,
        budget.leisure,
        budget.health,
        budget.housing,
        budget.education,
    ].reduce((sum, value) => sum + (value || 0), 0);

    totalBudgetElement.textContent = `${(totalBudget * factor).toFixed(2)} ${symbol}`;
}

/**
 * Affiche la somme des dépenses et des revenus
 */
async function displayTransactionSummary() {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    console.error('Utilisateur non connecté.');
    return;
  }

  const transactions = await getTransactionsForUser(userId);
  if (!transactions || transactions.length === 0) {
    console.log('Aucune transaction trouvée.');
    return;
  }

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpensesElement = document.getElementById('totalExpenses');
  const totalIncomeElement = document.getElementById('totalIncome');

  if (totalExpensesElement && totalIncomeElement) {
    // Détermine le facteur et le symbole
    const factor = currentCurrency === 'USD' ? usdRate : 1;
    const symbol = currentCurrency === 'USD' ? '$' : '€';

    totalExpensesElement.textContent = (totalExpenses * factor).toFixed(2) + ' ' + symbol;
    totalIncomeElement.textContent = (totalIncome * factor).toFixed(2) + ' ' + symbol;
  }
}

function copyTotalBudgetToClipboard() {
  const totalBudgetElement = document.getElementById('totalBudget');
  if (!totalBudgetElement) {
    alert("Impossible de copier : le budget total est introuvable.");
    return;
  }

  const totalBudgetText = totalBudgetElement.textContent || "0 €";

  // Vérifie si la Web API Clipboard est disponible
  if (navigator.clipboard) {
    navigator.clipboard.writeText(totalBudgetText).then(
      () => {
        alert(`Budget total copié : ${totalBudgetText}`);
      },
      (err) => {
        console.error("Erreur lors de la copie dans le presse-papiers :", err);
        alert("Une erreur s'est produite lors de la copie dans le presse-papiers.");
      }
    );
  } else {
    alert("La fonctionnalité de copie n'est pas disponible sur votre navigateur.");
  }
}

/**
 * Affiche la liste des transactions
 */
async function displayTransactions() {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    console.error('Utilisateur non connecté.');
    return;
  }

  const transactions = await getTransactionsForUser(userId);
  const transactionList = document.getElementById('transactionList');

  if (!transactionList) return;

  if (transactions.length === 0) {
    transactionList.innerHTML = `<p class="text-center text-gray-500">Aucune transaction trouvée.</p>`;
    return;
  }

  // Enrichit les transactions avec infos user
  const enhancedTransactions = await Promise.all(
    transactions.map(async (transaction) => {
      const user = await getUserById(transaction.userId);
      return {
        ...transaction,
        username: user?.username || 'Utilisateur inconnu',
        userPhoto: user?.profileImage || '',
      };
    })
  );

  // Conversion
  const factor = currentCurrency === 'USD' ? usdRate : 1;
  const symbol = currentCurrency === 'USD' ? '$' : '€';

  transactionList.innerHTML = enhancedTransactions
    .map(
      (transaction) => {
        const convertedAmount = (transaction.amount * factor).toFixed(2);
        return `
          <div class="p-4 border border-gray-300 rounded flex items-center gap-4">
            <img src="${transaction.userPhoto}" alt="Photo utilisateur" class="w-10 h-10 rounded-full">
            <div>
              <p><strong>Utilisateur :</strong> ${transaction.username}</p>
              <p><strong>Type :</strong> ${transaction.type}</p>
              <p><strong>Catégorie :</strong> ${transaction.category}</p>
              <p><strong>Montant :</strong> ${convertedAmount} ${symbol}</p>
              <p><strong>Date :</strong> ${new Date(transaction.date).toLocaleDateString()}</p>
            </div>
          </div>
        `;
      }
    )
    .join('');
}

// ------------------------------
// Code principal : DOMContentLoaded
// ------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1) Récupère le taux USD/EUR au chargement
    await fetchUsdRate();

    // 2) Affiche initialement (en EUR par défaut)
    await displayTotalBudget();
    await displayUserBudget();
    await displayTransactions();
    await displayTransactionSummary();
    await displayUserProfile(); // Affiche l'image du profil utilisateur


    // 3) Gère le bouton de conversion (basculer EUR <-> USD)
    const toggleCurrencyButton = document.getElementById('toggleCurrencyButton');
    if (toggleCurrencyButton) {
      toggleCurrencyButton.addEventListener('click', async () => {
        if (currentCurrency === 'EUR') {
          currentCurrency = 'USD';
          toggleCurrencyButton.textContent = 'Convertir en EUR';
        } else {
          currentCurrency = 'EUR';
          toggleCurrencyButton.textContent = 'Convertir en USD';
        }

        // On réaffiche tout après changement de devise
        await displayTotalBudget();
        await displayUserBudget();
        await displayTransactions();
        await displayTransactionSummary();
      });
    }

 const copyBudgetButton = document.getElementById('copyBudgetButton');
  if (copyBudgetButton) {
    copyBudgetButton.addEventListener('click', copyTotalBudgetToClipboard);
  }

    // 4) Gère le bouton plein écran
    const fullscreenButton = document.getElementById('fullscreenButton');
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      });
    }

  } catch (error) {
    console.error('Erreur lors de l’affichage des données :', error);
  }
});
