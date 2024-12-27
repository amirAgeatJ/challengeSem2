// Fonction pour récupérer le nom d'utilisateur depuis la session
function getUsernameFromSession(): string | null {
    // Exemple : Vous récupérez la session via `localStorage`, `sessionStorage` ou une API
    return localStorage.getItem('userName'); // Remplacez par la méthode appropriée à votre application
}

// Fonction pour afficher le nom d'utilisateur à côté de l'icône de profil
function displayUsername(): void {
    const usernameDisplay = document.getElementById('username-display');
    if (!usernameDisplay) return;

    const username = getUsernameFromSession();
    if (username) {
        usernameDisplay.textContent = username; // Affiche le nom de l'utilisateur
    } else {
        usernameDisplay.textContent = ''; // Aucun nom à afficher
    }
}

// Appeler la fonction au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    displayUsername();
});

function waitFor(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


 /* document.addEventListener('DOMContentLoaded', async () => {
    const fullScreenButton = document.getElementById('fullscreenButton');
    fullScreenButton?.addEventListener('click', toggleFullScreen);
  });
  
  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      // Request fullscreen on the document element (or body)
      document.documentElement.requestFullscreen(); // Makes the entire document fullscreen
    } else {
      document.exitFullscreen(); // Exits fullscreen when pressed again
    }
  }*/