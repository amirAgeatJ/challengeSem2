// Fonction pour initialiser IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserProfileDB', 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' }); // Stockage des utilisateurs par ID
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fonction pour récupérer les informations du profil utilisateur
async function getUserProfile(userId: string): Promise<any> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(userId);

    request.onsuccess = () => resolve(request.result || { id: userId, username: '', profileImage: '' });
    request.onerror = () => reject('Erreur lors de la récupération du profil.');
  });
}

// Fonction pour sauvegarder les informations mises à jour du profil
async function saveUserProfile(profile: any): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.put(profile);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Erreur lors de la sauvegarde du profil.');
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
             console.error('Erreur lors de l\'accès à la caméra :', error);
             alert('Impossible d\'accéder à la caméra.');
           });

  document.getElementById('captureButton')?.addEventListener('click', () => {
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/png'); // Convertir en base64
      const profileImageInput = document.getElementById('profileImage') as HTMLInputElement;
      profileImageInput.value = imageData;
    }
  });
}

// Gestionnaire d'événements pour sauvegarder le profil
document.getElementById('profileForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const userId = localStorage.getItem('idUser');
  if (!userId) {
    alert('Utilisateur non connecté.');
    return;
  }

  const username = (document.getElementById('username') as HTMLInputElement).value;
  const profileImage = (document.getElementById('profileImage') as HTMLInputElement).value;

  const updatedProfile = { id: userId, username, profileImage };

  try {
    await saveUserProfile(updatedProfile);
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

  const userProfile = await getUserProfile(userId);

  // Remplir le formulaire avec les données existantes
  (document.getElementById('username') as HTMLInputElement).value = userProfile.username || '';
  const profileImageInput = document.getElementById('profileImage') as HTMLInputElement;
  profileImageInput.value = userProfile.profileImage || '';

  if (userProfile.profileImage) {
    const profileImageDisplay = document.getElementById('profileImageDisplay') as HTMLImageElement;
    profileImageDisplay.src = userProfile.profileImage;
  }

  // Lancement de la caméra
  startCamera();
});
