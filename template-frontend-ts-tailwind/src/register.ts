// Initialise la base de données IndexedDB avec "id" comme clé primaire
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 6); // Incrémenter la version

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Supprimez l'ancienne store si elle existe déjà
      if (db.objectStoreNames.contains('users')) {
        db.deleteObjectStore('users');
      }

      // Créez un nouveau store avec "id" comme clé primaire
      const store = db.createObjectStore('users', { keyPath: 'id' });

      // Ajoutez un index pour rechercher par "email"
      store.createIndex('email', 'email', { unique: true });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Interface utilisateur
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  profileImage?: string; // Photo de profil (base64)
}

// Ajoute un utilisateur dans IndexedDB
async function addUser(user: User): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction('users', 'readwrite');
  const store = transaction.objectStore('users');

  const request = store.add(user);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Erreur lors de l\'ajout de l\'utilisateur');
  });
}

// Capture une photo avec la caméra
function startCamera() {
  const video = document.getElementById('camera') as HTMLVideoElement;
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const context = canvas.getContext('2d');

  navigator.mediaDevices.getUserMedia({ video: true })
           .then((stream) => {
             video.srcObject = stream;
             video.play();
           })
           .catch((error) => {
             console.error("Erreur d'accès à la caméra :", error);
             alert("Impossible d'accéder à la caméra.");
           });

  document.getElementById('captureButton')?.addEventListener('click', () => {
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');
    (document.getElementById('profileImage') as HTMLInputElement).value = imageData;

    const profileImageDisplay = document.getElementById('profileImageDisplay') as HTMLImageElement;
    profileImageDisplay.src = imageData;
  });
}

// Setup Drag and Drop
function setupDragAndDrop() {
  const dropZone = document.getElementById('dropZone') as HTMLDivElement;
  const profileImageInput = document.getElementById('profileImage') as HTMLInputElement;
  const profileImageDisplay = document.getElementById('profileImageDisplay') as HTMLImageElement;

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('bg-gray-200');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('bg-gray-200');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-gray-200');

    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        profileImageInput.value = reader.result as string;
        profileImageDisplay.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      alert("Veuillez déposer une image valide.");
    }
  });
}

// Gestionnaire d'inscription
document.getElementById('registerForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = (document.getElementById('username') as HTMLInputElement).value;
  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const profileImage = (document.getElementById('profileImage') as HTMLInputElement).value;

  const userId = crypto.randomUUID();

  const user: User = { id: userId, username, email, password, profileImage };

  try {
    await addUser(user);
    alert("Inscription réussie !");
    window.location.href = 'login.html';
  } catch (error) {
    alert("Erreur lors de l'inscription. L'email existe peut-être déjà.");
  }
});

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  startCamera();
  setupDragAndDrop();
});
