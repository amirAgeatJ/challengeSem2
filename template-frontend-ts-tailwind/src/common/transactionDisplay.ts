// src/common/transactionDisplay.ts

import { getTransactionsForUser, getUserById } from './db.js';

/**
 * Affiche la liste des transactions pour un utilisateur donné.
 * @param userId L'identifiant de l'utilisateur.
 * @param currentCurrency La devise actuelle ('EUR' ou 'USD').
 * @param usdRate Le taux de conversion USD/EUR.
 */
export async function displayTransactions(
  userId: string,
  currentCurrency: 'EUR' | 'USD',
  usdRate: number
): Promise<void> {
  const transactionList = document.getElementById('transactionList');
  if (!transactionList) return;

  try {
    const transactions = await getTransactionsForUser(userId);
    if (!transactions || transactions.length === 0) {
      transactionList.innerHTML = `<p class="text-center text-gray-500">Aucune transaction trouvée.</p>`;
      return;
    }

    // Enrichir chaque transaction avec les informations de l'utilisateur
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

    const factor = currentCurrency === 'USD' ? usdRate : 1;
    const symbol = currentCurrency === 'USD' ? '$' : '€';

    transactionList.innerHTML = enhancedTransactions
      .map((transaction) => {
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
      })
      .join('');
  } catch (error) {
    console.error('Erreur lors de l’affichage des transactions :', error);
    transactionList.innerHTML = `<p class="text-center text-red-500">Une erreur est survenue lors de l'affichage des transactions.</p>`;
  }
}

/**
 * Affiche la somme des dépenses et des revenus pour un utilisateur donné.
 * @param userId L'identifiant de l'utilisateur.
 * @param currentCurrency La devise actuelle ('EUR' ou 'USD').
 * @param usdRate Le taux de conversion USD/EUR.
 */
export async function displayTransactionSummary(
  userId: string,
  currentCurrency: 'EUR' | 'USD',
  usdRate: number
): Promise<void> {
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
      const factor = currentCurrency === 'USD' ? usdRate : 1;
      const symbol = currentCurrency === 'USD' ? '$' : '€';

      totalExpensesElement.textContent = (totalExpenses * factor).toFixed(2) + ' ' + symbol;
      totalIncomeElement.textContent = (totalIncome * factor).toFixed(2) + ' ' + symbol;
    }
  } catch (error) {
    console.error('Erreur lors de l’affichage du résumé des transactions :', error);
  }
}
