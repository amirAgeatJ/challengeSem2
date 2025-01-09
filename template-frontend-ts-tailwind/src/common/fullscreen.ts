// src/fullscreen.ts

/**
 * Initialise le bouton de plein écran.
 * @param buttonId L'ID du bouton qui déclenche le mode plein écran.
 */
export function initFullscreenButton(buttonId: string): void {
    const fullscreenButton = document.getElementById(buttonId);
    if (!fullscreenButton) {
      console.error(`Bouton avec l'ID "${buttonId}" introuvable.`);
      return;
    }
  
    fullscreenButton.addEventListener('click', toggleFullscreen);
  }
  
  /**
   * Bascule le mode plein écran.
   */
  export function toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Erreur lors de l'entrée en plein écran: ${err}`);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch((err) => {
        console.error(`Erreur lors de la sortie du plein écran: ${err}`);
      });
    }
  }
  