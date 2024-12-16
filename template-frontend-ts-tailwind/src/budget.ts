function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TransactionDatabase', 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('budgets')) {
        db.createObjectStore('budgets');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBudget(budgetData: {
  globalBudget: number;
  foodBudget: number;
  transportBudget: number;
  leisureBudget: number;
  healthBudget: number;
}) {
  const db = await initDB();
  const transaction = db.transaction('budgets', 'readwrite');
  const store = transaction.objectStore('budgets');
  store.put(budgetData, 'userBudget');

  alert('Budget enregistré avec succès !');
}

export async function getGlobalBudget(): Promise<number> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('budgets', 'readonly');
    const store = transaction.objectStore('budgets');
    const request = store.get('userBudget');

    request.onsuccess = () => {
      const budget = request.result;
      resolve(budget?.globalBudget || 0);
    };
    request.onerror = () => reject(request.error);
  });
}
