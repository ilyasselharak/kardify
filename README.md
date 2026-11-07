# Kardify

Kardify is a SaaS platform for creating, customizing and sharing digital business cards. Users can also save cards to **Apple Wallet** and **Google Wallet**.

```
kardify/
├── backend/            NestJS 12 REST API · Prisma 7 · PostgreSQL · Redis
├── frontend/           Next.js 16 (App Router, Cache Components) · next-intl · Tailwind v4 · shadcn/ui
├── docker-compose.yml  Postgres + Redis + migrations + API + web
└── README.md
```

The frontend and backend are independent apps. They communicate only through the REST API under `/api`, which is documented with Swagger at `/api/docs`.

---

## Features

| Area | What's included |
|---|---|
| Auth | Registration with email verification, login with "remember me", logout, forgot/reset password, email change with confirmation, session list and revocation, account deletion, data export |
| Security | Argon2id hashing, HTTP-only `SameSite=Lax` session cookie (JWT bound to a revocable DB session), CSRF header + origin check, rate limiting, account lockout after 5 failed logins, hashed single-use tokens, magic-byte upload validation with re-encoding, SSRF-safe image fetching, Helmet, strict DTO validation |
| Cards | Unlimited cards with CRUD, duplicate, publish/unpublish, search, status filter, sort and pagination; non-guessable slugs (`name-xxxxxx`) with collision retry; link regeneration |
| Designer | 5-step wizard, 8 templates, solid/gradient backgrounds, colors, 6 fonts (including Arabic), font size, corner radius, 4 layouts, photo shape, logo position, social icon style, front and back design, live desktop (flip) and mobile previews. Settings are stored as structured JSON |
| Public card | SSR page with SEO/OG metadata, Save Contact (vCard 3.0 with embedded photo), Web Share, WhatsApp, email, SMS, LinkedIn, X, QR (PNG/SVG), Call/Email/WhatsApp/Location quick actions, wallet buttons |
| QR | Server-generated PNG (up to 2048 px) and SVG, custom colors, optional Kardify or company logo in the center (error-correction H), scan tracking via `?src=qr` |
| Wallets | Signed Apple PassKit `.pkpass` with the PassKit web service (device registration and APNs push updates). Google Wallet Generic Class/Object via the REST API with a signed "Save to Google Wallet" JWT and automatic object updates |
| Analytics | Views, unique visitors, QR scans, shares, contact downloads, wallet adds, and WhatsApp/website/email/phone/location/social clicks. Includes time series, top cards, engagement breakdown, referrers and recent activity, with 7/30/90-day and all-time ranges. Repeat events from the same visitor are counted once per window. No IP addresses are stored |
| i18n | Full English and Arabic (key parity enforced by a test), RTL layout, locale-prefixed routes (`/en/...`, `/ar/...`), localized emails, and preferred language saved to the account. Card content is never auto-translated |

---

## Quick start

### Option A: Docker (recommended)

```bash
cp backend/.env.example backend/.env   # optional integrations can stay empty
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:4000/api
- Swagger: http://localhost:4000/api/docs

The `migrate` service runs `prisma migrate deploy` before the API starts.

### Option B: Local Node.js (v20.9+; tested with v24)

You need PostgreSQL 15+ running. Redis is optional; without it the API uses an in-memory cache.

```bash
# API
cd backend
cp .env.example .env              # set DATABASE_URL; JWT_SECRET is optional in dev
npm install
npx prisma migrate deploy         # or: npm run db:migrate:dev
npm run start:dev                 # http://localhost:4000

