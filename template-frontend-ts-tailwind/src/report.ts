// Initialise la base de données IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FileDatabase', 3);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('files')) {
        const fileStore = db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
        fileStore.createIndex('userId', 'userId', { unique: false }); // Index par userId
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}


function initUserDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 7);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Convertit un fichier en Base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject('Erreur lors de la lecture du fichier.');
    reader.readAsDataURL(file);
  });
}

// Ajoute un fichier dans IndexedDB
async function addFile(file: File, userId: string): Promise<void> {
  const fileData = {
    id: crypto.randomUUID(),
    userId,
    name: file.name,
    type: file.type,
    content: await fileToBase64(file), // Conversion en Base64 AVANT d'ouvrir la transaction
  };

  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('files', 'readwrite');
    const store = transaction.objectStore('files');

    const request = store.add(fileData);

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(`Erreur lors de l'upload du fichier : ${e}`);
  });
}

// Récupère les fichiers pour un utilisateur
async function getFilesByUser(userId: string): Promise<{ id: string; name: string; content: string; type: string }[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('files', 'readonly');
    const store = transaction.objectStore('files');
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Erreur lors de la récupération des fichiers.');
  });
}

// Télécharge un fichier
function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Gestion de l'upload via l'input
document.getElementById('uploadButton')?.addEventListener('click', async () => {
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const file = fileInput.files?.[0];

  if (!file) {
    alert('Veuillez sélectionner un fichier.');
    return;
  }

  const userId = localStorage.getItem('idUser');
  if (!userId) {
    alert('Utilisateur non connecté.');
    return;
  }

  try {
    await addFile(file, userId);
    alert('Fichier uploadé avec succès !');
    updateFileList(userId);
  } catch (error) {
    console.error(error);
    alert('Erreur lors de l\'upload du fichier.');
  }
});

// Gestion du drag-and-drop
function setupDragAndDrop() {
  const dropZone = document.getElementById('dropZone') as HTMLDivElement;

  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('bg-gray-200');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('bg-gray-200');
  });

  dropZone.addEventListener('drop', async (event) => {
    event.preventDefault();
    dropZone.classList.remove('bg-gray-200');

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      alert('Aucun fichier détecté.');
      return;
    }

    const userId = localStorage.getItem('idUser');
    if (!userId) {
      alert('Utilisateur non connecté.');
      return;
    }

    for (const file of files) {
      try {
        await addFile(file, userId);
      } catch (error) {
        console.error(error);
        alert('Erreur lors de l\'upload du fichier.');
      }
    }
    alert('Fichiers uploadés avec succès via Drag and Drop !');
    updateFileList(userId);
  });
}


async function getUserById(userId: string): Promise<any | null> {
  const db = await initUserDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(userId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject("Erreur lors de la récupération de l'utilisateur.");
  });
}


async function displayUserProfile() {
  const userId = localStorage.getItem("idUser");
  if (!userId) {
    console.error("Utilisateur non connecté.");
    return;
  }

  const user = await getUserById(userId);
  const userProfileImage = document.getElementById("userProfileImage") as HTMLImageElement;

  if (user && user.profileImage) {
    userProfileImage.src = user.profileImage;
  } else {
    userProfileImage.src = "assets/img/default-profile.png";
  }
}

function redirectToProfile() {
  window.location.href = 'profile.html'; // Remplacez 'profile.html' par le chemin réel de votre page Profile
}



// Deletes a file from IndexedDB
async function deleteFile(fileId: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('files', 'readwrite');
    const store = transaction.objectStore('files');
    const request = store.delete(fileId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Erreur lors de la suppression du fichier.');
  });
}

async function updateFileList(userId: string) {
  const fileList = document.getElementById('fileList') as HTMLUListElement;
  fileList.innerHTML = '';

  try {
    const files = await getFilesByUser(userId);

    if (files.length === 0) {
      const emptyState = document.createElement('li');
      emptyState.textContent = 'Aucun fichier disponible.';
      emptyState.className = 'text-gray-500 text-center';
      fileList.appendChild(emptyState);
      return;
    }

    files.forEach((file) => {
      const listItem = document.createElement('li');
      listItem.textContent = file.name;
      listItem.className = 'flex justify-between items-center mb-2';

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'flex gap-4';

      const downloadButton = document.createElement('button');
      downloadButton.innerHTML = '<i class="bi bi-download"></i> Télécharger';
      downloadButton.className = 'download-button';
      downloadButton.addEventListener('click', () => downloadFile(file.name, file.content, file.type));

      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = '<i class="bi bi-trash"></i> Supprimer';
      deleteButton.className = 'delete-button';
      deleteButton.addEventListener('click', async () => {
        await deleteFile(file.id);
        alert('Fichier supprimé avec succès.');
        updateFileList(userId);
      });

      buttonContainer.appendChild(downloadButton);
      buttonContainer.appendChild(deleteButton);

      listItem.appendChild(buttonContainer);
      fileList.appendChild(listItem);
    });
  } catch (error) {
    console.error(error);
    alert('Erreur lors de la mise à jour de la liste des fichiers.');
  }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    alert('Utilisateur non connecté.');
    return;
  }

  setupDragAndDrop();
  updateFileList(userId);
  displayUserProfile();
});
