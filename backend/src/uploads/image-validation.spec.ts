import { detectImageType } from './image-validation.js';

describe('detectImageType', () => {
  const pad = (b: number[]) => Buffer.concat([Buffer.from(b), Buffer.alloc(16)]);
  it('detects jpeg, png, webp by magic bytes', () => {
    expect(detectImageType(pad([0xff, 0xd8, 0xff]))).toBe('jpeg');
    expect(detectImageType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
    expect(detectImageType(Buffer.from('RIFF\0\0\0\0WEBPVP8 '))).toBe('webp');
  });
  it('rejects disguised files', () => {
    expect(detectImageType(Buffer.from('<svg onload=alert(1)></svg>'))).toBeUndefined();
    expect(detectImageType(Buffer.from('GIF89a........'))).toBeUndefined();
  });
});
