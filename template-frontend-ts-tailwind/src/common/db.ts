// src/db.ts

/**
 * Module de gestion de la base de données IndexedDB pour l'application FundFlow.
 * Ce module centralise toutes les opérations liées aux utilisateurs, budgets, transactions et fichiers.
 * 
 * @module db
 */

//////////////////////////
// Interfaces
//////////////////////////

/**
 * Interface représentant un utilisateur.
 */
export interface User {
  id: string; // Clé primaire
  username: string;
  email: string;
  password: string; // **Attention** : Stocker les mots de passe en clair n'est PAS sécurisé. En production, utilisez un hash sécurisé.
  profileImage?: string; // URL de l'image de profil (facultatif)
}

/**
 * Interface représentant un budget utilisateur.
 */
export interface Budget {
  userId: string; // Clé étrangère vers User.id
  global: number;
  transport: number;
  leisure: number;
  health: number;
  housing: number;
  education: number;
  alimentaire?: number; // Facultatif
}

/**
 * Interface représentant une transaction.
 */
export interface Transaction {
  id?: number; // Clé primaire auto-incrémentée
  userId: string; // Clé étrangère vers User.id
  type: 'income' | 'expense';
  category: string;
  amount: number;
  location: string;
  date: Date;
}

/**
 * Interface représentant un fichier.
 */
export interface FileData {
  id: string; // UUID
  userId: string; // Clé étrangère vers User.id
  name: string;
  type: string;
  content: string; // Base64 string
}

//////////////////////////
// Initialisation de la Base de Données
//////////////////////////

/**
 * Initialise IndexedDB avec les object stores nécessaires.
 * 
 * @returns {Promise<IDBDatabase>} Une promesse qui résout vers l'instance de la base de données.
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FundFlowDB', 4); // Incrémentez la version si vous modifiez les object stores

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Création de l'object store pour les utilisateurs
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('email', 'email', { unique: true }); // Index unique sur l'email
      }

      // Création de l'object store pour les budgets
      if (!db.objectStoreNames.contains('budgets')) {
        db.createObjectStore('budgets', { keyPath: 'userId' });
      }

      // Création de l'object store pour les transactions
      if (!db.objectStoreNames.contains('transactions')) {
        const transactionStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        transactionStore.createIndex('userId', 'userId', { unique: false });
      }

      // Création de l'object store pour les fichiers
      if (!db.objectStoreNames.contains('files')) {
        const fileStore = db.createObjectStore('files', { keyPath: 'id' });
        fileStore.createIndex('userId', 'userId', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Fonction générique pour obtenir un object store avec la transaction appropriée.
 * 
 * @param {IDBDatabase} db - Instance de la base de données.
 * @param {string} storeName - Nom de l'object store.
 * @param {IDBTransactionMode} mode - Mode de transaction ('readonly' ou 'readwrite').
 * @returns {IDBObjectStore} L'object store demandé.
 */
