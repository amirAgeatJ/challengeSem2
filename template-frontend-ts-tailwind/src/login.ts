function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 3); // Version 2

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function verifyUser(email: string, password: string): Promise<User | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(email);

    request.onsuccess = () => {
      const user = request.result as User;
      if (user && user.password === password) {
        resolve(user); // Retourne l'objet utilisateur complet si valide
      } else {
        resolve(null); // Mot de passe incorrect ou utilisateur non trouvé
      }
    };
    request.onerror = () => reject(null);
  });
}

// Écouteur du formulaire de connexion
document.getElementById('loginForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;

  try {
    const user = await verifyUser(email, password); // Vérifie les identifiants
    if (user) {
      // Stocke l'ID utilisateur dans le Local Storage
      localStorage.setItem('idUser', user.id);
      localStorage.setItem('userName', user.username);

      alert("Connexion réussie !");
      window.location.href = "about.html"; // Redirige vers la page About
    } else {
      alert("Email ou mot de passe incorrect.");
    }
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    alert("Une erreur est survenue. Veuillez réessayer.");
  }
});

// Interface utilisateur pour le typage
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  profileImage?:string;
}


async function handleCredentialResponsea(response: any) {
  console.log("Encoded JWT ID token: " + response.credential);

  // Decode the JWT to extract user information (e.g., email, name)
  const userToken = response.credential;
  const base64Url = userToken.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const decodedData = JSON.parse(atob(base64));

  const usera: User = {
    id: crypto.randomUUID(),
    username: decodedData.name,
    email: decodedData.email,
    password: '', // Pas besoin de mot de passe pour les connexions via Gmail
    profileImage: decodedData.picture, // Utiliser l'image de profil Google
  };

  try {
    const user = await verifyUser(usera?.email, usera?.password); // Vérifie les identifiants
    if (user) {
      // Stocke l'ID utilisateur dans le Local Storage
      localStorage.setItem('idUser', usera.id);
      localStorage.setItem('userName', usera.username);

      alert("Connexion réussie !");
      window.location.href = "about.html"; // Redirige vers la page About
    } else {
      alert("Email ou mot de passe incorrect.");
    }
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    alert("Une erreur est survenue. Veuillez réessayer.");
  }

  console.log("User info:", decodedData);

  // Use this information (e.g., save it in IndexedDB or start a session)
  
}

// Ensure this function is available globally for the Google API to call
(window as any).handleCredentialResponsea = handleCredentialResponsea;

declare const FB: any; // Declare FB if TypeScript complains

function facebookLogina() {
  console.log('aaaaa');
  FB.login((response: any) => {
    if (response.authResponse) {
      console.log('Welcome! Fetching your information...');

      FB.api('/me', { fields: 'id,name,email,picture' }, async (userInfo: any) => {
        console.log('User info:', userInfo);

        // Example of processing user info
        const user = {
          id: userInfo.id,
          username: userInfo.name,
          email: userInfo.email,
          profileImage: userInfo.picture.data.url,
        };

        console.log('Logged in user:', user);

        // Optional: Save user info to your database or localStorage
        localStorage.setItem('idUser', user.id);
        localStorage.setItem('userName', user.username);
        alert('Connexion réussie avec Facebook !');

        // Redirect to another page
        window.location.href = 'about.html';
      });
    } else {
      console.error('User cancelled login or did not fully authorize.');
      alert('Connexion Facebook échouée.');
    }
  }, { scope: 'public_profile,email' }); // Request these permissions
}

// Ensure the function is globally accessible
(window as any).facebookLogina = facebookLogina;