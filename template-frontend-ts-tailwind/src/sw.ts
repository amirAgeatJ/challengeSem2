self.addEventListener('push', function (event) {
  // Vérifiez si des données sont disponibles dans l'événement push
  let data = {};
  if (event.data) {
    try {
      data = event.data.json(); // Parse les données JSON
    } catch (e) {
      console.error('Erreur lors de la lecture des données de la notification push :', e);
    }
  }

  // Définissez un titre et un message par défaut au cas où les données sont manquantes
  const title = data.title || 'Nouvelle Notification';
  const body = data.body || 'Vous avez une nouvelle notification.';
  const options = {
    body: body,
    icon: data.icon || 'icon.png', // Remplacez par un chemin valide vers une icône
  };

  // Affiche la notification
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
