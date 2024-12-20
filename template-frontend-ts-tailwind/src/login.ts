// Initialise la base de données IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 6);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Vérifie les identifiants utilisateur
async function verifyUser(email: string, password: string): Promise<User | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    const index = store.index('email'); // Utilisez l'index "email"
    const request = index.get(email);

    request.onsuccess = () => {
      const user = request.result as User;
      if (user && user.password === password) {
        resolve(user); // Identifiants valides
      } else {
        resolve(null); // Identifiants invalides
      }
    };

    request.onerror = () => reject('Erreur lors de la vérification des identifiants.');
  });
}

// Gestionnaire de connexion
document.getElementById('loginForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;

  try {
    const user = await verifyUser(email, password);
    if (user) {
      localStorage.setItem('idUser', user.id);
      alert("Connexion réussie !");
      window.location.href = 'about.html';
    } else {
      alert("Email ou mot de passe incorrect.");
    }
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    alert("Une erreur est survenue.");
  }
});
