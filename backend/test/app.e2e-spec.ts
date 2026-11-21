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

  it('suggests company names without leaking other users\' drafts', async () => {
    await user.patch(`/api/cards/${cardId}`).set('x-kardify-csrf', '1').send({ companyName: 'Acme Corp' }).expect(200);
    const other = agent();
    const otherEmail = `co-${Date.now()}@example.com`;
    await other.post('/api/auth/register').set('x-kardify-csrf', '1').send({ firstName: 'C', lastName: 'O', email: otherEmail, password, confirmPassword: password, acceptTerms: true });
    await other.post('/api/auth/verify-email').set('x-kardify-csrf', '1').send({ token: tokenFrom('verifyEmail') });
    await other.post('/api/cards').set('x-kardify-csrf', '1').send({ name: 'Draft', companyName: 'Secret Startup' }).expect(201);

    // Published card of another user → suggested; another user's draft → never suggested.
    const fromOther = await other.get('/api/cards/companies?q=acme').expect(200);
    expect(fromOther.body).toContain('Acme Corp');
    const leak = await user.get('/api/cards/companies?q=secret').expect(200);
    expect(leak.body).toEqual([]);
    // LIKE wildcards in the query are treated literally.
    expect((await user.get('/api/cards/companies?q=%25').expect(200)).body).toEqual([]);
    await other.delete('/api/users/me').set('x-kardify-csrf', '1').send({ password });
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

  it('manages CVs: profile, autosave, privacy, sharing and ownership', async () => {
    const csrf = { 'x-kardify-csrf': '1' };
    const anon = () => request(app.getHttpServer());

    // Profile is created on first read, pre-filled from the account.
    const prof = await user.get('/api/cv-profile').expect(200);
    expect(prof.body).toMatchObject({ fullName: 'E2E User', email });
    await user.patch('/api/cv-profile').set(csrf).send({ professionalTitle: 'Engineer', linkedin: 'not-a-url' }).expect(400);
    await user.patch('/api/cv-profile').set(csrf).send({ professionalTitle: 'Engineer', city: 'Rabat', summary: 'Builds things.' }).expect(200);

    const created = await user.post('/api/cvs').set(csrf).send({ title: 'Backend CV', template: 'technical' }).expect(201);
    const cvId: string = created.body.id;
    expect(created.body).toMatchObject({ visibility: 'PRIVATE', publicLink: null, template: 'technical' });
    expect(created.body.sections).toHaveLength(12);

    // Autosave: whole collections replaced atomically; validation on dates and URLs.
    await user.patch(`/api/cvs/${cvId}`).set(csrf).send({ experiences: [{ jobTitle: 'Dev', company: 'Acme', startDate: '2024-05', endDate: '2023-01' }] }).expect(400);
    await user.patch(`/api/cvs/${cvId}`).set(csrf).send({ projects: [{ name: 'X', url: 'javascript:alert(1)' }] }).expect(400);
    const saved = await user
      .patch(`/api/cvs/${cvId}`)
      .set(csrf)
      .send({
        headline: 'Backend Engineer',
        design: { accentColor: '#006afe', spacing: 'compact' },
        sections: [{ key: 'experience', enabled: true }, { key: 'skills', enabled: true }, { key: 'projects', enabled: false }],
        experiences: [
          { jobTitle: 'Senior Dev', company: 'Acme', startDate: '2022-01', current: true, endDate: '2023-01', responsibilities: 'APIs' },
          { jobTitle: 'Dev', company: 'Beta', startDate: '2019-03', endDate: '2021-12' },
        ],
        skills: [{ name: 'NestJS', category: 'TECHNICAL', level: 5 }],
        projects: [{ name: 'Hidden project' }],
      })
      .expect(200);
    expect(saved.body.experiences.map((e: { company: string }) => e.company)).toEqual(['Acme', 'Beta']);
    expect(saved.body.experiences[0].endDate).toBeNull(); // "current" clears the end date
    expect(saved.body.sections[0].key).toBe('experience');

    // Private by default: no public access even once a link exists.
    const shared = await user.patch(`/api/cvs/${cvId}/sharing`).set(csrf).send({ slug: `e2e-cv-${Date.now()}` }).expect(200);
    const cvSlug: string = shared.body.publicLink.slug;
    expect(shared.body.isPublic).toBe(false);
    await anon().get(`/api/public/cvs/${cvSlug}`).expect(404);
    await anon().get(`/api/public/cvs/${cvSlug}/pdf`).expect(404);

    // Unlisted: reachable, but not indexable, never cached, hidden sections stripped.
    await user.patch(`/api/cvs/${cvId}/sharing`).set(csrf).send({ visibility: 'UNLISTED' }).expect(200);
    const unlisted = await anon().get(`/api/public/cvs/${cvSlug}`).expect(200);
    expect(unlisted.headers['x-robots-tag']).toContain('noindex');
    expect(unlisted.headers['cache-control']).toBe('no-store');
    expect(unlisted.body.indexable).toBe(false);
    expect(unlisted.body.document.profile.professionalTitle).toBe('Backend Engineer');
    expect(unlisted.body.document.projects).toEqual([]);
    expect(JSON.stringify(unlisted.body)).not.toMatch(/Hidden project|userId|"cvId"/);

    // Public: indexable. Disabling the link or downloads is enforced server-side.
    await user.patch(`/api/cvs/${cvId}/sharing`).set(csrf).send({ visibility: 'PUBLIC', allowDownload: false }).expect(200);
    const pub = await anon().get(`/api/public/cvs/${cvSlug}`).expect(200);
    expect(pub.body.indexable).toBe(true);
    expect(pub.headers['x-robots-tag']).toBeUndefined();
    const blocked = await anon().get(`/api/public/cvs/${cvSlug}/pdf`).expect(403);
    expect(blocked.body.code).toBe('CV_DOWNLOAD_DISABLED');
    await user.patch(`/api/cvs/${cvId}/sharing`).set(csrf).send({ linkEnabled: false }).expect(200);
    await anon().get(`/api/public/cvs/${cvSlug}`).expect(404);
    await user.patch(`/api/cvs/${cvId}/sharing`).set(csrf).send({ linkEnabled: true }).expect(200);

    // Changing the slug retires the old URL; invalid / reserved slugs are rejected.
    const renamed = await user.patch(`/api/cvs/${cvId}/sharing`).set(csrf).send({ slug: `${cvSlug}-v2` }).expect(200);
    await anon().get(`/api/public/cvs/${cvSlug}`).expect(404);
    await anon().get(`/api/public/cvs/${renamed.body.publicLink.slug}`).expect(200);
    await user.patch(`/api/cvs/${cvId}/sharing`).set(csrf).send({ slug: 'admin' }).expect(400);

    // Duplicate keeps content but starts private without a link.
    const copy = await user.post(`/api/cvs/${cvId}/duplicate`).set(csrf).expect(201);
    expect(copy.body).toMatchObject({ title: 'Backend CV (copy)', visibility: 'PRIVATE', publicLink: null });
    expect(copy.body.experiences).toHaveLength(2);

    const list = await user.get('/api/cvs').expect(200);
    expect(list.body.stats).toMatchObject({ total: 2, public: 1 });
    expect(list.body.stats.completion).toBeGreaterThan(30);

    // Another account cannot read, edit, share, download or delete it.
    const other = agent();
    const otherEmail = `cv-other-${Date.now()}@example.com`;
    await other.post('/api/auth/register').set(csrf).send({ firstName: 'C', lastName: 'O', email: otherEmail, password, confirmPassword: password, acceptTerms: true });
    await other.post('/api/auth/verify-email').set(csrf).send({ token: tokenFrom('verifyEmail') });
    await other.get(`/api/cvs/${cvId}`).expect(404);
    await other.patch(`/api/cvs/${cvId}`).set(csrf).send({ title: 'Hacked' }).expect(404);
    await other.patch(`/api/cvs/${cvId}/sharing`).set(csrf).send({ visibility: 'PUBLIC' }).expect(404);
    await other.get(`/api/cvs/${cvId}/pdf`).expect(404);
    await other.delete(`/api/cvs/${cvId}`).set(csrf).expect(404);
    await other.delete('/api/users/me').set(csrf).send({ password });

    // Render tokens are the only way to read a CV outside the owner session.
    await anon().get('/api/cv-render/not-a-token').expect(404);

    await user.delete(`/api/cvs/${copy.body.id}`).set(csrf).expect(204);
    await user.delete(`/api/cvs/${cvId}`).set(csrf).expect(204);
    await anon().get(`/api/public/cvs/${renamed.body.publicLink.slug}`).expect(404);
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

    // Company list + company filter
    const companies = await user.get('/api/admin/companies').expect(200);
    expect(companies.body.items).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Acme Corp', people: 1, cards: 1 })]));
    const byCompany = await user.get('/api/admin/cards?company=acme%20corp').expect(200);
    expect(byCompany.body.items.map((c: { id: string }) => c.id)).toContain(cardId);
    const none = await user.get('/api/admin/cards?company=nobody-inc').expect(200);
    expect(none.body.total).toBe(0);

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
