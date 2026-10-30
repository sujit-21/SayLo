// SAYLO End-to-End Encryption Engine (Native Web Crypto API & IndexedDB)

const DB_NAME = 'saylo_crypto_db';
const STORE_NAME = 'crypto_keys';
const sharedKeyCache = new Map();

// Helper: Open or create IndexedDB for secure CryptoKey storage
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper: Save key in IndexedDB
async function saveKeyToDB(keyName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, keyName);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Helper: Get key from IndexedDB
async function getKeyFromDB(keyName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(keyName);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Buffer to Base64
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64 to Uint8Array
function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 1. Generate or load user's persistent ECDH keypair
 * Private key stays safely stored in IndexedDB (never leaves browser)
 * Public key is returned in SPKI Base64 format to be uploaded to server
 */
export async function getOrCreateUserKeyPair() {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  try {
    const existingPrivateKey = await getKeyFromDB('e2ee_private_key');
    const existingPublicKeyBase64 = await getKeyFromDB('e2ee_public_key');

    if (existingPrivateKey && existingPublicKeyBase64) {
      return {
        privateKey: existingPrivateKey,
        publicKeyBase64: existingPublicKeyBase64,
      };
    }

    // Generate fresh ECDH P-256 KeyPair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      false, // private key is non-extractable from memory for security
      ['deriveKey', 'deriveBits']
    );

    // Export public key to SPKI Base64
    const exportedPub = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyBase64 = bufferToBase64(exportedPub);

    // Save in IndexedDB
    await saveKeyToDB('e2ee_private_key', keyPair.privateKey);
    await saveKeyToDB('e2ee_public_key', publicKeyBase64);

    return {
      privateKey: keyPair.privateKey,
      publicKeyBase64,
    };
  } catch (err) {
    console.error('[E2EE] Failed to get or create key pair:', err);
    return null;
  }
}

/**
 * 2. Derive a shared symmetric AES-GCM 256 key using Alice's private key + Bob's public key
 */
export async function getSharedKey(myPrivateKey, recipientPublicKeyBase64) {
  if (!myPrivateKey || !recipientPublicKeyBase64) return null;

  // Check in-memory cache
  if (sharedKeyCache.has(recipientPublicKeyBase64)) {
    return sharedKeyCache.get(recipientPublicKeyBase64);
  }

  try {
    const rawPub = base64ToUint8Array(recipientPublicKeyBase64);
    const importedPublicKey = await window.crypto.subtle.importKey(
      'spki',
      rawPub.buffer,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      false,
      []
    );

    const sharedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: importedPublicKey,
      },
      myPrivateKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );

    sharedKeyCache.set(recipientPublicKeyBase64, sharedKey);
    return sharedKey;
  } catch (err) {
    console.error('[E2EE] Failed to derive shared key:', err);
    return null;
  }
}

/**
 * 3. Encrypt a text message with AES-GCM 256 using the derived shared key
 */
export async function encryptTextMessage(plaintext, sharedKey) {
  if (!sharedKey || !plaintext) return null;

  try {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit random nonce

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      sharedKey,
      enc.encode(plaintext)
    );

    return {
      ciphertext: bufferToBase64(ciphertextBuffer),
      iv: bufferToBase64(iv),
    };
  } catch (err) {
    console.error('[E2EE] Encryption failed:', err);
    return null;
  }
}

/**
 * 4. Decrypt a message with AES-GCM 256 using the derived shared key
 */
export async function decryptTextMessage(ciphertextBase64, ivBase64, sharedKey) {
  if (!sharedKey || !ciphertextBase64 || !ivBase64) return null;

  try {
    const ciphertext = base64ToUint8Array(ciphertextBase64);
    const iv = base64ToUint8Array(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      sharedKey,
      ciphertext.buffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.warn('[E2EE] Decryption error (signature or key mismatch):', err);
    return null;
  }
}

