export interface VCardInput {
  name: string;
  jobTitle?: string | null;
  companyName?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  address?: string | null;
  url: string;
  socialLinks?: { platform: string; url: string }[];
  photoJpegBase64?: string;
}

/** Escapes text values per RFC 6350 §3.4. */
export function escapeVCard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n|\r\n?/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/** Folds lines longer than 75 octets (UTF-8 safe, never splitting a multi-byte char). */
export function foldLine(line: string): string {
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const len = Buffer.byteLength(ch);
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + len > limit) {
      out.push(current);
      current = '';
      bytes = 0;
    }
    current += ch;
    bytes += len;
  }
  out.push(current);
  return out.join('\r\n ');
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { given: parts[0], family: '' };
  return { given: parts.slice(0, -1).join(' '), family: parts[parts.length - 1] };
}

/** vCard 3.0 — the most widely supported version on iOS and Android contacts apps. */
export function buildVCard(c: VCardInput): string {
  const e = escapeVCard;
  const { given, family } = splitName(c.name);
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${e(family)};${e(given)};;;`, `FN:${e(c.name)}`];
  if (c.companyName) lines.push(`ORG:${e(c.companyName)}`);
  if (c.jobTitle) lines.push(`TITLE:${e(c.jobTitle)}`);
  if (c.phone) lines.push(`TEL;TYPE=WORK,VOICE:${e(c.phone)}`);
  if (c.whatsapp && c.whatsapp !== c.phone) lines.push(`TEL;TYPE=CELL:${e(c.whatsapp)}`);
  if (c.email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${e(c.email)}`);
  if (c.website) lines.push(`URL;TYPE=WORK:${e(c.website)}`);
  lines.push(`URL:${e(c.url)}`);
  if (c.address) lines.push(`ADR;TYPE=WORK:;;${e(c.address)};;;;`);
  for (const link of c.socialLinks ?? []) {
    lines.push(`X-SOCIALPROFILE;TYPE=${e(link.platform)}:${e(link.url)}`);
  }
  if (c.description) lines.push(`NOTE:${e(c.description)}`);
  if (c.photoJpegBase64) lines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${c.photoJpegBase64}`);
  lines.push('END:VCARD');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
