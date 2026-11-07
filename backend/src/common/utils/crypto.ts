import { createHash, randomBytes } from 'node:crypto';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/** Cryptographically random URL-safe token (base64url). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** SHA-256 hex digest. Used to store tokens so a DB leak never exposes usable tokens. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Random lowercase alphanumeric id (unbiased rejection sampling). */
export function randomId(length: number): string {
  let out = '';
  while (out.length < length) {
    const buf = randomBytes(length * 2);
    for (const byte of buf) {
      if (byte < 252) out += ALPHABET[byte % 36];
      if (out.length === length) break;
    }
  }
  return out;
}
