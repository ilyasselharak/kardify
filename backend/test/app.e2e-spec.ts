/**
 * End-to-end tests against a real PostgreSQL database.
 * Requires DATABASE_URL pointing at a migrated, disposable database:
 *   DATABASE_URL=... npx prisma migrate deploy && DATABASE_URL=... npm run test:e2e
 */
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { EmailService } from '../src/email/email.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const run = process.env.DATABASE_URL ? describe : describe.skip;

run('Kardify API (e2e)', () => {
  let app: INestApplication;
  const sent: { template: string; url: string }[] = [];
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'Str0ng!Pass';
  const agent = () => request.agent(app.getHttpServer());
  let user: ReturnType<typeof agent>;
  let cardId: string;
  let slug: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmailService)
      .useValue({
        dispatch: (template: string, _to: string, _lang: string, vars: { url: string }) => sent.push({ template, url: vars.url }),
        send: async () => undefined,
      })
      .compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    user = agent();
  });

  afterAll(async () => {
    await user?.delete('/api/users/me').set('x-kardify-csrf', '1').send({ password });
    await app?.close();
  });

  const tokenFrom = (template: string) => new URL(sent.filter((s) => s.template === template).pop()!.url).searchParams.get('token')!;

  it('rejects state-changing requests without the CSRF header', async () => {
    await request(app.getHttpServer()).post('/api/auth/login').send({ email, password }).expect(403);
  });

  it('registers, blocks unverified access, then verifies', async () => {
    const res = await user
      .post('/api/auth/register')
      .set('x-kardify-csrf', '1')
      .send({ firstName: 'E2E', lastName: 'User', email, password, confirmPassword: password, acceptTerms: true })
      .expect(201);
    expect(res.headers['set-cookie']?.[0]).toMatch(/kardify_session=.*HttpOnly/i);
    expect(res.body.user).not.toHaveProperty('passwordHash');

    await user.get('/api/cards').expect(403);
    await user.post('/api/auth/verify-email').set('x-kardify-csrf', '1').send({ token: tokenFrom('verifyEmail') }).expect(200);
    await user.get('/api/cards').expect(200);
  });

  it('creates, publishes and exposes a card publicly', async () => {
    const created = await user
      .post('/api/cards')
      .set('x-kardify-csrf', '1')
      .send({ name: 'E2E User', email: 'card@example.com', designSettings: { template: 'dark' } })
      .expect(201);
    cardId = created.body.id;
    slug = created.body.slug;
    expect(slug).toMatch(/^e2e-user-[a-z0-9]{6}$/);
    expect(created.body).not.toHaveProperty('userId');

    await request(app.getHttpServer()).get(`/api/public/cards/${slug}`).expect(404);
    await user.post(`/api/cards/${cardId}/publish`).set('x-kardify-csrf', '1').expect(200);
    const pub = await request(app.getHttpServer()).get(`/api/public/cards/${slug}`).expect(200);
    expect(pub.body).not.toHaveProperty('id');
    expect(pub.body.shareLinks.whatsapp).toContain('wa.me');

    const vcf = await request(app.getHttpServer()).get(`/api/public/cards/${slug}/vcard`).expect(200);
    expect(vcf.text).toContain('FN:E2E User');
  });

  it('enforces ownership on private endpoints', async () => {
    const other = agent();
    const otherEmail = `other-${Date.now()}@example.com`;
    await other
      .post('/api/auth/register')
      .set('x-kardify-csrf', '1')
      .send({ firstName: 'O', lastName: 'U', email: otherEmail, password, confirmPassword: password, acceptTerms: true });
    await other.post('/api/auth/verify-email').set('x-kardify-csrf', '1').send({ token: tokenFrom('verifyEmail') });
    await other.get(`/api/cards/${cardId}`).expect(404);
    await other.delete(`/api/cards/${cardId}`).set('x-kardify-csrf', '1').expect(404);
    await other.delete('/api/users/me').set('x-kardify-csrf', '1').send({ password });
  });

  it('dedupes repeated views from the same visitor', async () => {
    const visitor = agent();
    const r1 = await visitor.post(`/api/public/cards/${slug}/analytics`).set('x-kardify-csrf', '1').send({ eventType: 'VIEW' }).expect(202);
    const r2 = await visitor.post(`/api/public/cards/${slug}/analytics`).set('x-kardify-csrf', '1').send({ eventType: 'VIEW' }).expect(202);
    expect(r1.body.recorded).toBe(true);
    expect(r2.body.recorded).toBe(false);
    const stats = await user.get(`/api/analytics/cards/${cardId}?range=7d`).expect(200);
    expect(stats.body.totals.VIEW).toBe(1);
    expect(stats.body.totals.CONTACT_DOWNLOAD).toBe(1);
  });

  it('restricts the admin API to admins and lets admins moderate users and cards', async () => {
    await user.get('/api/admin/stats').expect(403);

    // Promote via the database (what `npm run admin:promote` does), then re-check: role is read per request.
    await app.get(PrismaService).user.update({ where: { email }, data: { role: 'ADMIN' } });
    const stats = await user.get('/api/admin/stats').expect(200);
    expect(stats.body.users.admins).toBeGreaterThanOrEqual(1);
    expect(stats.body.signups).toHaveLength(30);

    // A second account to moderate.
    const victim = agent();
    const victimEmail = `victim-${Date.now()}@example.com`;
    const reg = await victim
      .post('/api/auth/register')
      .set('x-kardify-csrf', '1')
      .send({ firstName: 'V', lastName: 'U', email: victimEmail, password, confirmPassword: password, acceptTerms: true })
      .expect(201);
    const victimId = reg.body.user.id;

    const list = await user.get(`/api/admin/users?search=${encodeURIComponent(victimEmail)}`).expect(200);
    expect(list.body.items[0]).toMatchObject({ id: victimId, cardsCount: 0 });
    expect(list.body.items[0]).not.toHaveProperty('passwordHash');

    await user.patch(`/api/admin/users/${victimId}`).set('x-kardify-csrf', '1').send({ emailVerified: true }).expect(200);
    await user.post(`/api/admin/users/${victimId}/suspend`).set('x-kardify-csrf', '1').expect(200);
    await victim.get('/api/auth/me').expect(401); // sessions revoked
    const login = await agent().post('/api/auth/login').set('x-kardify-csrf', '1').send({ email: victimEmail, password }).expect(403);
    expect(login.body.code).toBe('ACCOUNT_SUSPENDED');

    // Self-protection
    const me = await user.get('/api/auth/me').expect(200);
    const self = await user.post(`/api/admin/users/${me.body.user.id}/suspend`).set('x-kardify-csrf', '1').expect(400);
    expect(self.body.code).toBe('CANNOT_MODIFY_SELF');

    // Card moderation
    await user.post(`/api/admin/cards/${cardId}/deactivate`).set('x-kardify-csrf', '1').expect(200);
    await request(app.getHttpServer()).get(`/api/public/cards/${slug}`).expect(404);
    await user.post(`/api/admin/cards/${cardId}/activate`).set('x-kardify-csrf', '1').expect(200);

    await user.delete(`/api/admin/users/${victimId}`).set('x-kardify-csrf', '1').expect(204);
    const log = await user.get('/api/admin/audit-log?pageSize=10').expect(200);
    expect(log.body.items.map((i: { action: string }) => i.action)).toEqual(
      expect.arrayContaining(['user.update', 'user.suspend', 'card.deactivate', 'card.activate', 'user.delete']),
    );
  });

  it('resets the password with a single-use token and revokes sessions', async () => {
    await request(app.getHttpServer()).post('/api/auth/forgot-password').set('x-kardify-csrf', '1').send({ email }).expect(202);
    const token = tokenFrom('resetPassword');
    const body = { token, password: 'N3w!Passw0rd', confirmPassword: 'N3w!Passw0rd' };
    await request(app.getHttpServer()).post('/api/auth/reset-password').set('x-kardify-csrf', '1').send(body).expect(200);
    await request(app.getHttpServer()).post('/api/auth/reset-password').set('x-kardify-csrf', '1').send(body).expect(400);
    await user.get('/api/auth/me').expect(401);

    user = agent();
    await user.post('/api/auth/login').set('x-kardify-csrf', '1').send({ email, password: 'N3w!Passw0rd' }).expect(200);
    // Restore the original password so afterAll can delete the account.
    await user
      .post('/api/users/me/password')
      .set('x-kardify-csrf', '1')
      .send({ currentPassword: 'N3w!Passw0rd', newPassword: password, confirmPassword: password })
      .expect(204);
  });
});
