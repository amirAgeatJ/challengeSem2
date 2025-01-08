// Initialise la base de données IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 7);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Supprime l'ancien objectStore 'users' si présent, et le recrée
      if (db.objectStoreNames.contains('users')) {
        db.deleteObjectStore('users');
      }
      db.createObjectStore('users', { keyPath: 'id' });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

interface User {
  id: string;
  username: string;
  profileImage: string;
}

// ------------------
// 1) Battery Status
// ------------------
async function setupBatteryStatus(): Promise<void> {
  const batteryStatusDiv = document.getElementById('batteryStatus');
  if (!batteryStatusDiv) return;

  // Vérifier si l'API est disponible
  if (!('getBattery' in navigator)) {
    batteryStatusDiv.textContent = "Battery API non supportée";
    return;
  }

  try {
    // TypeScript n'a parfois pas la définition : (navigator as any).getBattery()
    const battery = await (navigator as any).getBattery();

    // Fonction pour mettre à jour l'affichage
    function updateBatteryInfo() {
      const levelPercent = Math.round(battery.level * 100);
      const chargingSymbol = battery.charging ? '⚡' : '';
      batteryStatusDiv.textContent = `Batterie : ${levelPercent}% ${chargingSymbol}`;
    }

    // Écouter les changements
    battery.addEventListener('levelchange', updateBatteryInfo);
    battery.addEventListener('chargingchange', updateBatteryInfo);

    // Initialiser l'affichage
    updateBatteryInfo();
  } catch (error) {
    console.error("Erreur lors de l'obtention de la batterie :", error);
    batteryStatusDiv.textContent = "Impossible d'obtenir la batterie";
  }
}

// ------------------
// 2) Idle Detection
// ------------------
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
      const userState = idleDetector.userState;   // 'active' ou 'idle'
      const screenState = idleDetector.screenState; // 'locked' ou 'unlocked'

      console.log(`État utilisateur : ${userState}, État écran : ${screenState}`);

      if (userState === 'idle') {
        alert("Vous êtes inactif. Revenez pour continuer.");
      }
    });

    await idleDetector.start({ threshold: 60000 }); // 60 sec
    console.log('Idle Detection activée.');
  } catch (error) {
    console.error("Erreur lors de la configuration de l'Idle Detection API :", error);
  }
}

// ------------------
// 3) Récupérer un user
// ------------------
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

// ------------------
// 4) Mettre à jour un user
// ------------------
async function updateUser(user: User): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.put(user);

    request.onsuccess = async () => {
      await notifyUser('Votre photo de profil a été mise à jour avec succès !');
      sendPushNotification(
        'Profil mis à jour',
        'Votre photo de profil a été mise à jour avec succès.'
      );
      resolve();
    };

    request.onerror = () => reject('Erreur lors de la mise à jour du profil.');
  });
}

// ------------------
// 5) Notifications locales
// ------------------
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

// ------------------
// 6) Notifications push
// ------------------
function sendPushNotification(title: string, body: string) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .ready
      .then((registration) => {
        registration.showNotification(title, {
          body: body,
          icon: '/icon.png',
        });
      })
      .catch((error) => {
        console.error("Erreur lors de l'envoi de la notification push :", error);
      });
  }
}

// ------------------
// 7) Caméra
// ------------------
function startCamera() {
  const video = document.getElementById('camera') as HTMLVideoElement | null;
  const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
  if (!video || !canvas) return;

  const context = canvas.getContext('2d');

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
    })
    .catch((error) => {
      console.error("Erreur d'accès à la caméra :", error);
      alert("Impossible d'accéder à la caméra.");
    });

  document.getElementById('captureButton')?.addEventListener('click', async () => {
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');
    const userId = localStorage.getItem('idUser');

    if (userId) {
      const updatedUser: User = {
        id: userId,
        username: (document.getElementById('username') as HTMLInputElement)?.value || '',
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
  });
}

// ------------------
// 8) Gestion formulaire
// ------------------
document.getElementById('profileForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const userId = localStorage.getItem('idUser');
  if (!userId) {
    alert('Utilisateur non connecté.');
    return;
  }

  const username = (document.getElementById('username') as HTMLInputElement)?.value || '';
  const profileImage = (document.getElementById('profileImage') as HTMLInputElement)?.value || '';

  const updatedUser: User = {
    id: userId,
    username,
    profileImage,
  };

  try {
    await updateUser(updatedUser);
    alert('Profil mis à jour avec succès !');
  } catch (error) {
    console.error(error);
    alert('Erreur lors de la mise à jour du profil.');
  }
});

// ------------------
// 9) Au chargement du DOM
// ------------------
document.addEventListener('DOMContentLoaded', async () => {
  // 9.1 Setup Battery
  setupBatteryStatus();

  // 9.2 Charger l'utilisateur
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    alert('Utilisateur non connecté.');
    return;
  }

  const user = await getUserById(userId);

  if (user) {
    (document.getElementById('username') as HTMLInputElement).value = user.username;
    const profileImageInput = document.getElementById('profileImage') as HTMLInputElement | null;
    if (profileImageInput) {
      profileImageInput.value = user.profileImage;
    }

    const profileImageDisplay = document.getElementById('profileImageDisplay') as HTMLImageElement | null;
    if (profileImageDisplay) {
      profileImageDisplay.src = user.profileImage;
    }
  } else {
    alert('Utilisateur non trouvé.');
  }

  // 9.3 Démarre la caméra
  startCamera();
});

// ------------------
// 10) Démarrage de l'idle detection
// ------------------
document.getElementById('startIdleDetection')?.addEventListener('click', () => {
  setupIdleDetection();
});
