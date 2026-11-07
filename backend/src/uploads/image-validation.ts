export type ImageKind = 'jpeg' | 'png' | 'webp';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Detects the real file type from magic bytes; never trust the client-provided mimetype. */
export function detectImageType(buf: Buffer): ImageKind | undefined {
  if (buf.length < 12) return undefined;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return undefined;
}
