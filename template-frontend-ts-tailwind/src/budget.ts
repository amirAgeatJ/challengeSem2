// src/budget.ts

import { getBudget, saveBudget, Budget } from './common/db.js';
import { displayUserProfile, redirectToProfile } from './common/userProfile.js'; // Importation correcte avec .js
import { initFullscreenButton } from './common/fullscreen.js'; // Import du module fullscreen

// Supprimez ou commentez l'importation de Chart
// import { Chart } from 'chart.js';

// Déclarez Chart comme une variable globale
declare const Chart: any;

// Fonction pour afficher les données du budget dans le formulaire
export async function displayBudgetData(): Promise<void> {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    console.error('Erreur : Utilisateur non connecté.');
    return;
  }

  try {
    const budget = await getBudget(userId);
    if (!budget) {
      console.log('Aucun budget trouvé pour cet utilisateur.');
      return;
    }

    // Assurez-vous que les éléments HTML existent avant de les manipuler
    const transportInput = document.getElementById('transportBudget') as HTMLInputElement | null;
    const leisureInput = document.getElementById('leisureBudget') as HTMLInputElement | null;
    const healthInput = document.getElementById('healthBudget') as HTMLInputElement | null;
    const housingInput = document.getElementById('housingBudget') as HTMLInputElement | null;
    const alimentaireInput = document.getElementById('alimentaireBudget') as HTMLInputElement | null;
    const educationInput = document.getElementById('educationBudget') as HTMLInputElement | null;

    if (transportInput) transportInput.value = budget.transport.toString();
    if (leisureInput) leisureInput.value = budget.leisure.toString();
    if (healthInput) healthInput.value = budget.health.toString();
    if (housingInput) housingInput.value = budget.housing.toString();
    if (alimentaireInput) alimentaireInput.value = budget.alimentaire.toString();
    if (educationInput) educationInput.value = budget.education.toString();
  } catch (error) {
    console.error('Erreur lors de l\'affichage des données du budget :', error);
  }
}

// Fonction pour afficher le graphique de répartition des budgets
export async function displayBudgetChart(): Promise<void> {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    console.error('Erreur : Utilisateur non connecté.');
    return;
  }

  try {
    const budget = await getBudget(userId);
    if (!budget) {
      console.error("Aucun budget trouvé pour l'utilisateur connecté.");
      return;
    }

    const categories = ['transport', 'leisure', 'health', 'housing', 'alimentaire', 'education'];
    const labels = ['Transport', 'Loisir', 'Santé', 'Logement', 'Alimentaire', 'Éducation'];
    const data = categories.map((cat) => budget[cat] || 0);

    const canvas = document.getElementById('budgetChart') as HTMLCanvasElement | null;
    if (!canvas) {
      console.error('Erreur : Élément Canvas pour le graphique non trouvé.');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Erreur : Impossible d’obtenir le contexte 2D du Canvas.');
      return;
    }

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.label}: ${context.raw} €`,
            },
          },
        },
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'affichage du graphique du budget :', error);
  }
}

// Fonction pour gérer l'enregistrement des budgets
export function setupEventListeners(): void {
  const saveButton = document.getElementById('saveBudgets') as HTMLButtonElement | null;
  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      const userId = localStorage.getItem('idUser');
      if (!userId) {
        alert('Erreur : Utilisateur non connecté.');
        return;
      }

      // Récupérer les valeurs des champs de budget
      const transportInput = document.getElementById('transportBudget') as HTMLInputElement | null;
      const leisureInput = document.getElementById('leisureBudget') as HTMLInputElement | null;
      const healthInput = document.getElementById('healthBudget') as HTMLInputElement | null;
      const housingInput = document.getElementById('housingBudget') as HTMLInputElement | null;
      const alimentaireInput = document.getElementById('alimentaireBudget') as HTMLInputElement | null;
      const educationInput = document.getElementById('educationBudget') as HTMLInputElement | null;

      if (!transportInput || !leisureInput || !healthInput || !housingInput || !alimentaireInput || !educationInput) {
        alert('Erreur : Certains champs de budget sont manquants.');
        return;
      }

      const budgets: Partial<Budget> = {
        transport: Number(transportInput.value) || 0,
        leisure: Number(leisureInput.value) || 0,
        health: Number(healthInput.value) || 0,
        housing: Number(housingInput.value) || 0,
        alimentaire: Number(alimentaireInput.value) || 0,
        education: Number(educationInput.value) || 0,
      };

      try {
        await saveBudget({ userId, ...budgets } as Budget);
        await displayBudgetChart();
        alert('Budgets enregistrés avec succès !');
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement des budgets :', error);
        alert('Une erreur est survenue lors de l\'enregistrement des budgets. Veuillez réessayer.');
      }
    });
  }
}

// Fonction d'initialisation de la page Budget
export async function initializeBudgetPage(): Promise<void> {
  await displayBudgetData();
  await displayBudgetChart();
  await displayUserProfile();
  initFullscreenButton('fullscreenButton'); // Initialiser le bouton plein écran
  setupEventListeners();

    (window as any).redirectToProfile = redirectToProfile;
  
}

// Initialisation lors du chargement de la page
document.addEventListener('DOMContentLoaded', initializeBudgetPage);
