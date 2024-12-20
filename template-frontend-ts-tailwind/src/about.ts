// Initialise IndexedDB pour TransactionDatabase
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

// Initialise IndexedDB pour UserDatabase
function initUserDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 6);

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

// Récupère le budget d'un utilisateur
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

// Récupère les transactions pour un utilisateur
async function getTransactionsForUser(userId: string): Promise<any[]> {
  const db = await initTransactionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('transactions', 'readonly');
    const store = transaction.objectStore('transactions');
    const request = store.getAll();

    request.onsuccess = () =>
      resolve((request.result || []).filter((t: any) => t.userId === userId));
    request.onerror = () => reject('Erreur lors de la récupération des transactions.');
  });
}

// Récupère un utilisateur par ID
async function getUserById(userId: string): Promise<any | null> {
  const db = await initUserDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(userId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject('Erreur lors de la récupération de l’utilisateur.');
  });
}

// Affiche le résumé des budgets
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

  budgetSummary.innerHTML = `
    <p><strong>Global :</strong> ${budget.global || 0} €</p>
    <p><strong>Transport :</strong> ${budget.transport || 0} €</p>
    <p><strong>Loisir :</strong> ${budget.leisure || 0} €</p>
    <p><strong>Santé :</strong> ${budget.health || 0} €</p>
    <p><strong>Logement :</strong> ${budget.housing || 0} €</p>
    <p><strong>Éducation :</strong> ${budget.education || 0} €</p>
  `;
}

// Affiche le graphique des budgets
async function displayBudgetChart() {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    console.error('Utilisateur non connecté.');
    return;
  }

  const budget = await getUserBudget(userId);
  if (!budget) {
    console.error("Aucun budget trouvé pour l'utilisateur connecté.");
    return;
  }

  const categories = ['transport', 'leisure', 'health', 'housing', 'education'];
  const labels = ['Transport', 'Loisir', 'Santé', 'Logement', 'Éducation'];
  const data = categories.map((cat) => budget[cat] || 0);

  const canvas = document.getElementById('budgetChart') as HTMLCanvasElement;
  const ctx = canvas?.getContext('2d');

  if (!ctx) {
    console.error('Impossible d’obtenir le contexte du Canvas.');
    return;
  }

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${context.raw} €`,
          },
        },
      },
    },
  });
}

// Affiche les transactions avec informations utilisateur
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

  transactionList.innerHTML = enhancedTransactions
    .map(
      (transaction) => `
        <div class="p-4 border border-gray-300 rounded flex items-center gap-4">
          <img src="${transaction.userPhoto}" alt="Photo utilisateur" class="w-10 h-10 rounded-full">
          <div>
            <p><strong>Utilisateur :</strong> ${transaction.username}</p>
            <p><strong>Type :</strong> ${transaction.type}</p>
            <p><strong>Catégorie :</strong> ${transaction.category}</p>
            <p><strong>Montant :</strong> ${transaction.amount.toFixed(2)} €</p>
            <p><strong>Date :</strong> ${new Date(transaction.date).toLocaleDateString()}</p>
          </div>
        </div>
      `
    )
    .join('');
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await displayUserBudget();
    await displayBudgetChart();
    await displayTransactions();
  } catch (error) {
    console.error('Erreur lors de l’affichage des données :', error);
  }
});
