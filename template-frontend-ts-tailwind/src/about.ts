// src/about.ts

import { 
  getUserById, 
  getBudget, 
  getTransactionsForUser 
} from './common/db.js'; // Assurez-vous que les chemins sont corrects
import { displayUserProfile, redirectToProfile } from './common/userProfile.js';

// Variables globales
let currentCurrency: 'EUR' | 'USD' = 'EUR';
let usdRate: number = 1; // Taux de conversion USD/EUR (par défaut = 1)

// Gestion du taux de change
async function fetchUsdRate(): Promise<void> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
    const data = await response.json();
    // Exemple: data.rates.USD = 1.1  => 1 EUR = 1.1 USD
    usdRate = data.rates.USD;
  } catch (error) {
    console.error('Erreur lors de la récupération du taux de change :', error);
  }
}

// Fonctions d'affichage

/**
 * Affiche le budget de l'utilisateur
 */
async function displayUserBudget() {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    console.error('Utilisateur non connecté.');
    return;
  }

  try {
    const budget = await getBudget(userId);
    const budgetSummary = document.getElementById('budgetSummary');

    if (!budget || !budgetSummary) {
      console.error("Aucun budget trouvé pour l'utilisateur connecté.");
      return;
    }

    const factor = currentCurrency === 'USD' ? usdRate : 1;
    const symbol = currentCurrency === 'USD' ? '$' : '€';

    budgetSummary.innerHTML = `
      <p><strong>Global :</strong> ${(budget.global || 0) * factor} ${symbol}</p>
      <p><strong>Transport :</strong> ${(budget.transport || 0) * factor} ${symbol}</p>
      <p><strong>Loisir :</strong> ${(budget.leisure || 0) * factor} ${symbol}</p>
      <p><strong>Santé :</strong> ${(budget.health || 0) * factor} ${symbol}</p>
      <p><strong>Logement :</strong> ${(budget.housing || 0) * factor} ${symbol}</p>
      <p><strong>Éducation :</strong> ${(budget.education || 0) * factor} ${symbol}</p>
    `;
  } catch (error) {
    console.error('Erreur lors de l’affichage du budget :', error);
  }
}

async function displayTotalBudget() {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    console.error('Utilisateur non connecté.');
    return;
  }

  try {
    const budget = await getBudget(userId);
    const totalBudgetElement = document.getElementById('totalBudget');

    if (!budget || !totalBudgetElement) {
      console.error("Aucun budget trouvé pour l'utilisateur connecté.");
      totalBudgetElement.textContent = '0 €';
      return;
    }

    const factor = currentCurrency === 'USD' ? usdRate : 1;
    const symbol = currentCurrency === 'USD' ? '$' : '€';

    const totalBudget = [
      budget.global,
      budget.transport,
      budget.leisure,
      budget.health,
      budget.housing,
      budget.education,
    ].reduce((sum, value) => sum + (value || 0), 0);

    totalBudgetElement.textContent = `${(totalBudget * factor).toFixed(2)} ${symbol}`;
  } catch (error) {
    console.error('Erreur lors de l’affichage du budget total :', error);
  }
}

/**
 * Affiche la somme des dépenses et des revenus
 */
async function displayTransactionSummary() {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    console.error('Utilisateur non connecté.');
    return;
  }

  try {
    const transactions = await getTransactionsForUser(userId);
    if (!transactions || transactions.length === 0) {
      console.log('Aucune transaction trouvée.');
      return;
    }

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpensesElement = document.getElementById('totalExpenses');
    const totalIncomeElement = document.getElementById('totalIncome');

    if (totalExpensesElement && totalIncomeElement) {
      // Détermine le facteur et le symbole
      const factor = currentCurrency === 'USD' ? usdRate : 1;
      const symbol = currentCurrency === 'USD' ? '$' : '€';

      totalExpensesElement.textContent = (totalExpenses * factor).toFixed(2) + ' ' + symbol;
      totalIncomeElement.textContent = (totalIncome * factor).toFixed(2) + ' ' + symbol;
    }
  } catch (error) {
    console.error('Erreur lors de l’affichage du résumé des transactions :', error);
  }
}

/**
 * Affiche la liste des transactions
 */
