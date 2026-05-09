import CryptoJS from 'crypto-js';

export class DbEncryption {
  private key: string;

  constructor() {
    this.key = this.getEncryptionKey();
  }

  private getEncryptionKey(): string {
    const stored = process.env.MEMORY_ENCRYPTION_KEY || '';
    if (stored) {
      return stored;
    }

    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }

  encrypt(value: string): string {
    return CryptoJS.AES.encrypt(value, this.key).toString();
  }

  decrypt(cipherText: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, this.key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      throw new Error('Failed to decrypt data');
    }
  }
}

export const dbEncryption = new DbEncryption();
