# syntax=docker/dockerfile:1
# ---------- deps ----------
FROM node:24-slim AS deps
WORKDIR /app
# The runtime image uses Debian's Chromium for CV PDFs, so skip Puppeteer's own download.
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build (also used by the one-off `migrate` service) ----------
FROM deps AS build
COPY . .
RUN npx prisma generate && npx nest build

# ---------- runtime ----------
FROM node:24-slim AS runner
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CHROME_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_DISABLE_SANDBOX=true
WORKDIR /app
# chromium renders CV PDFs (fonts are embedded web fonts; the font packages are fallbacks).
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates chromium fonts-liberation fonts-noto-core \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
