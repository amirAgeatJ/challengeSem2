function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 1);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function verifyUser(email: string, password: string): Promise<boolean> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(email);

    request.onsuccess = () => {
      const user = request.result as User;
      resolve(user && user.password === password);
    };
    request.onerror = () => reject(false);
  });
}

document.getElementById('loginForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;

  const isValid = await verifyUser(email, password);
  if (isValid) {
    alert("Connexion réussie !");
    window.location.href = "about.html";
  } else {
    alert("Email ou mot de passe incorrect.");
  }
});
