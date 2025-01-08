/**
 * Affiche l'image du profil utilisateur
 */
async function displayUserProfile() {
    const userId = localStorage.getItem('idUser');
    if (!userId) {
        console.error('Utilisateur non connecté.');
        return;
    }

    const user = await getUserById(userId); // Suppose que cette fonction existe dans about.js
    const userProfileImage = document.getElementById('userProfileImage');

    if (user && user.profileImage) {
        userProfileImage.src = user.profileImage;
    } else {
        userProfileImage.src = 'assets/img/default-profile.png'; // Image par défaut
    }
}

/**
 * Gère la conversion de devise
 */
function handleCurrencyToggle() {
    const toggleCurrencyButton = document.getElementById('toggleCurrencyButton');
    if (toggleCurrencyButton) {
        toggleCurrencyButton.addEventListener('click', async () => {
            if (currentCurrency === 'EUR') {
                currentCurrency = 'USD';
                toggleCurrencyButton.textContent = 'Convertir en EUR';
            } else {
                currentCurrency = 'EUR';
                toggleCurrencyButton.textContent = 'Convertir en USD';
            }

            // Met à jour les données affichées
            await displayTotalBudget(); // Suppose que cette fonction existe dans about.js
            await displayUserBudget();
            await displayTransactions();
            await displayTransactionSummary();
        });
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    displayUserProfile();
    handleCurrencyToggle();
});
