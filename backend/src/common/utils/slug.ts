import { randomId } from './crypto.js';

/**
 * Builds a readable slug from a name. Non-latin names (e.g. Arabic) are kept
 * out of the URL and fall back to "card" so links stay ASCII-safe.
 */
export function slugify(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return base || 'card';
}

/** Slug with a random suffix so public URLs are not guessable/enumerable. */
export function buildCardSlug(name: string, suffixLength = 6): string {
  return `${slugify(name)}-${randomId(suffixLength)}`;
}
