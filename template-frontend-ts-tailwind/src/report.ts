// src/report.ts

import type { FileData } from './common/db.js'; // Import uniquement le type
import { addFile, getFilesByUser, generateUUID, getUserById } from './common/db.js'; // Import des fonctions
import {redirectToProfile } from './userProfile.js'; // Importation correcte avec .js
import { notifyUser, sendPushNotification } from './common/notification.js'; // Import des fonctions de notification

/**
 * Convertit un fichier en Base64.
 * @param file Fichier à convertir.
 * @returns Promise résolue avec la chaîne Base64.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject('Erreur lors de la lecture du fichier.');
    reader.readAsDataURL(file);
  });
}

/**
 * Télécharge un fichier en créant un lien temporaire.
 * @param name Nom du fichier.
 * @param content Contenu du fichier en Base64.
 * @param type Type MIME du fichier.
 */
function downloadFile(name: string, content: string, type: string) {
  // Convertir Base64 en Blob
  const byteString = atob(content.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type });

  // Créer un lien et déclencher le téléchargement
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Met à jour la liste des fichiers affichés pour un utilisateur.
 * @param userId ID de l'utilisateur.
 */
async function updateFileList(userId: string) {
  const fileList = document.getElementById('fileList') as HTMLUListElement;
  fileList.innerHTML = '';

  try {
    const files = await getFilesByUser(userId);
    files.forEach((file) => {
      const listItem = document.createElement('li');
      listItem.textContent = file.name;

      const downloadButton = document.createElement('button');
      downloadButton.textContent = 'Télécharger';
      downloadButton.className = 'ml-2 bg-green-500 text-white p-1 rounded';
      downloadButton.addEventListener('click', () => downloadFile(file.name, file.content, file.type));

      listItem.appendChild(downloadButton);
      fileList.appendChild(listItem);
    });
  } catch (error) {
    console.error(error);
    alert('Erreur lors de la mise à jour de la liste des fichiers.');
  }
}

/**
 * Ajoute un fichier à la base de données et met à jour l'affichage.
 * @param file Fichier à ajouter.
 * @param userId ID de l'utilisateur.
 */
async function handleFileUpload(file: File, userId: string) {
  try {
    const fileData: FileData = {
      id: generateUUID(),
      userId,
      name: file.name,
      type: file.type,
      content: await fileToBase64(file),
    };

    await addFile(fileData);
    await notifyUser('Fichier uploadé avec succès !');
    sendPushNotification('Upload Réussi', `Le fichier "${file.name}" a été uploadé avec succès.`);
    await updateFileList(userId);
  } catch (error) {
    console.error(error);
    alert('Erreur lors de l\'upload du fichier.');
  }
}

/**
 * Initialise les gestionnaires d'événements pour l'upload et le drag-and-drop.
 */
function setupFileHandlers() {
  const uploadButton = document.getElementById('uploadButton') as HTMLButtonElement;
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const dropZone = document.getElementById('dropZone') as HTMLDivElement;

  // Gestionnaire pour le bouton d'upload
  uploadButton.addEventListener('click', async () => {
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

    await handleFileUpload(file, userId);
  });

  // Gestionnaires pour le drag-and-drop
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
      await handleFileUpload(file, userId);
    }

    alert('Fichiers uploadés avec succès via Drag and Drop !');
    await updateFileList(userId);
  });
}

/**
 * Affiche le profil utilisateur en mettant à jour l'image de profil.
 */
async function displayUserProfile() {
  const userId = localStorage.getItem("idUser");
  if (!userId) {
    console.error("Utilisateur non connecté.");
    return;
  }

  try {
    const user = await getUserById(userId);
    const userProfileImage = document.getElementById("userProfileImage") as HTMLImageElement;

    if (user && user.profileImage) {
      userProfileImage.src = user.profileImage;
    } else {
      userProfileImage.src = "assets/img/default-profile.png";
    }
  } catch (error) {
    console.error(error);
    alert('Erreur lors de la récupération du profil utilisateur.');
  }
}

/**
 * Initialisation au chargement du DOM.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const userId = localStorage.getItem('idUser');
  if (!userId) {
    alert('Utilisateur non connecté.');
    return;
  }

  setupFileHandlers();
  await updateFileList(userId);
  await displayUserProfile();
    (window as any).redirectToProfile = redirectToProfile;
  
});
