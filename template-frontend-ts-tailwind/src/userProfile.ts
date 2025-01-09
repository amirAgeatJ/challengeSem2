// src/userProfile.ts

import { getUserById, User } from './common/db.js'; // Ajoutez .js

// Affiche le profil de l'utilisateur
export async function displayUserProfile(): Promise<void> {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    console.error('Utilisateur non connecté.');
    return;
  }

  try {
    const user: User | undefined = await getUserById(userId);
    const userProfileImage = document.getElementById('userProfileImage') as HTMLImageElement | null;

    if (user && user.profileImage) {
      if (userProfileImage) {
        userProfileImage.src = user.profileImage;
      }
    } else {
      if (userProfileImage) {
        userProfileImage.src = 'assets/img/default-profile.png'; // Image par défaut
      }
    }
  } catch (error) {
    console.error(error);
  }
}

// Fonction pour rediriger vers la page de profil (si nécessaire)
export function redirectToProfile(): void {
  window.location.href = 'profile.html'; // Remplacez 'profile.html' par le chemin réel de votre page Profile
}
