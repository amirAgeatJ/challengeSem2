// Interface utilisateur
interface User {
  id: string; // Clé primaire
  username: string;
  email: string;
  password: string;
  profileImage?: string; // Facultatif
}

// Initialise IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 7); // Version 7 avec `id` comme clé primaire

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

// Vérifie les identifiants utilisateur (email et mot de passe)
async function verifyUser(email: string, password: string): Promise<User | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    const request = store.getAll(); // Récupère tous les utilisateurs

    request.onsuccess = () => {
      const users = request.result as User[];
      const user = users.find((u) => u.email === email && u.password === password);
      if (user) {
        resolve(user);
      } else {
        resolve(null); // Aucun utilisateur correspondant trouvé
      }
    };

    request.onerror = () => reject(null);
  });
}

// Gestion de la connexion
document.getElementById('loginForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = (document.getElementById('email') as HTMLInputElement).value.trim();
  const password = (document.getElementById('password') as HTMLInputElement).value.trim();

  try {
    const user = await verifyUser(email, password);
    if (user) {
      // Stocke l'ID utilisateur dans le Local Storage
      localStorage.setItem('idUser', user.id);
      localStorage.setItem('userName', user.username);

      alert('Connexion réussie !');
      window.location.href = 'about.html'; // Redirection vers une page
    } else {
      alert('Email ou mot de passe incorrect.');
    }
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    alert('Une erreur est survenue. Veuillez réessayer.');
  }
});

// Gestionnaire d'inscription
document.getElementById('registerForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = (document.getElementById('username') as HTMLInputElement).value.trim();
  const email = (document.getElementById('email') as HTMLInputElement).value.trim();
  const password = (document.getElementById('password') as HTMLInputElement).value.trim();
  const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value.trim();

  // Vérification des mots de passe
  if (password !== confirmPassword) {
    const errorElement = document.getElementById('passwordError') as HTMLElement;
    errorElement.classList.remove('hidden');
    return;
  }

  const userId = crypto.randomUUID();
  const user: User = { id: userId, username, email, password };

  try {
    const db = await initDB();
    const transaction = db.transaction('users', 'readwrite');
    const store = transaction.objectStore('users');

    const request = store.add(user);

    request.onsuccess = () => {
      alert('Utilisateur inscrit avec succès !');
      window.location.href = 'login.html'; // Redirection vers la page de connexion
    };

    request.onerror = () => {
      alert('Erreur lors de l\'inscription. Cet email existe peut-être déjà.');
    };
  } catch (error) {
    console.error('Erreur lors de l\'inscription :', error);
    alert('Une erreur est survenue. Veuillez réessayer.');
  }
});
