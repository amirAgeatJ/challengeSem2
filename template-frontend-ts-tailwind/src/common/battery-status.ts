// src/battery-status.ts

/**
 * Interface représentant l'état de la batterie.
 */
interface BatteryStatus {
    level: number;       // Niveau de la batterie (0.0 à 1.0)
    charging: boolean;   // Indique si la batterie est en charge
    chargingTime: number; // Temps restant pour charger la batterie (en secondes)
    dischargingTime: number; // Temps restant avant décharge complète (en secondes)
  }
  
  /**
   * Récupère l'état de la batterie.
   * @returns {Promise<BatteryStatus>} Une promesse résolue avec l'état de la batterie.
   */
  async function getBatteryStatus(): Promise<BatteryStatus> {
    const battery = await (navigator as any).getBattery(); // Utilisation de 'any' pour éviter les erreurs TypeScript
    return {
      level: battery.level,
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime,
    };
  }
  
  /**
   * Met à jour l'affichage du statut de la batterie sur la page.
   */
  async function displayBatteryStatus(): Promise<void> {
    const batteryStatusElement = document.getElementById('batteryStatus');
    if (!batteryStatusElement) return;
  
    try {
      const status = await getBatteryStatus();
      const levelPercentage = Math.round(status.level * 100);
  
      batteryStatusElement.textContent = `Batterie : ${levelPercentage}%`;
  
      // Optionnel: Mettre à jour d'autres informations
      // batteryStatusElement.textContent += status.charging ? ' (En charge)' : ' (Déchargement)';
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de la batterie:', error);
      batteryStatusElement.textContent = 'Statut de la batterie indisponible.';
    }
  }
  
  /**
   * Initialise la gestion du statut de la batterie.
   */
  export function initBatteryStatus(): void {
    if (isBatteryApiSupported()) {
      displayBatteryStatus();
  
      // Écouter les changements de niveau de batterie
      (navigator as any).getBattery().then((battery: any) => {
        battery.onlevelchange = displayBatteryStatus;
        battery.onchargingchange = displayBatteryStatus;
      });
    } else {
      const batteryStatusElement = document.getElementById('batteryStatus');
      if (batteryStatusElement) {
        batteryStatusElement.textContent = 'Statut de la batterie non supporté par ce navigateur.';
      }
    }
  }
  
  /**
   * Vérifie si l'API de Statut de la Batterie est supportée.
   * @returns {boolean} Vrai si supportée, sinon faux.
   */
  function isBatteryApiSupported(): boolean {
    return 'getBattery' in navigator;
  }
  