function initDB(): Promise<IDBDatabase> {
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

// Récupère le budget de l'utilisateur connecté
async function getUserBudget(): Promise<any> {
  const userId = localStorage.getItem('idUser');
  if (!userId) return null;

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('budgets', 'readonly');
    const store = transaction.objectStore('budgets');
    const request = store.get(userId);

    request.onsuccess = () => resolve(request.result || {});
    request.onerror = () => reject('Erreur lors de la récupération des budgets.');
  });
}

// Affiche le graphique des budgets
async function displayBudgetChart() {
  const budget = await getUserBudget();
  if (!budget) return;

  const categories = ['transport', 'leisure', 'health', 'housing', 'education'];
  const labels = ['Transport', 'Loisir', 'Santé', 'Logement', 'Éducation'];
  const data = categories.map((cat) => budget[cat] || 0);

  const ctx = (document.getElementById('budgetChart') as HTMLCanvasElement).getContext('2d');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.raw} €`;
            }
          }
        }
      }
    }
  });
}

// Récupère les transactions pour l'utilisateur
async function getUserTransactions(): Promise<any[]> {
  const userId = localStorage.getItem('idUser');
  if (!userId) return [];

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('transactions', 'readonly');
    const store = transaction.objectStore('transactions');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result.filter((t: any) => t.userId === userId));
    request.onerror = () => reject('Erreur lors de la récupération des transactions.');
  });
}

// Affiche les transactions dans la page
async function displayTransactions() {
  const transactions = await getUserTransactions();
  const transactionList = document.getElementById('transactionList');

  if (!transactionList) return;

  if (transactions.length === 0) {
    transactionList.innerHTML = `<p class="text-center text-gray-500">Aucune transaction trouvée.</p>`;
    return;
  }

  transactionList.innerHTML = transactions
    .map((transaction) => `
      <div class="p-4 border border-gray-300 rounded">
        <p><strong>Type :</strong> ${transaction.type}</p>
        <p><strong>Catégorie :</strong> ${transaction.category}</p>
        <p><strong>Montant :</strong> ${transaction.amount.toFixed(2)} €</p>
        <p><strong>Date :</strong> ${new Date(transaction.date).toLocaleDateString()}</p>
      </div>
    `)
    .join('');
}

// Affiche le résumé des budgets
async function displayUserBudget() {
  const budget = await getUserBudget();
  const budgetSummary = document.getElementById('budgetSummary');

  if (!budget || !budgetSummary) return;

  const summaryHTML = `
    <p><strong>Global :</strong> ${budget.global || 0} €</p>
    <p><strong>Transport :</strong> ${budget.transport || 0} €</p>
    <p><strong>Loisir :</strong> ${budget.leisure || 0} €</p>
    <p><strong>Santé :</strong> ${budget.health || 0} €</p>
    <p><strong>Logement :</strong> ${budget.housing || 0} €</p>
    <p><strong>Éducation :</strong> ${budget.education || 0} €</p>
  `;
  budgetSummary.innerHTML = summaryHTML;
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  await displayUserBudget();
  await displayBudgetChart();
  await displayTransactions();
});
