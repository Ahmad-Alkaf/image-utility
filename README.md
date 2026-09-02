# ImageForge

Free online image tools by [KafLabs](https://kaflabs.com): convert, compress, resize and crop, watermark, filters, background removal, and a metadata viewer.

- Next.js 16 (App Router), React 19, Tailwind 4, shadcn/base-ui
- Image processing with [sharp](https://sharp.pixelplumbing.com/) in API routes
- Background removal runs in the browser with `@imgly/background-removal` (WASM in a web worker)
- Clerk for accounts, Prisma 7 + PostgreSQL for users and job history
- Files live on disk (or S3/R2) and are deleted after 24 hours

## Local development

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL and the Clerk keys
npx prisma migrate deploy # or: npx prisma migrate dev
npm run dev
```

Open http://localhost:3000.

Useful scripts:

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` then `next build` (standalone output) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply pending migrations (`prisma migrate deploy`) |

After a schema change: `npx prisma migrate dev --name <change>` creates the migration and regenerates the client.

## Deploy on Coolify

The repository ships a multi-stage `Dockerfile` (Node 22 Alpine, Next.js standalone). The container applies Prisma migrations on every start, then runs the server on port 3000.

1. **Database.** Create a PostgreSQL resource in Coolify (or use a managed provider). Copy its connection string.
2. **Application.** New resource, source = this repository, build pack = **Dockerfile**, port **3000**. Health check: `GET /api/health` (returns 200 when the database answers).
3. **Persistent storage.** Add a volume mounted at `/app/.storage`. Without it uploads vanish on every redeploy. (Alternative: set the five `S3_*` variables to use S3 or Cloudflare R2, then no volume is needed.)
4. **Environment variables.** Set every variable from `.env.example`. Mark each `NEXT_PUBLIC_*` variable **Available at build time**; they are baked into the client bundle. `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, and the storage keys are runtime-only.
5. **Clerk.** Use a production instance. Add a webhook endpoint `https://<domain>/api/webhooks/clerk` with the events `user.created`, `user.updated`, `user.deleted`, and copy its signing secret into `CLERK_WEBHOOK_SECRET`.
6. **Deploy.** Watch the log for `Applying database migrations...` followed by `[cleanup] scheduler started (hourly)`.

Notes:

- The runtime image installs `fontconfig` and `ttf-dejavu`; text watermarks need at least one font on the system.
- Rate limits are kept in process memory. Run one replica.
- Uploads and results are deleted after 24 hours by an hourly job inside the server (`src/instrumentation.ts`). `POST /api/cron/cleanup` with `Authorization: Bearer <CRON_SECRET>` runs the same job on demand, for example from a Coolify scheduled task or for a test.

## Project layout

```
src/app/(tools)/*        one page per tool (title and text come from src/lib/constants.ts)
src/app/api/process/*    one route per server-side tool, built on src/lib/process-route.ts
src/app/api/download/    serves results by download token or owner session
src/app/api/health       health check for the host
src/app/api/cron/cleanup manual trigger for the retention job
src/lib/processing/*     sharp pipelines (convert, compress, resize, filters, watermark, metadata)
src/lib/storage.ts       local disk or S3 backend
src/lib/cleanup.ts       24-hour retention job
src/workers/             background-removal web worker
prisma/                  schema and migrations
```
