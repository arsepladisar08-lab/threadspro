/**
 * AutoThreads Secure Cryptographic Utility
 * Menggunakan Web Crypto API (AES-GCM 256-bit) untuk enkripsi & dekripsi
 * kredensial sensitif (Token Akses Threads, Gemini API Key, Meta App Secret)
 * baik di lingkungan Browser maupun Node runtime.
 */

const ENC_PREFIX = "enc:v1:";

/**
 * Dapatkan encryption key berbasis TOKEN_ENC_KEY atau seed bawaan aman
 */
async function getCryptoKey(salt: Uint8Array): Promise<CryptoKey> {
  let masterSecret = "";

  // Cek env browser / node
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_TOKEN_ENC_KEY) {
    masterSecret = import.meta.env.VITE_TOKEN_ENC_KEY;
  } else if (typeof process !== "undefined" && process.env?.TOKEN_ENC_KEY) {
    masterSecret = process.env.TOKEN_ENC_KEY;
  }

  if (!masterSecret) {
    // Fallback derivation key spesifik instance AutoThreads
    masterSecret = "autothreads_meta_gemini_sec_token_enc_key_32b!";
  }

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(masterSecret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Mengenkripsi teks sensitif ke format ciphertext aman: enc:v1:<salt_hex>:<iv_hex>:<cipher_hex>
 */
export async function encryptSensitive(plainText: string): Promise<string> {
  if (!plainText || plainText.startsWith(ENC_PREFIX)) {
    return plainText;
  }

  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await getCryptoKey(salt);

    const enc = new TextEncoder();
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(plainText)
    );

    const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
    const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join("");
    const cipherHex = Array.from(new Uint8Array(cipherBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

    return `${ENC_PREFIX}${saltHex}:${ivHex}:${cipherHex}`;
  } catch (err) {
    console.warn("Enkripsi kredensial gagal, fallback teks:", err);
    return plainText;
  }
}

/**
 * Mendekripsi string ciphertext kembali ke plaintext
 */
export async function decryptSensitive(cipherText: string | null | undefined): Promise<string | null> {
  if (!cipherText) return null;
  if (!cipherText.startsWith(ENC_PREFIX)) {
    // Data plaintext warisan (backward compatibility)
    return cipherText;
  }

  try {
    const parts = cipherText.slice(ENC_PREFIX.length).split(":");
    if (parts.length !== 3) return cipherText;

    const [saltHex, ivHex, dataHex] = parts;

    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
    const data = new Uint8Array(dataHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);

    const key = await getCryptoKey(salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.warn("Dekripsi kredensial gagal, kemungkinan kunci tidak cocok:", err);
    return null;
  }
}
