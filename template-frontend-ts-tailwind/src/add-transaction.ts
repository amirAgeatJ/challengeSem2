// Initialise la base de données IndexedDB
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

// Interface pour une transaction
interface Transaction {
  id?: number;
  userId: string;
  type: string;
  category: string;
  amount: number;
  location: string;
  date: Date;
}

// Fonction pour obtenir l'adresse via OpenCageData API
const OPEN_CAGE_API_KEY = '57d7a23fd746459099536889ec38e85d';
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${OPEN_CAGE_API_KEY}`
    );
    const data = await response.json();
    return data.results?.[0]?.formatted || 'Adresse inconnue';
  } catch (error) {
    console.error('Erreur lors du géocodage inverse:', error);
    return 'Erreur localisation';
  }
}

// Récupère le budget pour un utilisateur donné
async function getUserBudget(userId: string): Promise<any> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('budgets', 'readonly');
    const store = transaction.objectStore('budgets');
    const request = store.get(userId);

    request.onsuccess = () =>
      resolve(request.result || { userId, global: 0, transport: 0, leisure: 0, health: 0, housing: 0 });
    request.onerror = () => reject(request.error);
  });
}

// Met à jour les budgets
async function updateBudgets(userId: string, type: string, category: string, amount: number): Promise<void> {
  const existingBudget = await getUserBudget(userId);
  const updatedBudget = { ...existingBudget };
  const adjustment = type === 'income' ? amount : -amount;

  updatedBudget.global += adjustment;
  updatedBudget[category] = (updatedBudget[category] || 0) + adjustment;

  const db = await initDB();
  const tx = db.transaction('budgets', 'readwrite');
  const store = tx.objectStore('budgets');
  store.put(updatedBudget);

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e);
  });
}

// Ajoute une transaction
async function addTransaction(transaction: Transaction): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('transactions', 'readwrite');
  const store = tx.objectStore('transactions');
  store.add(transaction);

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e);
  });
}

// Fonction pour afficher une notification
function showNotification(title: string, body: string) {
  if (!("Notification" in window)) {
    alert("Les notifications ne sont pas prises en charge par votre navigateur.");
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {

      new Notification(title, { body });
    } else if (permission === "denied") {
      alert("Vous avez refusé les notifications. Activez-les dans les paramètres du navigateur.");
    }
  });
}

// Gestion de la localisation
function getLocation(): void {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const address = await reverseGeocode(lat, lon);
      const locationInput = document.getElementById('location') as HTMLInputElement;
      locationInput.value = address;
    });
  } else {
    alert("La géolocalisation n'est pas prise en charge par ce navigateur.");
  }
}
document.getElementById('getLocation')?.addEventListener('click', getLocation);

// Gestion du formulaire pour ajouter une transaction
document.getElementById('transactionForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const type = (document.getElementById('transactionType') as HTMLSelectElement).value;
  const category = (document.getElementById('category') as HTMLSelectElement).value;
  const amount = parseFloat((document.getElementById('amount') as HTMLInputElement).value);
  const location = (document.getElementById('location') as HTMLInputElement).value;

  if (!type || !category || isNaN(amount) || amount <= 0) {
    alert("Veuillez remplir tous les champs correctement.");
    return;
  }

  const userId = localStorage.getItem('idUser');
  if (!userId) {
    alert("Utilisateur non connecté.");
    return;
  }

  const transaction: Transaction = {
    userId,
    type,
    category,
    amount,
    location,
    date: new Date(),
  };

  try {
    await addTransaction(transaction);
    await updateBudgets(userId, type, category, amount);
    showNotification("Transaction ajoutée", `Votre transaction de ${amount} € a été ajoutée avec succès.`);
    alert("Transaction ajoutée avec succès !");
    window.location.href = "about.html";
  } catch (error) {
    console.error("Erreur lors de l'ajout de la transaction:", error);
    alert("Une erreur est survenue. Veuillez réessayer.");
  }
});
