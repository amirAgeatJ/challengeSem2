// src/profile.ts

import { User, getUserById, updateUser } from './common/db.js'; // Import depuis db.ts
import { notifyUser, sendPushNotification } from './common/notification.js'; // Import depuis notification.ts (si vous avez centralisé ces fonctions)
import { setupIdleDetection } from './common/idleDetection.js'; // Import depuis idleDetection.ts (si vous avez centralisé ces fonctions)

//////////////////////////
// Fonctions de Mise à Jour du Profil
//////////////////////////

/**
 * Met à jour l'utilisateur dans la base de données.
 * @param user L'utilisateur avec les informations mises à jour.
 */
async function handleProfileUpdate(user: User): Promise<void> {
  try {
    await updateUser(user);
    alert('Profil mis à jour avec succès !');
    notifyUser('Votre photo de profil a été mise à jour avec succès !');
    sendPushNotification('Profil mis à jour', 'Votre photo de profil a été mise à jour avec succès.');

    // Mise à jour de l'image de profil dans le DOM
    const profileImageDisplay = document.getElementById('profileImageDisplay') as HTMLImageElement | null;
    if (profileImageDisplay) {
      profileImageDisplay.src = user.profileImage;
    }

    // Mise à jour du champ caché
    const profileImageInput = document.getElementById('profileImage') as HTMLInputElement | null;
    if (profileImageInput) {
      profileImageInput.value = user.profileImage;
    }
  } catch (error) {
    console.error(error);
    alert('Erreur lors de la mise à jour du profil.');
  }
}

//////////////////////////
// Gestion du Formulaire
//////////////////////////

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

  await handleProfileUpdate(updatedUser);
});

//////////////////////////
// Gestion de la Caméra
//////////////////////////

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

      await handleProfileUpdate(updatedUser);
    } else {
      alert('Utilisateur non connecté.');
    }
  });
}

//////////////////////////
// Chargement du Profil au DOMContentLoaded
//////////////////////////

document.addEventListener('DOMContentLoaded', async () => {
  // Charger l'utilisateur
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
      profileImageInput.value = user.profileImage || '';
    }

    const profileImageDisplay = document.getElementById('profileImageDisplay') as HTMLImageElement | null;
    if (profileImageDisplay) {
      profileImageDisplay.src = user.profileImage || 'assets/img/default-profile.png';
    }
  } else {
    alert('Utilisateur non trouvé.');
  }

  // Démarrer la caméra
  startCamera();
});
