import { buildVCard, escapeVCard, foldLine } from './vcard.js';

describe('vCard', () => {
  it('escapes special characters', () => {
    expect(escapeVCard('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });

  it('folds long lines at 75 octets without splitting multibyte chars', () => {
    const folded = foldLine('NOTE:' + 'م'.repeat(100));
    for (const line of folded.split('\r\n')) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, '')).toBe('NOTE:' + 'م'.repeat(100));
  });

  it('builds a valid vCard 3.0 with CRLF line endings', () => {
    const v = buildVCard({
      name: 'Jane Van Doe',
      jobTitle: 'CTO',
      companyName: 'Acme, Inc.',
      email: 'jane@acme.com',
      phone: '+1 555 0100',
      whatsapp: '+1 555 0199',
      website: 'https://acme.com',
      address: '1 Main St; Suite 2',
      url: 'https://kardify.com/card/jane-abc123',
      socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com/in/jane' }],
    });
    expect(v.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true);
    expect(v).toContain('N:Doe;Jane Van;;;');
    expect(v).toContain('ORG:Acme\\, Inc.');
    expect(v).toContain('TEL;TYPE=CELL:+1 555 0199');
    expect(v).toContain('ADR;TYPE=WORK:;;1 Main St\\; Suite 2;;;;');
    expect(v.trimEnd().endsWith('END:VCARD')).toBe(true);
    expect(v).not.toMatch(/[^\r]\n/);
  });
});
