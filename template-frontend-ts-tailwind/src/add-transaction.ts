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

async function addTransaction(transaction: Transaction) {
  const db = await initDB();
  const transactionDB = db.transaction('transactions', 'readwrite');
  const store = transactionDB.objectStore('transactions');
  store.add(transaction);
}

function getLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      const locationName = await getAddressFromCoordinates(latitude, longitude);
      (document.getElementById('location') as HTMLInputElement).value = locationName;
    }, (error) => {
      alert("Impossible d'obtenir la position.");
      console.error(error);
    });
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
    return data.results[0].formatted;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'adresse", error);
    return "Adresse inconnue";
  }
}

document.getElementById('getLocation')?.addEventListener('click', getLocation);

document.getElementById('transactionForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const type = (document.getElementById('transactionType') as HTMLSelectElement).value;
  const category = (document.getElementById('category') as HTMLInputElement).value;
  const amount = (document.getElementById('amount') as HTMLInputElement).valueAsNumber;
  const location = (document.getElementById('location') as HTMLInputElement).value;

  if (!type || !category || isNaN(amount) || !location) {
    alert("Veuillez remplir tous les champs.");
    return;
  }

  const transaction: Transaction = {
    type,
    category,
    amount,
    location,
    date: new Date()
  };

  await addTransaction(transaction);
  alert("Transaction ajoutée avec succès !");
  window.location.href = "about.html";
});
