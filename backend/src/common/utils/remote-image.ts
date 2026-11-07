import sharp from 'sharp';

/** Hosts we upload to. Fetching only from these prevents SSRF via user-supplied image URLs. */
const ALLOWED_HOSTS = ['res.cloudinary.com'];
const MAX_BYTES = 5 * 1024 * 1024;

export function isAllowedImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && ALLOWED_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

/** Fetches an uploaded image and returns it resized as PNG, or undefined on any failure. */
export async function fetchImageAsPng(url: string | null | undefined, size: number, square = true): Promise<Buffer | undefined> {
  if (!isAllowedImageUrl(url)) return undefined;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return undefined;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) return undefined;
    return await sharp(buf)
      .resize(size, size, { fit: square ? 'cover' : 'inside', withoutEnlargement: false })
      .png()
      .toBuffer();
  } catch {
    return undefined;
  }
}
