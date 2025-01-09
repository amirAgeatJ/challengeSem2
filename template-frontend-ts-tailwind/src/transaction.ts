// src/transaction.ts

import { 
  getTransactionsForUser, 
  deleteTransaction, 
  Transaction 
} from './common/db.js';
import { getUserById } from './common/db.js';
import { displayUserProfile, redirectToProfile } from './userProfile.js'; // Importation correcte avec .js
import { initFullscreenButton } from './common/fullscreen.js'; // Import du module fullscreen

// Retourne une icône pour une catégorie donnée
function getCategoryIcon(category: string): string {
  const iconsMap: { [key: string]: string } = {
    food: '<i class="bi bi-utensils"></i>',
    education: '<i class="bi bi-book"></i>',
    transport: '<i class="bi bi-bus-front"></i>',
    leisure: '<i class="bi bi-controller"></i>',
    health: '<i class="bi bi-heart-pulse"></i>',
    housing: '<i class="bi bi-house-door"></i>',
    default: '<i class="bi bi-question-circle"></i>',
  };

  return iconsMap[category] || iconsMap["default"];
}

// Affiche les transactions avec des icônes et un bouton Supprimer
export async function displayTransactions(): Promise<void> {
  const userId = localStorage.getItem("idUser");
  if (!userId) {
    console.error("Erreur : Utilisateur non connecté.");
    return;
  }

  try {
    // Récupérer les transactions et les informations de l'utilisateur en parallèle
    const [transactions, user] = await Promise.all([
      getTransactionsForUser(userId),
      getUserById(userId),
    ]);

    const transactionList = document.getElementById("transactionList");

    if (!transactionList) return;

    if (transactions.length === 0) {
      transactionList.innerHTML = `<p class="text-center text-gray-500">Aucune transaction trouvée.</p>`;
      return;
    }

    // Générer le HTML pour chaque transaction
    transactionList.innerHTML = transactions
      .map((transaction) => {
        const typeLabel = transaction.type === "income" ? "Revenu" : "Dépense";
        const categoryIcon = getCategoryIcon(transaction.category);
        const userPhoto = user?.profileImage
          ? `<img src="${user.profileImage}" alt="Profile" class="transaction-user-photo">`
          : `<img src="assets/img/default-profile.png" alt="Profile" class="transaction-user-photo">`;
        const username = user?.username || "Utilisateur";

        return `
          <div class="transaction-item">
            <div class="transaction-user-info">
              ${userPhoto}
              <span class="transaction-username">${username}</span>
            </div>
            <div class="category-icon">${categoryIcon}</div>
            <div class="transaction-details">
              <p class="transaction-category">${transaction.category}</p>
              <p class="transaction-amount">${transaction.amount.toFixed(2)} €</p>
              <p class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</p>
            </div>
            <button
              class="delete-button"
              data-id="${transaction.id}"
              data-type="${transaction.type}"
              data-category="${transaction.category}"
              data-amount="${transaction.amount}"
            >
              Supprimer
            </button>
          </div>
        `;
      })
      .join("");

    // Ajouter des écouteurs d'événements aux boutons Supprimer
    document.querySelectorAll(".delete-button").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) return;

        const transactionId = parseInt(target.dataset.id || "", 10);
        const type = target.dataset.type || "";
        const category = target.dataset.category || "";
        const amount = parseFloat(target.dataset.amount || "0");

        if (transactionId && userId) {
          if (confirm("Êtes-vous sûr de vouloir supprimer cette transaction ?")) {
            try {
              await deleteTransaction(transactionId, userId, type, category, amount);
              alert("Transaction supprimée avec succès.");
              await displayTransactions();
            } catch (error) {
              console.error("Erreur lors de la suppression de la transaction :", error);
              alert("Une erreur s'est produite. Veuillez réessayer.");
            }
          }
        }
      });
    });

  } catch (error) {
    console.error("Erreur lors de l'affichage des transactions :", error);
    const transactionList = document.getElementById("transactionList");
    if (transactionList) {
      transactionList.innerHTML = `<p class="text-center text-red-500">Une erreur est survenue lors de l'affichage des transactions.</p>`;
    }
  }
}

// Fonction d'initialisation de la page Transaction
export async function initializeTransactionPage(): Promise<void> {
  await displayTransactions();
  await displayUserProfile(); // Utilise la fonction importée
  initFullscreenButton('fullscreenButton'); // Initialiser le bouton plein écran

  // Exposer la fonction redirectToProfile au contexte global
  (window as any).redirectToProfile = redirectToProfile;
}

// Initialisation lors du chargement de la page
document.addEventListener('DOMContentLoaded', initializeTransactionPage);
