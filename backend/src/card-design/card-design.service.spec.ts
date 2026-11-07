import { CardDesignService } from './card-design.service.js';
import { TEMPLATES } from './templates.js';

describe('CardDesignService', () => {
  const svc = new CardDesignService();

  it('exposes all 8 premium templates', () => {
    expect(svc.listTemplates().map((t) => t.template)).toEqual([
      'classic', 'modern', 'minimal', 'corporate', 'creative', 'elegant', 'dark', 'gradient',
    ]);
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
