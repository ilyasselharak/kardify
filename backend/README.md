# Kardify API (NestJS)

See the [root README](../README.md) for setup, architecture, wallet configuration and deployment.

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run start:dev   # http://localhost:4000/api  ·  Swagger: /api/docs
npm test            # unit tests
npm run test:e2e    # e2e (requires DATABASE_URL to a disposable DB)
```
