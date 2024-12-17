// Initialise la base de données IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TransactionDatabase', 4); // Version incrémentée

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
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Interface pour une transaction
interface Transaction {
  id?: number;        // Auto-incrémenté par IndexedDB
  userId: string;     // ID utilisateur
  type: string;       // "income" ou "expense"
  category: string;   // Catégorie de la transaction
  amount: number;     // Montant de la transaction
  location: string;   // Lieu
  date: Date;         // Date
}

// Récupère les budgets existants pour un utilisateur
async function getUserBudget(userId: string): Promise<any> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('budgets', 'readonly');
    const store = transaction.objectStore('budgets');
    const request = store.get(userId);

    request.onsuccess = () => {
      resolve(request.result || { userId, global: 0, transport: 0, leisure: 0, health: 0, housing: 0 });
    };
    request.onerror = () => reject(request.error);
  });
}

// Met à jour les budgets après l'ajout d'une transaction
async function updateBudgets(userId: string, type: string, category: string, amount: number): Promise<void> {
  try {
    // Étape 1 : Récupération du budget existant
    const existingBudget = await getUserBudget(userId);

    // Étape 2 : Initialisation des budgets et ajustement des valeurs
    const updatedBudget = { ...existingBudget };
    const adjustment = type === 'income' ? amount : -amount;

    updatedBudget.global += adjustment;

    // Vérifier si la catégorie existe sinon l'initialiser
    if (!updatedBudget[category]) {
      console.warn(`La catégorie '${category}' n'existe pas dans le budget. Initialisation à 0.`);
      updatedBudget[category] = 0;
    }
    updatedBudget[category] += adjustment;

    // Étape 3 : Sauvegarde des modifications dans IndexedDB
    const db = await initDB();
    const transaction = db.transaction('budgets', 'readwrite');
    const store = transaction.objectStore('budgets');

    return new Promise<void>((resolve, reject) => {
      const request = store.put(updatedBudget);
      request.onsuccess = () => {
        console.log('Budgets mis à jour avec succès:', updatedBudget);
        resolve();
      };
      request.onerror = (e) => {
        console.error('Erreur lors de la mise à jour des budgets:', e);
        reject(e);
      };
    });
  } catch (error) {
    console.error('Erreur dans updateBudgets:', error);
  }
}

// Ajoute une transaction dans IndexedDB
async function addTransaction(transaction: Transaction): Promise<void> {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    const request = store.add(transaction);

    request.onsuccess = () => {
      console.log('Transaction ajoutée avec succès !', transaction);
      resolve();
    };
    request.onerror = (e) => {
      console.error('Erreur lors de l\'ajout de la transaction:', e);
      reject(e);
    };
  });
}

// Fonction pour obtenir l'adresse à partir des coordonnées avec OpenCageData
const OPEN_CAGE_API_KEY = '57d7a23fd746459099536889ec38e85d'; // Remplacez par votre clé OpenCageData
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${OPEN_CAGE_API_KEY}`);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0].formatted; // Adresse formatée
    } else {
      return 'Adresse inconnue';
    }
  } catch (error) {
    console.error('Erreur lors du géocodage inverse:', error);
    return 'Erreur lors de la récupération de l\'adresse';
  }
}

// Gestion de la localisation pour convertir en adresse
function getLocation(): void {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // Récupérer l'adresse via l'API
      const address = await reverseGeocode(lat, lon);

      const locationInput = document.getElementById('location') as HTMLInputElement;
      locationInput.value = address;
    }, (error) => {
      console.error('Erreur lors de la géolocalisation:', error);
      alert('Impossible de récupérer la localisation.');
    });
  } else {
    alert('La géolocalisation n\'est pas prise en charge par ce navigateur.');
  }
}
document.getElementById('getLocation')?.addEventListener('click', getLocation);

// Gestion de l'ajout d'une transaction via le formulaire
document.getElementById('transactionForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Récupération des valeurs du formulaire
  const type = (document.getElementById('transactionType') as HTMLSelectElement).value;
  const category = (document.getElementById('category') as HTMLSelectElement).value;
  const amountInput = document.getElementById('amount') as HTMLInputElement;
  const amount = amountInput.valueAsNumber;
  const location = (document.getElementById('location') as HTMLInputElement).value;

  if (!type || !category || isNaN(amount) || amount <= 0) {
    alert('Veuillez remplir correctement tous les champs.');
    return;
  }

  // Vérification de l'ID utilisateur
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    alert('Erreur : Utilisateur non connecté.');
    return;
  }

  // Création de la transaction
  const transaction: Transaction = {
    userId,
    type,
    category,
    amount,
    location,
    date: new Date(),
  };

  try {
    // Ajouter la transaction et mettre à jour les budgets
    await addTransaction(transaction);
    await updateBudgets(userId, type, category, amount);

    alert('Transaction ajoutée et budgets mis à jour avec succès !');
    window.location.href = 'about.html';
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la transaction ou de la mise à jour des budgets:', error);
    alert('Une erreur est survenue. Veuillez réessayer.');
  }
});
