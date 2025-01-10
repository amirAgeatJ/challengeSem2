// src/common/idleDetection.ts

/**
 * Fonction pour configurer la détection d'inactivité.
 */
export async function setupIdleDetection(): Promise<void> {
    if (!('IdleDetector' in window)) {
      console.warn('Idle Detection API non prise en charge dans ce navigateur.');
      return;
    }
  
    try {
      const permission = await IdleDetector.requestPermission();
      if (permission !== 'granted') {
        console.warn("Permission pour l'API Idle Detection refusée.");
        return;
      }
  
      const idleDetector = new IdleDetector();
      idleDetector.addEventListener('change', () => {
        const userState = idleDetector.userState;   // 'active' ou 'idle'
        const screenState = idleDetector.screenState; // 'locked' ou 'unlocked'
  
        console.log(`État utilisateur : ${userState}, État écran : ${screenState}`);
  
        if (userState === 'idle') {
          alert("Vous êtes inactif. Revenez pour continuer.");
        }
      });
  
      await idleDetector.start({ threshold: 60000 }); // 60 sec
      console.log('Idle Detection activée.');
    } catch (error) {
      console.error("Erreur lors de la configuration de l'Idle Detection API :", error);
    }
  }
  