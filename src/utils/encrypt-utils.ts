import crypto from 'crypto';

export function encryptWord(
  word: string,
  cryptoSalt: string,
  iterations = 10000,
  keyLen = 64,
) {
  return crypto
    .pbkdf2Sync(word, cryptoSalt, iterations, keyLen, 'sha512')
    .toString('base64');
}
