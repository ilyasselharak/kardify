# syntax=docker/dockerfile:1
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
# Rewrites (/api/* → API) are resolved at build time, so the internal API URL is a build arg.
ARG BACKEND_INTERNAL_URL=http://backend:4000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Standalone output: only the files needed to run the server.
FROM node:24-slim AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
