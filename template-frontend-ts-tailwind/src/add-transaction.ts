// src/add-transaction.ts

import { Transaction, addTransaction, updateBudgets } from './common/db.js'; // Import correct avec export de updateBudgets
import { redirectToProfile } from './common/userProfile.js'; // Import depuis userProfile.ts
import { initFullscreenButton } from './common/fullscreen.js'; // Import depuis fullscreen.ts
import { notifyUser, sendPushNotification } from './common/notification.js'; // Import des fonctions de notification centralisées

const OPEN_CAGE_API_KEY = '57d7a23fd746459099536889ec38e85d'; // Remplacez par votre clé API réelle

/**
 * Fonction pour obtenir l'adresse via OpenCageData API
 * @param lat Latitude
 * @param lon Longitude
 * @returns Adresse formatée ou message d'erreur
 */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${OPEN_CAGE_API_KEY}`
    );
    const data = await response.json();
    return data.results?.[0]?.formatted || 'Adresse inconnue';
  } catch (error) {
    console.error('Erreur lors du géocodage inverse:', error);
    return 'Erreur localisation';
  }
}

/**
 * Fonction de gestion de la localisation
 */
function getLocation(): void {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const address = await reverseGeocode(lat, lon);
      const locationInput = document.getElementById('location') as HTMLInputElement;
      locationInput.value = address;
    }, (error) => {
      console.error('Erreur lors de la récupération de la localisation:', error);
      alert("Impossible de récupérer la localisation.");
    });
  } else {
    alert("La géolocalisation n'est pas prise en charge par ce navigateur.");
  }
}

// Ajouter un gestionnaire d'événements pour le bouton de localisation
document.getElementById('getLocation')?.addEventListener('click', getLocation);

// Gestion du formulaire pour ajouter une transaction
document.getElementById('transactionForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const type = (document.getElementById('transactionType') as HTMLSelectElement).value;
  const category = (document.getElementById('category') as HTMLSelectElement).value;
  const amount = parseFloat((document.getElementById('amount') as HTMLInputElement).value);
  const location = (document.getElementById('location') as HTMLInputElement).value;

  if (!type || !category || isNaN(amount) || amount <= 0) {
    alert("Veuillez remplir tous les champs correctement.");
    return;
  }

  const userId = localStorage.getItem('idUser');
  if (!userId) {
    alert("Utilisateur non connecté.");
    return;
  }

  const transaction: Transaction = {
    userId,
    type: type as 'income' | 'expense',
    category,
    amount,
    location,
    date: new Date(),
  };

  try {
    await addTransaction(transaction);
    await updateBudgets(userId, type as 'income' | 'expense', category, amount);

    // Utiliser les fonctions de notification centralisées
    await notifyUser(`Votre transaction de ${amount} € a été ajoutée avec succès.`);
    sendPushNotification("Transaction Ajoutée", `Votre transaction de ${amount} € a été ajoutée avec succès.`);

    // Ajout de vibration après une transaction réussie
    if (navigator.vibrate) {
      navigator.vibrate([300]); // Vibre 300ms
    }

    alert("Transaction ajoutée avec succès !");
    window.location.href = "about.html";
  } catch (error) {
    console.error("Erreur lors de l'ajout de la transaction:", error);
    alert("Une erreur est survenue. Veuillez réessayer.");
  }
});

// Gestionnaire d'événements pour l'image de profil
document.getElementById("userProfileImage")?.addEventListener("click", redirectToProfile);

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
  console.log("Formulaire prêt.");
  initFullscreenButton('fullscreenButton'); // Initialiser le bouton plein écran
});
