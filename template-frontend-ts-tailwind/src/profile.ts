// Initialise la base de données IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 6);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (db.objectStoreNames.contains('users')) {
        db.deleteObjectStore('users');
      }
      db.createObjectStore('users', { keyPath: 'id' });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Interface utilisateur
interface User {
  id: string;
  username: string;
  profileImage: string;
}

// Fonction pour récupérer un utilisateur par ID


async function setupIdleDetection() {
  if (!('IdleDetector' in window)) {
    console.warn('Idle Detection API non prise en charge dans ce navigateur.');
    return;
  }

  try {
    const permission = await IdleDetector.requestPermission();
    if (permission !== 'granted') {
      console.warn("Permission pour l'API Idle Detection refusée.");
      return;
    }

    const idleDetector = new IdleDetector();
    idleDetector.addEventListener('change', () => {
      const userState = idleDetector.userState; // 'active' ou 'idle'
      const screenState = idleDetector.screenState; // 'locked' ou 'unlocked'

      console.log(`État utilisateur : ${userState}, État écran : ${screenState}`);

      if (userState === 'idle') {
        alert("Vous êtes inactif. Revenez pour continuer.");
      }
    });

    await idleDetector.start({ threshold: 60000 }); // Inactivité détectée après 60 secondes
    console.log('Idle Detection activée.');
  } catch (error) {
    console.error('Erreur lors de la configuration de l\'Idle Detection API :', error);
  }
}

async function getUserById(userId: string): Promise<User | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(userId);

    request.onsuccess = () => {
      const user = request.result;
      resolve(user ? (user as User) : null);
    };
    request.onerror = () => reject('Erreur lors de la récupération du profil.');
  });
}

// Fonction pour sauvegarder les modifications d'un utilisateur
async function updateUser(user: User): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.put(user);

    request.onsuccess = async () => {
      await notifyUser('Votre photo de profil a été mise à jour avec succès !');
      sendPushNotification('Profil mis à jour', 'Votre photo de profil a été mise à jour avec succès.');
      resolve();
    };

    request.onerror = () => reject('Erreur lors de la mise à jour du profil.');
  });
}

// Fonction pour afficher une notification locale
async function notifyUser(message: string) {
  if (!('Notification' in window)) {
    console.warn('Les notifications ne sont pas prises en charge par ce navigateur.');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(message);
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(message);
    }
  }
}

// Fonction pour envoyer une notification push
function sendPushNotification(title: string, body: string) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body: body,
        icon: '/icon.png',
      });
    }).catch((error) => {
      console.error('Erreur lors de l\'envoi de la notification push :', error);
    });
  }
}

// Capture une photo et met à jour le profil
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

  document.getElementById('captureButton')?.addEventListener('click', async () => {
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/png');
      const userId = localStorage.getItem('idUser');

      if (userId) {
        const updatedUser = {
          id: userId,
          username: (document.getElementById('username') as HTMLInputElement).value,
          profileImage: imageData,
        };

        try {
          await updateUser(updatedUser);
          alert('Photo et profil mis à jour avec succès !');
        } catch (error) {
          console.error(error);
          alert('Erreur lors de la mise à jour du profil.');
        }
      } else {
        alert('Utilisateur non connecté.');
      }
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
  const profileImage = (document.getElementById('profileImage') as HTMLInputElement).value || '';

  const updatedUser: { id : string; profileImage : string; username : string } = {
    id: userId,
    username,
    profileImage, // Conservez l'image actuelle si elle n'est pas modifiée
  };

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

  if (user) {
    (document.getElementById('username') as HTMLInputElement).value = user.username;
    const profileImageInput = document.getElementById('profileImage') as HTMLInputElement;
    profileImageInput.value = user.profileImage;

    const profileImageDisplay = document.getElementById('profileImageDisplay') as HTMLImageElement;
    profileImageDisplay.src = user.profileImage;
  } else {
    alert('Utilisateur non trouvé.');
  }

  startCamera();
});

document.getElementById('startIdleDetection').addEventListener('click', () => {
  setupIdleDetection();
});
