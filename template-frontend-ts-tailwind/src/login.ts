// src/login.ts

import { User, verifyUser } from './common/db.js'; // Importation de User et verifyUser depuis db.ts
import { redirectToProfile } from './userProfile.js'; // Importation depuis userProfile.ts
import { initFullscreenButton } from './common/fullscreen.js'; // Importation depuis fullscreen.ts

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

// Gestionnaire d'événements pour l'image de profil
document.getElementById("userProfileImage")?.addEventListener("click", redirectToProfile);

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
  console.log("Formulaire prêt.");
  initFullscreenButton('fullscreenButton'); // Initialiser le bouton plein écran
});
