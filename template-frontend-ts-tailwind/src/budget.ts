// Initialise la base de données IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TransactionDatabase', 4); // Version mise à jour pour modifications

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Crée l'Object Store pour les transactions
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      }

      // Crée l'Object Store pour les budgets
      if (!db.objectStoreNames.contains('budgets')) {
        db.createObjectStore('budgets', { keyPath: 'userId' });
      }
      console.log('IndexedDB mise à jour et initialisée.');
    };

    request.onsuccess = () => {
      console.log('IndexedDB ouverte avec succès.');
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error('Erreur d\'ouverture de la base IndexedDB:', event);
      reject(request.error);
    };
  });
}

// Enregistre les budgets pour un utilisateur
async function saveBudget(budgetData: {
  global: number;
  transport: number;
  leisure: number;
  health: number;
  housing: number;
  education: number;
}) {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    alert("Erreur : Utilisateur non connecté.");
    return;
  }

  try {
    const db = await initDB();
    const transaction = db.transaction('budgets', 'readwrite');
    const store = transaction.objectStore('budgets');

    const userBudget = { userId, ...budgetData };

    const request = store.put(userBudget);
    request.onsuccess = () => {
      console.log('Budget enregistré avec succès :', userBudget);
      alert('Budget enregistré avec succès !');
    };
    request.onerror = (e) => {
      console.error('Erreur lors de l\'enregistrement du budget:', e);
      alert('Erreur lors de l\'enregistrement du budget.');
    };
  } catch (error) {
    console.error('Erreur inattendue:', error);
    alert('Une erreur inattendue est survenue.');
  }
}

// Récupère les budgets pour l'utilisateur connecté
async function getBudget(): Promise<any | null> {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    console.error('Utilisateur non connecté.');
    return null;
  }

  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('budgets', 'readonly');
      const store = transaction.objectStore('budgets');
      const request = store.get(userId);

      request.onsuccess = () => {
        console.log('Budget récupéré:', request.result);
        resolve(request.result);
      };
      request.onerror = (e) => {
        console.error('Erreur lors de la récupération du budget:', e);
        reject(e);
      };
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération:', error);
    return null;
  }
}

// Affiche les budgets dans les champs du formulaire
async function displayBudget() {
  try {
    const budget = await getBudget();
    if (!budget) {
      console.log('Aucun budget trouvé.');
      return;
    }

    (document.getElementById('globalBudget') as HTMLInputElement).value = budget.global || '';
    (document.getElementById('transportBudget') as HTMLInputElement).value = budget.transport || '';
    (document.getElementById('leisureBudget') as HTMLInputElement).value = budget.leisure || '';
    (document.getElementById('healthBudget') as HTMLInputElement).value = budget.health || '';
    (document.getElementById('housingBudget') as HTMLInputElement).value = budget.housing || '';
    (document.getElementById('educationBudget') as HTMLInputElement).value = budget.housing || '';
  } catch (error) {
    console.error('Erreur lors de l\'affichage des budgets:', error);
  }
}

// Écouteur pour le bouton d'enregistrement des budgets
document.getElementById('saveBudgets')?.addEventListener('click', async () => {
  const budgets = {
    global: Number((document.getElementById('globalBudget') as HTMLInputElement).value) || 0,
    transport: Number((document.getElementById('transportBudget') as HTMLInputElement).value) || 0,
    leisure: Number((document.getElementById('leisureBudget') as HTMLInputElement).value) || 0,
    health: Number((document.getElementById('healthBudget') as HTMLInputElement).value) || 0,
    housing: Number((document.getElementById('housingBudget') as HTMLInputElement).value) || 0,
    education: Number((document.getElementById('educationBudget') as HTMLInputElement).value) || 0,
  };

  await saveBudget(budgets);
});

// Afficher les budgets lors du chargement de la page
document.addEventListener('DOMContentLoaded', displayBudget);
