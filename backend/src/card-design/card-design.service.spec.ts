import { CardDesignService, completeDesign } from './card-design.service.js';
import { TEMPLATE_CATEGORIES, TEMPLATE_IDS } from './design.types.js';
import { TEMPLATE_CATEGORY, TEMPLATES } from './templates.js';

/** WCAG relative luminance contrast between two #rrggbb colours. */
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('CardDesignService', () => {
  const svc = new CardDesignService();

  it('exposes 16 templates covering every category', () => {
    const list = svc.listTemplates();
    expect(list.map((t) => t.template)).toEqual([...TEMPLATE_IDS]);
    expect(list.length).toBeGreaterThanOrEqual(12);
    for (const cat of TEMPLATE_CATEGORIES) expect(Object.values(TEMPLATE_CATEGORY)).toContain(cat);
  });

  it('keeps every template wallet-compatible (valid hex colours with readable contrast)', () => {
    for (const t of Object.values(TEMPLATES)) {
      for (const c of [t.backgroundColor, t.textColor, t.primaryColor]) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
      // Apple/Google Wallet use the solid background + text colours.
      expect(contrast(t.backgroundColor, t.textColor), t.template).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.back.gradientFrom, t.back.textColor), `${t.template} back`).toBeGreaterThanOrEqual(3);
    }
  });

  it('completes designs stored before the new fields existed', () => {
    const legacy = { template: 'classic', primaryColor: '#123456', back: { tagline: 'Hello' } } as never;
    const d = completeDesign(legacy);
    expect(d.primaryColor).toBe('#123456');
    expect(d.secondaryColor).toBe(TEMPLATES.classic.secondaryColor);
    expect(d.pattern).toBe('none');
    expect(d.back.layout).toBe('qr-center');
    expect(d.back.tagline).toBe('Hello');
    const merged = svc.resolve({ pattern: 'dots' }, legacy);
    expect(merged).toMatchObject({ primaryColor: '#123456', pattern: 'dots', backgroundImage: '' });
  });

  it('fills missing values from the template', () => {
    const d = svc.resolve({ template: 'dark', primaryColor: '#123456' });
    expect(d).toMatchObject({ ...TEMPLATES.dark, primaryColor: '#123456' });
  });

  it('merges partial updates onto the existing design', () => {
    const base = svc.resolve({ template: 'modern', primaryColor: '#ff0000' });
    const next = svc.resolve({ fontFamily: 'cairo', back: { tagline: 'Hi' } }, base);
    expect(next.primaryColor).toBe('#ff0000');
    expect(next.fontFamily).toBe('cairo');
    expect(next.back.tagline).toBe('Hi');
    expect(next.back.backgroundType).toBe(TEMPLATES.modern.back.backgroundType);
  });

  it('switching template resets to the new preset', () => {
    const base = svc.resolve({ template: 'modern', primaryColor: '#ff0000' });
    expect(svc.resolve({ template: 'minimal' }, base).primaryColor).toBe(TEMPLATES.minimal.primaryColor);
  });
});
