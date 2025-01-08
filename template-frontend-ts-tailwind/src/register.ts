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

// Ajoute un utilisateur dans IndexedDB
async function addUser(user: User): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction('users', 'readwrite');
  const store = transaction.objectStore('users');

  return new Promise((resolve, reject) => {
    const request = store.add(user);

    request.onsuccess = () => {
      console.log("Utilisateur ajouté avec succès !");
      resolve();
    };

    request.onerror = () => {
      console.error("Erreur lors de l'ajout de l'utilisateur", request.error);
      reject(request.error);
    };
  });
}

// Fonction pour vérifier si les mots de passe correspondent
function validatePassword(): boolean {
  const password = (document.getElementById('password') as HTMLInputElement)?.value;
  const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value;
  const errorElement = document.getElementById('passwordError') as HTMLElement;

  if (password !== confirmPassword) {
    errorElement.classList.remove('hidden');
    return false;
  } else {
    errorElement.classList.add('hidden');
    return true;
  }
}

// Fonction pour vérifier si les termes et conditions sont acceptés
function isTermsAccepted(): boolean {
  const termsCheckbox = document.getElementById('termsCheckbox') as HTMLInputElement | null;

  if (!termsCheckbox) {
    console.error("L'input termsCheckbox est introuvable.");
    return false;
  }

  return termsCheckbox.checked;
}

// Gestionnaire d'événements pour l'inscription
document.getElementById('registerForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Vérifie si les mots de passe correspondent
  if (!validatePassword()) {
    alert("Les mots de passe ne correspondent pas.");
    return;
  }

  // Vérifie si l'utilisateur a accepté les termes et conditions
  if (!isTermsAccepted()) {
    alert("Vous devez accepter les termes et conditions.");
    return;
  }

  const username = (document.getElementById('username') as HTMLInputElement).value.trim();
  const email = (document.getElementById('email') as HTMLInputElement).value.trim();
  const password = (document.getElementById('password') as HTMLInputElement).value.trim();

  const userId = crypto.randomUUID();
  const user: User = { id: userId, username, email, password };

  try {
    await addUser(user);
    alert("Utilisateur inscrit avec succès !");
    window.location.href = 'login.html';
  } catch (error) {
    console.error("Erreur lors de l'inscription", error);
    alert("Erreur lors de l'inscription. Cet email existe peut-être déjà.");
  }
});

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
  console.log("Formulaire prêt.");
});
