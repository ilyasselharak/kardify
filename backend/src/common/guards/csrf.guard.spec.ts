import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AppConfig } from '../../config/app-config.js';
import { CsrfGuard } from './csrf.guard.js';

function ctx(method: string, headers: Record<string, string> = {}): ExecutionContext {
  return {
    getType: () => 'http',
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ method, headers }) }),
  } as unknown as ExecutionContext;
}

describe('CsrfGuard', () => {
  const guard = new CsrfGuard(new Reflector(), { corsOrigins: ['https://kardify.com'] } as AppConfig);

  it('allows safe methods', () => {
    expect(guard.canActivate(ctx('GET'))).toBe(true);
  });
  it('rejects state-changing requests without the header', () => {
    expect(() => guard.canActivate(ctx('POST'))).toThrow(ForbiddenException);
  });
  it('rejects foreign origins', () => {
    expect(() => guard.canActivate(ctx('POST', { 'x-kardify-csrf': '1', origin: 'https://evil.com' }))).toThrow(
      ForbiddenException,
    );
  });
  it('accepts same-origin requests with the header', () => {
    expect(guard.canActivate(ctx('POST', { 'x-kardify-csrf': '1', origin: 'https://kardify.com' }))).toBe(true);
  });
});
