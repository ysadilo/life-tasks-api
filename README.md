# life-tasks-backend

NestJS API + Prisma + Postgres for Life Tasks Manager. Owns all business rules,
authorization, recurrence generation, and the nightly rollover — the client
(`life-tasks-frontend`) never touches Postgres directly.

## Setup

```bash
cp .env.example .env
docker compose up -d          # local Postgres on :5432
pnpm install
pnpm prisma:migrate           # creates tables from prisma/schema.prisma
pnpm start:dev                # API on :3000
```

## Status

`tasks` and `boards` CRUD, Prisma schema matching the data model in
`../ARCHITECTURE.md` §5.

Phase 4 (auth) is wired: `Auth0AuthGuard` verifies the caller's Auth0 access
token (RS256, against the tenant JWKS) on every `/api/tasks` and `/api/boards`
route, checking `iss` and `aud`. The user id comes from the token `sub`
(`@CurrentUser()`), not from query/body params. `TasksController` resolves the
caller's solo board via `BoardsService.resolveSoloBoardId`, which bootstraps the
`User` + `Board` rows on first request (email read once from Auth0 `/userinfo`).
Set `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` before starting the API.
`POST /api/dev/rollover` stays unguarded (already `NODE_ENV`-gated).

The rollover flow from `../ARCHITECTURE.md` §7 and §9 is scaffolded ahead of
schedule since it's cheap to stand up alongside the schema:

- `src/rollover/rollover.service.ts` — plain, clock-injectable, testable method
- `src/rollover/rollover.cron.ts` — one-line `@Cron` delegator, schedule overridable via `ROLLOVER_CRON`
- `src/rollover/rollover.dev.controller.ts` — `POST /api/dev/rollover` to trigger manually, disabled when `NODE_ENV=production`

Recurrence (`task_templates` + `rrule`) is modeled in the Prisma schema but not
yet wired to any generation logic — that's phase 5.

## Scripts

- `pnpm start:dev` — watch mode
- `pnpm prisma:migrate` — run/create a migration
- `pnpm prisma:generate` — regenerate the Prisma client after schema changes
- `pnpm lint` / `pnpm test`
- `pnpm format` / `pnpm format:check` — prettier
