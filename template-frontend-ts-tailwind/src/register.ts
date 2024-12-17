function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 2); // Mettre à jour la version pour les modifications

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Crée l'object store avec une clé unique basée sur 'email'
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'email' }); // Clé primaire : email
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Ajoute un utilisateur dans la base IndexedDB
async function addUser(user: User): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction('users', 'readwrite');
  const store = transaction.objectStore('users');

  store.add(user);

  transaction.oncomplete = () => console.log("Utilisateur ajouté avec succès !");
  transaction.onerror = () => console.error("Erreur lors de l'ajout de l'utilisateur");
}

// Écouteur pour le formulaire d'inscription
document.getElementById('registerForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = (document.getElementById('username') as HTMLInputElement).value;
  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;

  // Génération d'un ID utilisateur unique
  const userId = crypto.randomUUID();

  const user: User = { id: userId, username, email, password };

  try {
    await addUser(user);
    alert("Utilisateur inscrit avec succès !");
    window.location.href = 'login.html'; // Redirection vers la page de connexion
  } catch (error) {
    alert("Erreur lors de l'inscription. Cet email existe peut-être déjà.");
  }
});

// Interface utilisateur
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
}