# Web (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                       # http://localhost:3000
```

If `RESEND_API_KEY` is not set, verification and reset emails are **printed to the API log**. Copy the link from the log to verify your account locally.

### Optional integrations

Each integration degrades gracefully when it isn't configured. `GET /api/features` reports what is enabled, and the UI shows a clear message for anything that's off.

| Integration | Env vars | Without it |
|---|---|---|
| Resend | `RESEND_API_KEY`, `EMAIL_FROM` | Emails are logged to the console |
| Cloudinary | `CLOUDINARY_*` | Image uploads return `UPLOADS_DISABLED` |
| Redis | `REDIS_URL` | In-memory cache (single instance only) |
| Apple Wallet | `APPLE_*` | Button shows "not configured" |
| Google Wallet | `GOOGLE_WALLET_*` | Button shows "not configured" |

---

## Admin console

Admins manage the whole platform at **`/[locale]/dashboard/admin`**. The page is linked in the sidebar for admins only.

| Section | What admins can do |
|---|---|
| Overview | See platform totals (users, new sign-ups, verified, suspended, cards, views, events, wallet passes, active sessions, admins), a 30-day sign-up chart and the newest users |
| Users | Search; filter by role or status; edit name, language, role and email-verified; suspend or unsuspend; sign a user out everywhere; delete a user and all of their data |
| Cards | Search all cards by name, company, link or owner email; open the public page; activate or deactivate; delete |
| Audit log | See every admin action: who did it, when, and what changed |

**Create the first admin.** Register the account normally, then run:

```bash
cd backend
npm run build                                   # once, so dist/ exists
npm run admin:promote -- you@example.com        # grant ADMIN (also marks the email verified)
npm run admin:promote -- you@example.com --revoke   # remove ADMIN
```

After that, admins can promote other users from the console.

Safety rules, all enforced by the API:

- `/api/admin/*` requires the `ADMIN` role, which is re-read from the database on every request, so demotion takes effect immediately.
- Suspending a user revokes all of their sessions and blocks login with `ACCOUNT_SUSPENDED`.
- Admins can't suspend, delete or change the role of their own account.
- The last active admin can't be demoted, suspended or deleted.
- Every admin mutation is written to `admin_audit_logs`.

---

## Architecture

### Request flow

```
Browser ──► Next.js (:3000)
              ├─ /[locale]/...       pages (SSR/prerendered shells + client components)
              ├─ proxy.ts            locale detection + optimistic dashboard auth redirect
              └─ /api/* ──rewrite──► NestJS (:4000) ──► PostgreSQL (Prisma)
                                                    └─► Redis (cache, de-dup)
```

The browser only ever calls **same-origin** `/api/*`, which `next.config.ts` rewrites to `BACKEND_INTERNAL_URL`. As a result:

- the session cookie is first-party, and no CORS is needed in the default setup;
- the API's internal URL is never exposed to the browser.

The public card page is server-rendered. It fetches the card from the API with a short `"use cache"` lifetime. The API also caches it in Redis and invalidates that entry when the owner edits the card.

### Backend modules (`backend/src`)

| Module | Responsibility |
|---|---|
| `auth` | Register, login, logout, verification, password reset, cookie handling, Argon2 |
| `sessions` | DB-backed sessions (expiry, revocation, "log out other devices") |
| `users` | Profile, preferences, email/password change, export, delete |
| `cards` | Card CRUD, duplicate, publish, slug generation, QR settings |
| `card-design` | Templates and design-settings validation and merging |
| `uploads` | Cloudinary uploads with magic-byte checks and `sharp` re-encoding to WebP |
| `qrcode` | PNG/SVG QR rendering with an optional center logo |
| `sharing` | Share links (WhatsApp, email, SMS, LinkedIn, X) |
| `public` | Public card, vCard, public QR, analytics ingestion |
| `analytics` | Event recording with de-duplication, overview and per-card reports |
| `wallet/apple` | `.pkpass` generation, PassKit web service, APNs push |
| `wallet/google` | Generic Class/Object management, save JWT, sync |
| `email` | Resend client and localized (EN/AR, RTL-aware) templates |
| `admin` | Admin console API (`AdminGuard`), user and card moderation, platform stats, audit log; `src/scripts/promote-admin.ts` CLI |
| `common` | Global guards (`AuthGuard`, `CsrfGuard`, throttling), exception filter, utilities |

Global guards apply to every route: rate limiting, then CSRF, then authentication. Routes opt out explicitly with `@Public()`, `@AllowUnverified()` or `@SkipCsrf()` (used only for Apple's machine-to-machine web service).

### Frontend structure (`frontend/src`)

```
app/[locale]/(marketing)   landing, about, contact, terms, privacy
app/[locale]/(auth)        login, register, forgot/reset password, verify email
app/[locale]/dashboard     overview, cards, cards/new, cards/[id], cards/[id]/edit,
                           analytics, settings/{profile,security,preferences,account}, help
app/[locale]/card/[slug]   public card page (SSR + metadata)
components/ui              shadcn/ui-style primitives (Radix + Tailwind v4)
components/*               feature components (cards, wizard, analytics, settings, ...)
lib/api                    fetch client + API types
lib/hooks                  TanStack Query hooks (all server state and mutations)
lib/validation             Zod schemas (messages are translation keys)
lib/design                 design types and templates (mirrors the backend contract)
messages/{en,ar}.json      translations
```

Business logic lives in hooks and `lib/`; components handle rendering only. Every data view handles loading, error, empty and success states.

### Database

The Prisma schema is in `backend/prisma/schema.prisma`, and migrations are in `backend/prisma/migrations`. Models:

- `User`
- `Session`
- `BusinessCard` (with `socialLinks`, `designSettings` and `qrSettings` as JSON)
- `CardAnalytics`
- `WalletPass`
- `AppleDeviceRegistration`
- `EmailVerificationToken`
- `PasswordResetToken`
- `EmailChangeToken`

Every relation cascades from `User` → `BusinessCard` → children, and the frequent query paths are indexed. Tokens are stored only as SHA-256 hashes.

---

## Apple Wallet setup

Kardify generates real signed `.pkpass` files using the **generic** pass style. Each pass includes:

- name, title, company, phone and email;
- back fields for website, address, description and social links;
- the company logo or the Kardify logo, plus a thumbnail of the profile photo;
- a QR code that opens the public card.

You need a paid **Apple Developer Program** membership.

1. **Pass Type ID.** In *Certificates, Identifiers & Profiles → Identifiers*, create a Pass Type ID, e.g. `pass.com.kardify.card`. Set it as `APPLE_PASS_TYPE_ID`.
2. **Team ID.** Copy it from *Membership details* into `APPLE_TEAM_ID`.
3. **Pass certificate.** Under *Certificates*, create a "Pass Type ID Certificate" for that ID using a CSR, then download `pass.cer`. Convert it to PEM:
   ```bash
   openssl x509 -inform der -in pass.cer -out signerCert.pem
   # if you exported a .p12 from Keychain instead:
   openssl pkcs12 -in Certificates.p12 -clcerts -nokeys -out signerCert.pem -legacy
   openssl pkcs12 -in Certificates.p12 -nocerts -out signerKey.pem -legacy   # sets a passphrase
   ```
4. **WWDR certificate.** Download *Apple Worldwide Developer Relations G4* from https://www.apple.com/certificateauthority/ and convert it:
   ```bash
   openssl x509 -inform der -in AppleWWDRCAG4.cer -out wwdr.pem
   ```
5. **Set the env vars.** Put the PEM contents in `APPLE_WWDR_CERT`, `APPLE_SIGNER_CERT` and `APPLE_SIGNER_KEY`. Each value can be pasted with `\n` escapes or base64-encoded (`base64 -i signerKey.pem`). Set `APPLE_SIGNER_KEY_PASSPHRASE` if the key is encrypted.
6. **Enable pass updates.** Set `API_PUBLIC_URL` to the API's public **HTTPS** origin. Kardify then embeds `webServiceURL = {API_PUBLIC_URL}/api/wallet/apple` and a per-pass authentication token (an HMAC of the serial; nothing is stored in plaintext). It implements Apple's web service endpoints:
   - `POST/DELETE /v1/devices/:device/registrations/:passType/:serial`
   - `GET /v1/devices/:device/registrations/:passType?passesUpdatedSince=`
   - `GET /v1/passes/:passType/:serial` (supports `If-Modified-Since`)
   - `POST /v1/log`

   When a card changes, the API bumps the pass timestamp and sends an empty APNs push (HTTP/2, authenticated with the pass certificate) to every registered device. Wallet then fetches the new pass. Use `APPLE_APNS_HOST=https://api.sandbox.push.apple.com` only for development-signed passes.

Download endpoint: `GET /api/wallet/apple/:publicId`. It only serves published cards, and each download is recorded as `APPLE_WALLET_ADD`.

> Apple Wallet only accepts passes served over HTTPS, so test on a device through a tunnel (e.g. `cloudflared`) or a staging deployment.

## Google Wallet setup

Kardify uses the official **Google Wallet API** with Generic Passes.

1. **Issuer account.** Create one in the [Google Pay & Wallet Console](https://pay.google.com/business/console) and note the **Issuer ID** (`GOOGLE_WALLET_ISSUER_ID`).
2. **Enable the API.** In Google Cloud, enable the **Google Wallet API** for a project.
3. **Service account.** Create one, generate a **JSON key**, and copy its `client_email` and `private_key` into:
   - `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY` (keep the `\n` escapes)
4. **Grant access.** In the Wallet Console, under *Users*, invite the service account email with the **Developer** role.
5. **Go live.** Request publishing access in the console before going live (demo mode only works for test accounts).

How it works:

- **Class.** On first use the API creates the Generic Class `{issuerId}.{GOOGLE_WALLET_CLASS_SUFFIX}` if it doesn't exist.
- **Saving a card.** `GET /api/wallet/google/:publicId` creates or updates the Generic Object `{issuerId}.card_{publicId}`. That object holds the header, subheader, logo, hero image, background color, QR barcode, text modules and link modules. The endpoint then returns `{ saveUrl }` (or redirects with `?redirect=1`). The URL is a `https://pay.google.com/gp/v/save/<JWT>` link, signed RS256 with the service account and listing the allowed `origins` (`CORS_ORIGINS`).
- **Updates.** Editing a card that has been saved updates the object automatically, and deactivating or deleting it sets the object to `INACTIVE`.
- **Images.** Logos must be publicly reachable over HTTPS. Kardify uses the Cloudinary-hosted company logo, or falls back to `{FRONTEND_URL}/brand/kardify-mark.png`, so `FRONTEND_URL` must be public for Google to fetch it.

---

## Testing

```bash
# Backend unit tests (auth service, guards, vCard, slugs, design merge, wallet pass signing, ...)
cd backend && npm test

# Backend end-to-end tests: real HTTP + database. Use a DISPOSABLE migrated database.
DATABASE_URL=postgresql://.../kardify_test npx prisma migrate deploy
DATABASE_URL=postgresql://.../kardify_test npm run test:e2e

# Frontend unit tests (Zod schemas, password policy parity, form mapping, open-redirect guard, i18n key parity)
cd frontend && npm test

# Static checks
cd backend && npm run typecheck && npm run lint
cd frontend && npm run typecheck && npm run lint && npm run build
```

---

## Production deployment

1. **PostgreSQL and Redis.** Provision managed instances and set `DATABASE_URL` and `REDIS_URL`. Redis is required when running more than one API instance.
2. **API.** Build `backend/Dockerfile`. Run `npx prisma migrate deploy` as a release step (the compose `migrate` service shows how). Required env vars:
   - `NODE_ENV=production`
   - `JWT_SECRET` (at least 32 random bytes; the API refuses to start without it)
   - `FRONTEND_URL`, `API_PUBLIC_URL`, `CORS_ORIGINS`
   - `RESEND_API_KEY`, `EMAIL_FROM` (with a verified Resend domain)
   - Cloudinary and wallet credentials as needed

   Swagger is disabled in production unless `SWAGGER_ENABLED=true`.
3. **Web.** Build `frontend/Dockerfile` with the `NEXT_PUBLIC_APP_URL` and `BACKEND_INTERNAL_URL` **build args**. The rewrite target is fixed at build time. The image uses Next.js `standalone` output (`node server.js`).
4. **TLS and proxy.** Serve both apps behind HTTPS. Cookies are `Secure` in production, and the API trusts one proxy hop for client IPs (rate limiting and the session list). If the API is on a different subdomain and called directly, set `COOKIE_DOMAIN=.yourdomain.com`.
5. **Secrets.** Keep Apple certificates and Google keys in your platform's secret manager. They are read only by the API and never sent to the browser.
6. **Scaling.** The API is stateless (sessions are in Postgres; cache and de-duplication are in Redis), so it scales horizontally. The public card page is cached for 30 seconds in Next.js and 120 seconds in Redis, with invalidation on edit.

---

## API overview

Swagger at `/api/docs` is the authoritative contract. State-changing requests must send the header `x-kardify-csrf: 1`.

```
POST   /api/auth/register | login | logout | forgot-password | reset-password | verify-email | resend-verification
GET    /api/auth/me
PATCH  /api/users/me            PATCH /api/users/me/preferences     POST /api/users/me/password
POST   /api/users/me/email      POST  /api/users/email/confirm      GET  /api/users/me/export   DELETE /api/users/me
GET    /api/sessions            DELETE /api/sessions/:id            POST /api/sessions/revoke-others
GET    /api/cards               POST /api/cards                     GET|PATCH|DELETE /api/cards/:id
POST   /api/cards/:id/duplicate | publish | unpublish | regenerate-link
PATCH  /api/cards/:id/qr-settings   GET /api/cards/:id/qr?format=png|svg   GET /api/cards/:id/share
POST   /api/uploads/images/:purpose            (avatar | profile | logo; multipart "file")
GET    /api/card-design/templates
GET    /api/public/cards/:slug  GET /api/public/cards/:slug/vcard  GET /api/public/cards/:slug/qr
POST   /api/public/cards/:slug/analytics
GET    /api/wallet/apple/:publicId     (+ PassKit web service under /api/wallet/apple/v1/...)
GET    /api/wallet/google/:publicId
GET    /api/analytics/overview?range=7d|30d|90d|all     GET /api/analytics/cards/:cardId?range=...
GET    /api/admin/stats | users | users/:id | cards | audit-log          (ADMIN only)
PATCH  /api/admin/users/:id      DELETE /api/admin/users/:id | cards/:id
POST   /api/admin/users/:id/suspend | unsuspend | revoke-sessions
POST   /api/admin/cards/:id/activate | deactivate
GET    /api/health     GET /api/features
```

Errors share one shape: `{ statusCode, code, message, errors? }`. The frontend translates `code` (for example `INVALID_CREDENTIALS` or `EMAIL_TAKEN`) into the user's language.
