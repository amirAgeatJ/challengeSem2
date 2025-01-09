// Initialise la base de données IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TransactionDatabase', 4);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Crée les Object Stores si nécessaires
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

// Enregistre un budget dans IndexedDB
async function saveBudget(budgetData: {
  global: number;
  transport: number;
  leisure: number;
  health: number;
  housing: number;
  alimentaire: number;
  education: number;
}) {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    alert('Erreur : Utilisateur non connecté.');
    return;
  }

  const db = await initDB();
  const transaction = db.transaction('budgets', 'readwrite');
  const store = transaction.objectStore('budgets');

  const userBudget = { userId, ...budgetData };

  return new Promise((resolve, reject) => {
    const request = store.put(userBudget);
    request.onsuccess = () => {
      alert('Budget enregistré avec succès !');
      resolve(request.result);
    };
    request.onerror = () => {
      alert('Erreur lors de l\'enregistrement du budget.');
      reject(request.error);
    };
  });
}

// Récupère un budget depuis IndexedDB
async function getBudget(): Promise<any | null> {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    console.error('Utilisateur non connecté.');
    return null;
  }

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('budgets', 'readonly');
    const store = transaction.objectStore('budgets');
    const request = store.get(userId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject('Erreur lors de la récupération du budget.');
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

// Affiche les budgets dans les champs du formulaire
async function displayBudget() {
  const budget = await getBudget();
  if (!budget) {
    console.log('Aucun budget trouvé.');
    return;
  }

  (document.getElementById('transportBudget') as HTMLInputElement).value = budget.transport || '';
  (document.getElementById('leisureBudget') as HTMLInputElement).value = budget.leisure || '';
  (document.getElementById('healthBudget') as HTMLInputElement).value = budget.health || '';
  (document.getElementById('housingBudget') as HTMLInputElement).value = budget.housing || '';
  (document.getElementById('alimentaireBudget') as HTMLInputElement).value = budget.alimentaire || '';
  (document.getElementById('educationBudget') as HTMLInputElement).value = budget.education || '';
}

// Affiche un graphique de répartition des budgets
async function displayBudgetChart() {
  const budget = await getBudget();
  if (!budget) {
    console.error("Aucun budget trouvé pour l'utilisateur connecté.");
    return;
  }

  const categories = ['transport', 'leisure', 'health', 'housing', 'alimentaire', 'education'];
  const labels = ['Transport', 'Loisir', 'Santé', 'Logement', 'Alimentaire', 'Éducation'];
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

// Gestion des événements
document.getElementById('saveBudgets')?.addEventListener('click', async () => {
  const budgets = {
    transport: Number((document.getElementById('transportBudget') as HTMLInputElement).value) || 0,
    leisure: Number((document.getElementById('leisureBudget') as HTMLInputElement).value) || 0,
    health: Number((document.getElementById('healthBudget') as HTMLInputElement).value) || 0,
    housing: Number((document.getElementById('housingBudget') as HTMLInputElement).value) || 0,
    alimentaire: Number((document.getElementById('alimentaireBudget') as HTMLInputElement).value) || 0,
    education: Number((document.getElementById('educationBudget') as HTMLInputElement).value) || 0,
  };

  await saveBudget(budgets);
  await displayBudgetChart();
});

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  await displayBudget();
  await displayBudgetChart();
  await displayUserProfile();
});