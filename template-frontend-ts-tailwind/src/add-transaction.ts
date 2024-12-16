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

async function addTransaction(transaction: Transaction): Promise<void> {
  const db = await initDB();
  const transactionDB = db.transaction('transactions', 'readwrite');
  const store = transactionDB.objectStore('transactions');
  store.add(transaction);
}

async function getTransactions(): Promise<Transaction[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('transactions', 'readonly');
    const store = transaction.objectStore('transactions');
    const request = store.getAll();

    request.onsuccess = () => {
      const transactions = (request.result as Transaction[]).map((t) => ({
        ...t,
        date: new Date(t.date),
      }));
      resolve(transactions);
    };
    request.onerror = () => reject(request.error);
  });
}

function getLocation(): void {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const locationName = await getAddressFromCoordinates(latitude, longitude);
        (document.getElementById('location') as HTMLInputElement).value = locationName;
      },
      (error) => {
        alert("Impossible d'obtenir la position.");
        console.error(error);
      }
    );
  } else {
    alert("La géolocalisation n'est pas prise en charge par ce navigateur.");
  }
}

async function getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
  const apiKey = '57d7a23fd746459099536889ec38e85d';
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.results[0]?.formatted || 'Adresse inconnue';
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'adresse', error);
    return 'Adresse inconnue';
  }
}

async function displayTransactions(): Promise<void> {
  const transactionList = document.getElementById('transactionList');
  if (!transactionList) return;

  const transactions = await getTransactions();
  if (transactions.length === 0) {
    transactionList.innerHTML = "<p class='text-center text-gray-500'>Aucune transaction trouvée.</p>";
    return;
  }

  transactionList.innerHTML = transactions
    .map(
      (transaction) => `
        <div class="p-4 border border-gray-300 rounded">
            <p><strong>Type :</strong> ${transaction.type}</p>
            <p><strong>Catégorie :</strong> ${transaction.category}</p>
            <p><strong>Montant :</strong> ${transaction.amount.toFixed(2)} EUR</p>
            <p><strong>Lieu :</strong> ${transaction.location}</p>
            <p><strong>Date :</strong> ${transaction.date.toLocaleDateString()}</p>
        </div>
    `
    )
    .join('');
}

document.getElementById('transactionForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const type = (document.getElementById('transactionType') as HTMLSelectElement).value;
  const category = (document.getElementById('category') as HTMLSelectElement).value;
  const amountInput = document.getElementById('amount') as HTMLInputElement;
  const amount = amountInput.valueAsNumber;
  const location = (document.getElementById('location') as HTMLInputElement).value;

  if (!type || !category || !location || isNaN(amount) || amount <= 0) {
    alert('Veuillez remplir tous les champs correctement, y compris un montant valide.');
    amountInput.focus();
    return;
  }

  const transaction: Transaction = {
    type,
    category,
    amount,
    location,
    date: new Date(),
  };

  await addTransaction(transaction);
  alert('Transaction ajoutée avec succès !');
  window.location.href = 'about.html';
});

// Initialisation des événements
document.getElementById('getLocation')?.addEventListener('click', getLocation);
document.addEventListener('DOMContentLoaded', displayTransactions);
