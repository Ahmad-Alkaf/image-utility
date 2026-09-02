# ImageForge - Next.js standalone image for Coolify.
#
# NEXT_PUBLIC_* values are inlined into the client bundle at build time.
# Pass them as --build-arg (in Coolify: mark each variable
# "Available at build time"). Runtime secrets (DATABASE_URL,
# CLERK_SECRET_KEY, ...) are read from the container environment.
#
# On start the container runs `prisma migrate deploy` and then the server.
# Uploads go to /app/.storage unless S3 keys are set; mount a persistent
# volume there so files survive a redeploy.

# ---------- deps ----------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- builder ----------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_URL=https://imagesforge.com
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
ARG NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
ARG NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL \
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL \
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL \
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL \
    NEXT_TELEMETRY_DISABLED=1

# Generates the Prisma client (src/generated/prisma) and builds the app.
# The database is not needed at build time.
RUN npm run build

# ---------- migrator ----------
# A small, self-contained copy of the Prisma CLI so the runtime image can
# apply migrations without the full node_modules of the app.
FROM node:22-alpine AS migrator
RUN apk add --no-cache libc6-compat
WORKDIR /migrate
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npm init -y >/dev/null \
    && npm install --no-audit --no-fund --omit=dev prisma@7.6.0 dotenv@17

# ---------- runner ----------
FROM node:22-alpine AS runner
# fontconfig + a font family: sharp renders text watermarks through SVG and
# needs at least one installed font, otherwise the text is blank.
RUN apk add --no-cache libc6-compat fontconfig ttf-dejavu
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    STORAGE_DIR=/app/.storage
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=migrator --chown=nextjs:nodejs /migrate /migrate
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh \
    && mkdir -p /app/.storage \
    && chown nextjs:nodejs /app/.storage

USER nextjs
EXPOSE 3000
VOLUME ["/app/.storage"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
