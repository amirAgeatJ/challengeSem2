// Initialise la base de données IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 3);

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

// Fonction pour récupérer un utilisateur par ID
async function getUserById(userId: string): Promise<any> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(userId);

    request.onsuccess = () => resolve(request.result || { id: userId, username: '', profileImage: '' });
    request.onerror = () => reject('Erreur lors de la récupération du profil.');
  });
}

// Fonction pour sauvegarder les modifications d'un utilisateur
async function updateUser(user: any): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.put(user);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Erreur lors de la mise à jour du profil.');
  });
}

// Active la caméra et capture une photo
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
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/png'); // Capture de la photo en base64
      (document.getElementById('profileImage') as HTMLInputElement).value = imageData;
    }
  });
}

// Gestionnaire d'événements pour soumettre le formulaire
document.getElementById('profileForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const userId = localStorage.getItem('idUser');
  if (!userId) {
    alert('Utilisateur non connecté.');
    return;
  }

  const username = (document.getElementById('username') as HTMLInputElement).value;
  const profileImage = (document.getElementById('profileImage') as HTMLInputElement).value;

  const updatedUser = { id: userId, username, profileImage };

  try {
    await updateUser(updatedUser);
    alert('Profil mis à jour avec succès !');
  } catch (error) {
    console.error(error);
    alert('Erreur lors de la mise à jour du profil.');
  }
});

// Chargement des informations utilisateur au démarrage
document.addEventListener('DOMContentLoaded', async () => {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    alert('Utilisateur non connecté.');
    return;
  }

  const user = await getUserById(userId);

  // Pré-remplit le formulaire avec les données existantes
  (document.getElementById('username') as HTMLInputElement).value = user.username || '';
  const profileImageInput = document.getElementById('profileImage') as HTMLInputElement;
  profileImageInput.value = user.profileImage || '';

  if (user.profileImage) {
    const profileImageDisplay = document.getElementById('profileImageDisplay') as HTMLImageElement;
    profileImageDisplay.src = user.profileImage;
  }

  // Démarre la caméra pour la capture de photo
  startCamera();
});
