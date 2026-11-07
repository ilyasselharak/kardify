import { rangeStart } from './analytics.types.js';

describe('rangeStart', () => {
  const now = new Date('2026-11-03T15:30:00Z');
  it('returns the start of the window (inclusive of today)', () => {
    expect(rangeStart('7d', now)?.toISOString()).toBe('2026-10-28T00:00:00.000Z');
    expect(rangeStart('30d', now)?.toISOString()).toBe('2026-10-05T00:00:00.000Z');
  });
  it('returns undefined for all time', () => {
    expect(rangeStart('all', now)).toBeUndefined();
  });
});