export function getObjectStore(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode
): IDBObjectStore {
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

//////////////////////////
// Fonctions de Gestion des Utilisateurs
//////////////////////////

/**
 * Ajoute un nouvel utilisateur à la base de données.
 * 
 * @param {User} user - L'utilisateur à ajouter.
 * @returns {Promise<void>} Une promesse qui résout lorsque l'utilisateur est ajouté.
 */
export async function addUser(user: User): Promise<void> {
  const db = await initDB();
  const store = getObjectStore(db, 'users', 'readwrite');

  return new Promise((resolve, reject) => {
    const request = store.add(user);

    request.onsuccess = () => {
      console.log("Utilisateur ajouté avec succès !");
      resolve();
    };

    request.onerror = () => {
      console.error("Erreur lors de l'ajout de l'utilisateur", request.error);
      reject(request.error);
    };
  });
}

/**
 * Vérifie les identifiants d'un utilisateur (email et mot de passe).
 * 
 * @param {string} email - L'email de l'utilisateur.
 * @param {string} password - Le mot de passe de l'utilisateur.
 * @returns {Promise<User | null>} Une promesse qui résout vers l'utilisateur s'il est trouvé, sinon null.
 */
export async function verifyUser(email: string, password: string): Promise<User | null> {
  const db = await initDB();
  const store = getObjectStore(db, 'users', 'readonly');
  const index = store.index('email');

  return new Promise((resolve, reject) => {
    const request = index.get(email);

    request.onsuccess = () => {
      const user = request.result as User | undefined;
      if (user && user.password === password) { // **Attention** : Comparaison des mots de passe en clair. Utilisez un hash en production.
        resolve(user);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      console.error("Erreur lors de la vérification de l'utilisateur", request.error);
      reject(request.error);
    };
  });
}

/**
 * Récupère un utilisateur par son ID.
 * 
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<User | null>} Une promesse qui résout vers l'utilisateur s'il est trouvé, sinon null.
 */
export async function getUserById(userId: string): Promise<User | null> {
  const db = await initDB();
  const store = getObjectStore(db, 'users', 'readonly');

  return new Promise((resolve, reject) => {
    const request = store.get(userId);

    request.onsuccess = () => {
      const user = request.result as User | undefined;
      resolve(user || null);
    };

    request.onerror = () => {
      console.error("Erreur lors de la récupération de l'utilisateur", request.error);
      reject(request.error);
    };
  });
}

/**
 * Met à jour les informations d'un utilisateur.
 * 
 * @param {User} user - L'utilisateur avec les informations mises à jour.
 * @returns {Promise<void>} Une promesse qui résout lorsque l'utilisateur est mis à jour.
 */
export async function updateUser(user: User): Promise<void> {
  const db = await initDB();
  const store = getObjectStore(db, 'users', 'readwrite');

  return new Promise((resolve, reject) => {
    const request = store.put(user);

    request.onsuccess = () => {
      console.log("Utilisateur mis à jour avec succès !");
      resolve();
    };

    request.onerror = () => {
      console.error("Erreur lors de la mise à jour de l'utilisateur", request.error);
      reject(request.error);
    };
  });
}

/**
 * Supprime un utilisateur de la base de données.
 * 
 * @param {string} userId - L'ID de l'utilisateur à supprimer.
 * @returns {Promise<void>} Une promesse qui résout lorsque l'utilisateur est supprimé.
 */
export async function deleteUser(userId: string): Promise<void> {
  const db = await initDB();
  const store = getObjectStore(db, 'users', 'readwrite');

  return new Promise((resolve, reject) => {
    const request = store.delete(userId);

    request.onsuccess = () => {
      console.log("Utilisateur supprimé avec succès !");
      resolve();
    };

    request.onerror = () => {
      console.error("Erreur lors de la suppression de l'utilisateur", request.error);
      reject(request.error);
    };
  });
}

//////////////////////////
// Fonctions de Gestion des Budgets
//////////////////////////

/**
 * Ajoute ou met à jour le budget d'un utilisateur.
 * 
 * @param {Budget} budget - Le budget à ajouter ou mettre à jour.
 * @returns {Promise<void>} Une promesse qui résout lorsque le budget est ajouté ou mis à jour.
 */
export async function saveBudget(budget: Budget): Promise<void> {
  const db = await initDB();
  const store = getObjectStore(db, 'budgets', 'readwrite');

  return new Promise((resolve, reject) => {
    const request = store.put(budget);

    request.onsuccess = () => {
      console.log("Budget sauvegardé avec succès !");
      resolve();
    };

    request.onerror = () => {
      console.error("Erreur lors de la sauvegarde du budget", request.error);
      reject(request.error);
    };
  });
}

/**
 * Récupère le budget d'un utilisateur par son ID.
 * 
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<Budget | null>} Une promesse qui résout vers le budget s'il est trouvé, sinon null.
 */
export async function getBudget(userId: string): Promise<Budget | null> {
  const db = await initDB();
  const store = getObjectStore(db, 'budgets', 'readonly');

  return new Promise((resolve, reject) => {
    const request = store.get(userId);

    request.onsuccess = () => {
      const budget = request.result as Budget | undefined;
      resolve(budget || null);
    };

    request.onerror = () => {
      console.error("Erreur lors de la récupération du budget", request.error);
      reject(request.error);
    };
  });
}

/**
 * Ajoute ou met à jour le budget d'un utilisateur en fonction d'une transaction.
 * 
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {'income' | 'expense'} type - Le type de transaction ('income' ou 'expense').
 * @param {string} category - La catégorie de la transaction.
 * @param {number} amount - Le montant de la transaction.
 * @returns {Promise<void>} Une promesse qui résout lorsque le budget est mis à jour.
 */
export async function updateBudgets(
  userId: string,
  type: 'income' | 'expense',
  category: string,
  amount: number
): Promise<void> {
  // Récupère le budget actuel de l'utilisateur
  const existingBudget = await getBudget(userId);

  if (!existingBudget) {
    // Si aucun budget n'existe, crée un nouveau budget avec des valeurs initiales
    const newBudget: Budget = {
      userId,
      global: type === 'income' ? amount : -amount,
      transport: 0,
      leisure: 0,
      health: 0,
      housing: 0,
      education: 0,
      alimentaire: 0,
    };

    // Ajuste la catégorie spécifique
    if (newBudget.hasOwnProperty(category)) {
      (newBudget as any)[category] += type === 'income' ? amount : -amount;
    } else {
      console.warn(`La catégorie "${category}" n'existe pas dans les budgets.`);
    }

    await saveBudget(newBudget);
    return;
  }

  // Calcule l'ajustement basé sur le type de transaction
  const adjustment = type === 'income' ? amount : -amount;

  // Met à jour le montant global
  existingBudget.global += adjustment;

  // Met à jour la catégorie spécifique
  if (existingBudget.hasOwnProperty(category)) {
    // TypeScript nécessite un cast pour accéder dynamiquement aux propriétés
    (existingBudget as any)[category] += adjustment;
  } else {
    console.warn(`La catégorie "${category}" n'existe pas dans les budgets.`);
  }

  // Sauvegarde le budget mis à jour
  await saveBudget(existingBudget);
}

//////////////////////////
// Fonctions de Gestion des Transactions
//////////////////////////

/**
 * Ajoute une transaction à la base de données.
 * 
 * @param {Transaction} transaction - La transaction à ajouter.
 * @returns {Promise<void>} Une promesse qui résout lorsque la transaction est ajoutée.
 */
export async function addTransaction(transaction: Transaction): Promise<void> {
  const db = await initDB();
  const store = getObjectStore(db, 'transactions', 'readwrite');
  const request = store.add(transaction);

  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => {
      console.log("Transaction ajoutée avec succès !");
      resolve();
    };
    request.onerror = () => {
      console.error("Erreur lors de l'ajout de la transaction", request.error);
      reject(request.error);
    };
  });
}

