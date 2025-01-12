/**
 * Hash le mot de passe en utilisant SHA-256 via l'API Web Crypto.
 * Attention : SHA-256 n'est pas recommandé pour hacher des mots de passe en production.
 *
 * @param password - Le mot de passe en clair à hasher.
 * @returns Une promesse qui résout le hachage en format hexadécimal.
 */
export async function hashPassword(password: string): Promise<string> {
    // Créer un TextEncoder pour convertir la chaîne en Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
  
    // Calculer le digest SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
    // Convertir le résultat (ArrayBuffer) en tableau d'octets
    const hashArray = Array.from(new Uint8Array(hashBuffer));
  
    // Convertir chaque octet en chaîne hexadécimale et concaténer
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
  