// src/common/notification.ts

/**
 * Fonction pour afficher une notification locale.
 * @param message Message de la notification.
 */
export async function notifyUser(message: string): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Les notifications ne sont pas prises en charge par ce navigateur.');
      return;
    }
  
    if (Notification.permission === 'granted') {
      new Notification(message);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(message);
      }
    }
  }
  
  /**
   * Fonction pour envoyer une notification push via le service worker.
   * @param title Titre de la notification.
   * @param body Corps de la notification.
   */
  export function sendPushNotification(title: string, body: string): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .ready
        .then((registration) => {
          registration.showNotification(title, {
            body: body,
            icon: '/icon.png',
          });
        })
        .catch((error) => {
          console.error("Erreur lors de l'envoi de la notification push :", error);
        });
    }
  }
  