//import emailjs from '../node_modules/@emailjs/browser';

// Initialise la base de données 
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UserDatabase', 3);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'email' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Interface utilisateur
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  profileImage?: string; // Photo de profil (base64)
}

// Ajoute un utilisateur dans IndexedDB
async function addUser(user: User): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction('users', 'readwrite');
  const store = transaction.objectStore('users');

  store.add(user);

  transaction.oncomplete = () => console.log("Utilisateur ajouté avec succès !");
  transaction.onerror = () => console.error("Erreur lors de l'ajout de l'utilisateur");
}

// Capture une photo avec la caméra
function startCamera() {
  const video = document.getElementById('camera') as HTMLVideoElement;
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const context = canvas.getContext('2d');

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
    })
    .catch((error) => {
      console.error("Erreur lors de l'accès à la caméra :", error);
      alert("Impossible d'accéder à la caméra.");
    });

  document.getElementById('captureButton')?.addEventListener('click', () => {
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png'); // Convertit en base64
    (document.getElementById('profileImage') as HTMLInputElement).value = imageData;

    // Afficher l'image capturée
    const profileImageDisplay = document.getElementById('profileImageDisplay') as HTMLImageElement;
    profileImageDisplay.src = imageData;
  });
}

// Setup Drag and Drop avec HTML Drag and Drop API
function setupDragAndDrop() {
  const dropZone = document.getElementById('dropZone') as HTMLDivElement;
  const profileImageInput = document.getElementById('profileImage') as HTMLInputElement;
  const profileImageDisplay = document.getElementById('profileImageDisplay') as HTMLImageElement;

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('bg-gray-200');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('bg-gray-200');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-gray-200');

    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        profileImageInput.value = reader.result as string;
        profileImageDisplay.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      alert("Veuillez déposer un fichier image valide.");
    }
  });
}

// Fonction pour vérifier si les mots de passe correspondent
function validatePassword() {
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const confirmPassword = (document.getElementById('confirmpassword') as HTMLInputElement).value;
  const errorElement = document.getElementById('passwordError') as HTMLElement;

  if (password !== confirmPassword) {
    errorElement.classList.remove('hidden');
    return false;
  } else {
    errorElement.classList.add('hidden');
    return true;
  }
}

function isTermsAccepted(): boolean {
  const termsCheckbox = document.getElementById('termsCheckbox') as HTMLInputElement;
  return termsCheckbox.checked;
}


// Gestionnaire d'événements pour l'inscription
document.getElementById('registerForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Vérifie si les mots de passe correspondent
  if (!validatePassword()) {
    return; // Si les mots de passe ne correspondent pas, ne soumettez pas le formulaire
  }

  // Vérifie si l'utilisateur a accepté les termes et conditions
  if (!isTermsAccepted()) {
    alert("Vous devez accepter les termes et conditions.");
    return; // Ne soumettez pas le formulaire si les termes ne sont pas acceptés
  }

  const username = (document.getElementById('username') as HTMLInputElement).value;
  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const profileImage = (document.getElementById('profileImage') as HTMLInputElement).value;

  const userId = crypto.randomUUID();

  const user: User = { id: userId, username, email, password, profileImage };

  try {
    await addUser(user);
    alert("Utilisateur inscrit avec succès !");
     // Send email notification to the new user
     //await sendEmailNotification(user);
    window.location.href = 'login.html';

  } catch (error) {
    alert("Erreur lors de l'inscription. Cet email existe peut-être déjà.");
  }
});

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  startCamera();
  setupDragAndDrop();
});


function handleCredentialResponse(response: any) {
  console.log("Encoded JWT ID token: " + response.credential);

  // Decode the JWT to extract user information (e.g., email, name)
  const userToken = response.credential;
  const base64Url = userToken.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const decodedData = JSON.parse(atob(base64));

  const user: User = {
    id: crypto.randomUUID(),
    username: decodedData.name,
    email: decodedData.email,
    password: '', // Pas besoin de mot de passe pour les connexions via Gmail
    profileImage: decodedData.picture, // Utiliser l'image de profil Google
  };

  addUser(user)
    .then(() => {
      if (user) {
        // Stocke l'ID utilisateur dans le Local Storage
        localStorage.setItem('idUser', user.id);
        localStorage.setItem('userName', user.username);
        alert("Connexion réussie !");
        
        window.location.href = "about.html"; // Redirige vers la page About
      }
      alert(`Utilisateur ${decodedData.name} enregistré avec succès !`);
      window.location.href = 'about.html'; // Redirige vers le tableau de bord
    })
    .catch((error) => {
      console.error('Erreur lors de l\'enregistrement de l\'utilisateur Google :', error);
      alert('Erreur lors de l\'enregistrement.');
    });

  console.log("User info:", decodedData);

  // Use this information (e.g., save it in IndexedDB or start a session)

}

// Ensure this function is available globally for the Google API to call
(window as any).handleCredentialResponse = handleCredentialResponse;

function facebookLogin() {
  console.log('Attempting Facebook login...');
  
  FB.login((response: any) => {
    if (response.authResponse) {
      console.log('Welcome! Fetching your information...');
      
      FB.api('/me', { fields: 'id,name,email,picture' }, async (userInfo: any) => {
        console.log('User info:', userInfo);

        const user = {
          id: crypto.randomUUID(), // Generate a unique ID for the user
          username: userInfo.name,
          email: userInfo.email || '', // Fallback to empty string if email is not provided
          password: '', // No password needed for Facebook login
          profileImage: userInfo.picture.data.url, // Facebook profile picture
        };

        try {
          // Add user to your database
          await addUser(user); // Ensure `addUser` is defined and adds the user to your database

          // Store user info in localStorage
          localStorage.setItem('idUser', user.id);
          localStorage.setItem('userName', user.username);

          alert('Connexion réussie avec Facebook !');
          window.location.href = 'about.html'; // Redirect to About page
        } catch (error) {
          console.error('Erreur lors de l\'enregistrement de l\'utilisateur Facebook :', error);
          alert('Erreur lors de l\'enregistrement.');
        }
      });
    } else {
      console.error('User cancelled login or did not fully authorize.');
      alert('Connexion Facebook échouée.');
    }
  }, { scope: 'public_profile,email' }); // Request necessary permissions
}
// Ensure the function is globally accessible
(window as any).facebookLogin = facebookLogin;
// Function to send email notification
/*.init('07VgqYuU06uWZa6Cw'); // Replace with your public key

async function sendEmailNotification(user: User) {
  const templateParams = {
    to_name: user.username,
    to_email: user.email,
    message: `Bonjour ${user.username},\n\nVotre compte a été créé avec succès !\n\nMerci d'avoir rejoint notre plateforme.`,
    reply_to: 'your-email@example.com', // Replace with your email if necessary
  };

  try {
    const response = await emailjs.send('service_qw23q9b', 'template_bk7cf9e', templateParams); // Replace 'your_template_id' with your actual template ID
    console.log('Email envoyé avec succès', response);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email', error);
  }
}
*/