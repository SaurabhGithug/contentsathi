// @ts-ignore — crypto-js has no bundled types; install @types/crypto-js if desired
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || "default-dev-key-do-not-use-in-prod";

/**
 * Encrypts a sensitive string (like an OAuth access token) using AES-256
 */
export function encryptToken(token: string): string {
  try {
    return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt token");
  }
}

/**
 * Decrypts an AES-256 encrypted string back to its original value
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!originalText) {
      throw new Error("Decryption returned empty string");
    }
    
    return originalText;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt token");
  }
}
