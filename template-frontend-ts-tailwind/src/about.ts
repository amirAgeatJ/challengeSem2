
// Initialise la base de données
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TransactionDatabase', 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}


async function getTransactions(): Promise<Transaction[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('transactions', 'readonly');
    const store = transaction.objectStore('transactions');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as Transaction[]);
    request.onerror = () => reject(request.error);
  });
}

async function fetchUSDEURRate(): Promise<number> {
  const url = `https://api.exchangerate-api.com/v4/latest/EUR`;
  try {
    debugger
    const response = await fetch(url);
    const data = await response.json();
    return data.rates.USD;
  } catch (error) {
    console.error("Erreur lors de la récupération du taux de conversion", error);
    return 1;
  }
}

async function displayTransactions(conversionRate: number = 1, targetCurrency: string = 'EUR') {
  const transactionList = document.getElementById('transactionList');
  if (!transactionList) return;

  const transactions = await getTransactions();
  if (transactions.length === 0) {
    transactionList.innerHTML = "<p class='text-center text-gray-500'>Aucune transaction trouvée.</p>";
    return;
  }

  transactionList.innerHTML = transactions.map(transaction => `
        <div class="p-4 border border-gray-300 rounded">
            <p><strong>Type :</strong> ${transaction.type}</p>
            <p><strong>Catégorie :</strong> ${transaction.category}</p>
            <p><strong>Montant :</strong> ${(transaction.amount * conversionRate).toFixed(2)} ${targetCurrency}</p>
            <p><strong>Lieu :</strong> ${transaction.location}</p>
            <p><strong>Date :</strong> ${new Date(transaction.date).toLocaleDateString()}</p>
        </div>
    `).join('');
}

let isEuro = true;
async function toggleCurrency() {
  const rate = await fetchUSDEURRate();
  const conversionRate = isEuro ? rate : 1 / rate;
  const targetCurrency = isEuro ? 'USD' : 'EUR';

  displayTransactions(conversionRate, targetCurrency);

  isEuro = !isEuro;
  document.getElementById('currentCurrency')!.innerText = `Affichage en : ${targetCurrency}`;
  document.getElementById('toggleCurrencyButton')!.innerText = `Convertir en ${isEuro ? 'USD' : 'EUR'}`;
}

displayTransactions();
document.getElementById('toggleCurrencyButton')?.addEventListener('click', toggleCurrency);