/**
 * Récupère toutes les transactions d'un utilisateur.
 * 
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<Transaction[]>} Une promesse qui résout vers un tableau de transactions.
 */
export async function getTransactionsForUser(userId: string): Promise<Transaction[]> {
  const db = await initDB();
  const store = getObjectStore(db, 'transactions', 'readonly');
  const index = store.index('userId');

  return new Promise((resolve, reject) => {
    const request = index.getAll(IDBKeyRange.only(userId));

    request.onsuccess = () => {
      const transactions = request.result as Transaction[];
      resolve(transactions);
    };

    request.onerror = () => {
      console.error("Erreur lors de la récupération des transactions", request.error);
      reject(request.error);
    };
  });
}

/**
 * Supprime une transaction de la base de données.
 * 
 * @param {number} transactionId - L'ID de la transaction à supprimer.
 * @returns {Promise<void>} Une promesse qui résout lorsque la transaction est supprimée.
 */
export async function deleteTransaction(transactionId: number): Promise<void> {
  const db = await initDB();
  const store = getObjectStore(db, 'transactions', 'readwrite');

  return new Promise((resolve, reject) => {
    const request = store.delete(transactionId);

    request.onsuccess = () => {
      console.log("Transaction supprimée avec succès !");
      resolve();
    };

    request.onerror = () => {
      console.error("Erreur lors de la suppression de la transaction", request.error);
      reject(request.error);
    };
  });
}

//////////////////////////
// Fonctions de Gestion des Fichiers
//////////////////////////

/**
 * Ajoute un fichier dans la base de données.
 * 
 * @param {FileData} fileData - Les données du fichier à ajouter.
 * @returns {Promise<void>} Une promesse qui résout lorsque le fichier est ajouté.
 */
export async function addFile(fileData: FileData): Promise<void> {
  const db = await initDB();
  const store = getObjectStore(db, 'files', 'readwrite');

  return new Promise((resolve, reject) => {
    const request = store.add(fileData);

    request.onsuccess = () => {
      console.log("Fichier ajouté avec succès !");
      resolve();
    };

    request.onerror = () => {
      console.error("Erreur lors de l'ajout du fichier", request.error);
      reject(request.error);
    };
  });
}

/**
 * Récupère les fichiers associés à un utilisateur.
 * 
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<FileData[]>} Une promesse qui résout vers un tableau de fichiers.
 */
export async function getFilesByUser(userId: string): Promise<FileData[]> {
  const db = await initDB();
  const store = getObjectStore(db, 'files', 'readonly');
  const index = store.index('userId');

  return new Promise((resolve, reject) => {
    const request = index.getAll(IDBKeyRange.only(userId));

    request.onsuccess = () => {
      const files = request.result as FileData[];
      resolve(files);
    };

    request.onerror = () => {
      console.error("Erreur lors de la récupération des fichiers", request.error);
      reject(request.error);
    };
  });
}

//////////////////////////
// Fonctions Utilitaires
//////////////////////////

/**
 * Génère un UUID (utilisé pour l'ID des utilisateurs et des fichiers).
 * 
 * @returns {string} Un UUID.
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}