async function displayTransactions() {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    console.error('Utilisateur non connecté.');
    return;
  }

  try {
    const transactions = await getTransactionsForUser(userId);
    const transactionList = document.getElementById('transactionList');

    if (!transactionList) return;

    if (transactions.length === 0) {
      transactionList.innerHTML = `<p class="text-center text-gray-500">Aucune transaction trouvée.</p>`;
      return;
    }

    // Enrichit les transactions avec infos user
    const enhancedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const user = await getUserById(transaction.userId);
        return {
          ...transaction,
          username: user?.username || 'Utilisateur inconnu',
          userPhoto: user?.profileImage || 'assets/img/default-profile.png',
        };
      })
    );

    // Conversion
    const factor = currentCurrency === 'USD' ? usdRate : 1;
    const symbol = currentCurrency === 'USD' ? '$' : '€';

    transactionList.innerHTML = enhancedTransactions
      .map(
        (transaction) => {
          const convertedAmount = (transaction.amount * factor).toFixed(2);
          return `
            <div class="p-4 border border-gray-300 rounded flex items-center gap-4">
              <img src="${transaction.userPhoto}" alt="Photo utilisateur" class="w-10 h-10 rounded-full">
              <div>
                <p><strong>Utilisateur :</strong> ${transaction.username}</p>
                <p><strong>Type :</strong> ${transaction.type}</p>
                <p><strong>Catégorie :</strong> ${transaction.category}</p>
                <p><strong>Montant :</strong> ${convertedAmount} ${symbol}</p>
                <p><strong>Date :</strong> ${new Date(transaction.date).toLocaleDateString()}</p>
              </div>
            </div>
          `;
        }
      )
      .join('');
  } catch (error) {
    console.error('Erreur lors de l’affichage des transactions :', error);
    const transactionList = document.getElementById('transactionList');
    if (transactionList) {
      transactionList.innerHTML = `<p class="text-center text-red-500">Une erreur est survenue lors de l'affichage des transactions.</p>`;
    }
  }
}

// Fonction pour copier le budget total dans le presse-papiers
function copyTotalBudgetToClipboard() {
  const totalBudgetElement = document.getElementById('totalBudget');
  if (!totalBudgetElement) {
    alert("Impossible de copier : le budget total est introuvable.");
    return;
  }

  const totalBudgetText = totalBudgetElement.textContent || "0 €";

  // Vérifie si la Web API Clipboard est disponible
  if (navigator.clipboard) {
    navigator.clipboard.writeText(totalBudgetText).then(
      () => {
        alert(`Budget total copié : ${totalBudgetText}`);
      },
      (err) => {
        console.error("Erreur lors de la copie dans le presse-papiers :", err);
        alert("Une erreur s'est produite lors de la copie dans le presse-papiers.");
      }
    );
  } else {
    alert("La fonctionnalité de copie n'est pas disponible sur votre navigateur.");
  }
}

// Code principal : DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1) Récupère le taux USD/EUR au chargement
    await fetchUsdRate();

    // 2) Affiche initialement (en EUR par défaut)
    await displayTotalBudget();
    await displayUserBudget();
    await displayTransactions();
    await displayTransactionSummary();
    await displayUserProfile(); // Affiche l'image du profil utilisateur
      (window as any).redirectToProfile = redirectToProfile;
    

    // 3) Gère le bouton de conversion (basculer EUR <-> USD)
    const toggleCurrencyButton = document.getElementById('toggleCurrencyButton');
    if (toggleCurrencyButton) {
      toggleCurrencyButton.addEventListener('click', async () => {
        if (currentCurrency === 'EUR') {
          currentCurrency = 'USD';
          toggleCurrencyButton.textContent = 'EUR';
        } else {
          currentCurrency = 'EUR';
          toggleCurrencyButton.textContent = 'USD';
        }

        // On réaffiche tout après changement de devise
        await displayTotalBudget();
        await displayUserBudget();
        await displayTransactions();
        await displayTransactionSummary();
      });
    }

    // 4) Gère le bouton copier le budget
    const copyBudgetButton = document.getElementById('copyBudgetButton');
    if (copyBudgetButton) {
      copyBudgetButton.addEventListener('click', copyTotalBudgetToClipboard);
    }

    // 5) Gère le bouton plein écran
    const fullscreenButton = document.getElementById('fullscreenButton');
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      });
    }

  } catch (error) {
    console.error('Erreur lors de l’affichage des données :', error);
  }
});
