import crypto from 'crypto';

export function encryptWord(word: string, cryptoSalt: string) {
  return crypto
    .pbkdf2Sync(word, cryptoSalt, 10000, 64, 'sha512')
    .toString('base64');
}
