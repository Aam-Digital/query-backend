import * as crypto from 'crypto';

export class CryptoConfig {
  ENCRYPTION_SECRET = '';
}

export class CryptoService {
  constructor(private config: CryptoConfig) {}

  decrypt(data: { iv: string; data: string }): string {
    const encryptedTextBuffer = Buffer.from(data.data, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      this.getHash(this.config.ENCRYPTION_SECRET),
      Buffer.from(data.iv, 'hex'),
    );

    let decrypted = decipher.update(encryptedTextBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  }

  encrypt(text: string): {
    iv: string;
    data: string;
  } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      this.getHash(this.config.ENCRYPTION_SECRET),
      iv,
    );

    let encryptedText = cipher.update(text);
    encryptedText = Buffer.concat([encryptedText, cipher.final()]);

    return {
      iv: iv.toString('hex'),
      data: encryptedText.toString('hex'),
    };
  }

  private getHash(text: string): Buffer {
    return crypto.createHash('sha256').update(text).digest();
  }
}
