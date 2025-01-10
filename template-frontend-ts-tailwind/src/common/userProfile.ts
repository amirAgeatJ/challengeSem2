// src/userProfile.ts

import { getUserById, User } from './db.js';

/**
 * Affiche l'image de profil de l'utilisateur connecté.
 */
export async function displayUserProfile(): Promise<void> {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    console.error('Erreur : Utilisateur non connecté.');
    return;
  }

  try {
    const user: User | null = await getUserById(userId);
    const userProfileImage = document.getElementById("userProfileImage") as HTMLImageElement | null;

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

/**
 * Redirige vers la page de profil.
 */
export function redirectToProfile(): void {
  window.location.href = 'profile.html'; // Remplacez par le chemin réel vers la page de profil
}
