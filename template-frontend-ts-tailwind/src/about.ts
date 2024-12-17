// Initialise la base de données IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TransactionDatabase', 4);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Crée l'Object Store pour les transactions
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      }

      // Crée l'Object Store pour les budgets
      if (!db.objectStoreNames.contains('budgets')) {
        db.createObjectStore('budgets', { keyPath: 'userId' }); // Clé basée sur l'ID utilisateur
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Interface des Transactions
interface Transaction {
  id: number;
  userId: string;
  type: string;
  category: string;
  amount: number;
  location: string;
  date: string;
}

// Récupère toutes les transactions de l'utilisateur connecté
async function getUserTransactions(): Promise<Transaction[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const userId = localStorage.getItem('idUser'); // ID utilisateur connecté
    if (!userId) {
      alert('Erreur : Utilisateur non identifié. Veuillez vous reconnecter.');
      resolve([]);
      return;
    }

    const transaction = db.transaction('transactions', 'readonly');
    const store = transaction.objectStore('transactions');
    const request = store.getAll();

    request.onsuccess = () => {
      const allTransactions = request.result as Transaction[];
      const userTransactions = allTransactions.filter(t => t.userId === userId);
      resolve(userTransactions);
    };

    request.onerror = () => reject(request.error);
  });
}

// Récupère le budget pour l'utilisateur connecté
async function getUserBudget(): Promise<any | null> {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    alert('Erreur : Utilisateur non connecté.');
    return null;
  }

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('budgets', 'readonly');
    const store = transaction.objectStore('budgets');
    const request = store.get(userId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Affiche les budgets de l'utilisateur connecté
async function displayUserBudget() {
  const budget = await getUserBudget();
  const budgetDisplay = document.getElementById('budgetDisplay');

  if (!budget) {
    budgetDisplay!.innerHTML = `<p class="text-gray-500">Aucun budget enregistré pour cet utilisateur.</p>`;
    return;
  }

  const budgetHTML = `
    <div class="p-4 bg-blue-50 border rounded shadow">
      <h3 class="text-lg font-bold mb-2">Budgets Actuels</h3>
      <p><strong>Global :</strong> ${budget.global || 0} €</p>
      <p><strong>Transport :</strong> ${budget.transport || 0} €</p>
      <p><strong>Loisir :</strong> ${budget.leisure || 0} €</p>
      <p><strong>Santé :</strong> ${budget.health || 0} €</p>
      <p><strong>Logement :</strong> ${budget.housing || 0} €</p>
      <p><strong>Education :</strong> ${budget.education || 0} €</p>
    </div>
  `;
  budgetDisplay!.innerHTML = budgetHTML;
}

// Affiche les transactions de l'utilisateur connecté
async function displayTransactions(conversionRate: number = 1, targetCurrency: string = 'EUR') {
  const transactionList = document.getElementById('transactionList');
  if (!transactionList) return;

  const transactions = await getUserTransactions();
  if (transactions.length === 0) {
    transactionList.innerHTML = "<p class='text-center text-gray-500'>Aucune transaction trouvée pour cet utilisateur.</p>";
    return;
  }

  transactionList.innerHTML = transactions
    .map(
      (transaction) => `
        <div class="p-4 border border-gray-300 rounded">
            <p><strong>Type :</strong> ${transaction.type}</p>
            <p><strong>Catégorie :</strong> ${transaction.category}</p>
            <p><strong>Montant :</strong> ${(transaction.amount * conversionRate).toFixed(2)} ${targetCurrency}</p>
            <p><strong>Lieu :</strong> ${transaction.location}</p>
            <p><strong>Date :</strong> ${new Date(transaction.date).toLocaleDateString()}</p>
        </div>
    `
    )
    .join('');
}

// Récupère le taux de conversion USD/EUR
async function fetchUSDEURRate(): Promise<number> {
  const url = `https://api.exchangerate-api.com/v4/latest/EUR`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.rates.USD;
  } catch (error) {
    console.error('Erreur lors de la récupération du taux de conversion', error);
    return 1;
  }
}

// Basculer entre EUR et USD
let isEuro = true;
async function toggleCurrency() {
  const rate = await fetchUSDEURRate();
  const conversionRate = isEuro ? rate : 1;
  const targetCurrency = isEuro ? 'USD' : 'EUR';

  displayTransactions(conversionRate, targetCurrency);

  isEuro = !isEuro;
  document.getElementById('currentCurrency')!.innerText = `Affichage en : ${targetCurrency}`;
  document.getElementById('toggleCurrencyButton')!.innerText = `Convertir en ${isEuro ? 'USD' : 'EUR'}`;
}

// Initialisation des événements
document.addEventListener('DOMContentLoaded', () => {
  displayUserBudget(); // Affiche le budget
  displayTransactions(); // Affiche les transactions
  document.getElementById('toggleCurrencyButton')?.addEventListener('click', toggleCurrency);
});
