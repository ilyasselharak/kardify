import { buildCardSlug, slugify } from './slug.js';
import { randomId, sha256 } from './crypto.js';

describe('slug utils', () => {
  it('slugifies latin names and strips accents', () => {
    expect(slugify('  Ilyass Bensbahou ')).toBe('ilyass-bensbahou');
    expect(slugify('José Ñúñez & Co.')).toBe('jose-nunez-co');
  });

  it('falls back to "card" for non-latin names', () => {
    expect(slugify('إلياس')).toBe('card');
  });

  it('appends a random, non-guessable suffix', () => {
    const a = buildCardSlug('Jane Doe');
    const b = buildCardSlug('Jane Doe');
    expect(a).toMatch(/^jane-doe-[a-z0-9]{6}$/);
    expect(a).not.toBe(b);
  });

  it('randomId produces the requested length and alphabet', () => {
    expect(randomId(20)).toMatch(/^[a-z0-9]{20}$/);
  });

  it('sha256 is deterministic hex', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
