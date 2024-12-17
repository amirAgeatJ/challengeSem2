function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 2); // Version 2

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function verifyUser(email: string, password: string): Promise<User | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(email);

    request.onsuccess = () => {
      const user = request.result as User;
      if (user && user.password === password) {
        resolve(user); // Retourne l'objet utilisateur complet si valide
      } else {
        resolve(null); // Mot de passe incorrect ou utilisateur non trouvé
      }
    };
    request.onerror = () => reject(null);
  });
}

// Écouteur du formulaire de connexion
document.getElementById('loginForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;

  try {
    const user = await verifyUser(email, password); // Vérifie les identifiants
    if (user) {
      // Stocke l'ID utilisateur dans le Local Storage
      localStorage.setItem('idUser', user.id);

      alert("Connexion réussie !");
      window.location.href = "about.html"; // Redirige vers la page About
    } else {
      alert("Email ou mot de passe incorrect.");
    }
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    alert("Une erreur est survenue. Veuillez réessayer.");
  }
});

// Interface utilisateur pour le typage
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
}
