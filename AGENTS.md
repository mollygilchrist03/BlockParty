<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# BlockParty

A neighborhood/HOA community platform: events with RSVPs, announcements, a
bulletin board (yard sales, lost & found), amenity reservations, a
newsletter archive, and trash/recycling schedules — scoped per
neighborhood with resident / board / admin roles, plus a platform-level
owner role that provisions neighborhoods and HOA admins.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Neon Postgres + Drizzle ORM (`src/db/schema.ts`)
- Auth.js v5 (NextAuth): Credentials provider (admin/board) + Google OAuth
  (residents), JWT sessions, role stored on the JWT/session (`src/auth.ts`,
  `src/proxy.ts`)
- Vercel Blob for newsletter PDF storage (`@vercel/blob`, `BLOB_READ_WRITE_TOKEN`)
- Deploy target: Vercel (app) + Neon (database)

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL from console.neon.tech
npm run db:push              # push schema to the database
npm run db:seed              # seed 3 neighborhoods + admin/resident login
npm run dev
```

Seeded logins (from `src/db/seed.ts`): `admin@maplegrove.test` /
`resident@maplegrove.test`, password `password123` for both. Google sign-in
needs `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`; being the owner needs
`OWNER_EMAIL` set to your Google account — see README for setup.

## Conventions

- All domain tables are scoped by `neighborhoodId` — new tables/queries
  should follow that pattern rather than assuming a single tenant.
- Roles are `resident | board | admin | owner` (Postgres enum in
  `src/db/schema.ts`), plus a JWT-only `"pending"` role that's never
  persisted — set in `src/auth.ts`'s `jwt` callback for a first-time
  Google sign-in with no matching `users` row. `src/lib/roles.ts` exports
  `boardOnlyRoles`/`ownerOnlyRoles` — import them rather than re-declaring
  role arrays locally. `src/proxy.ts` (the current Next.js "middleware"
  convention) routes `pending` users to `/onboarding`, redirects
  unauthenticated users off `/dashboard/*`, gates `/dashboard/admin` to
  board/admin/owner, and gates `/dashboard/owner` to owner only.
  Individual board-only actions (creating an event, amenity, announcement,
  or newsletter) also call `requireBoard()` from `src/lib/session.ts`
  server-side; owner-only actions call `requireOwner()`.
- `owner` is a platform-level role, not scoped to a neighborhood
  (`neighborhoodId` is null). Whichever Google account's email matches
  `OWNER_EMAIL` gets auto-provisioned/promoted to `owner` in `jwt()` —
  there's no other way to become owner. From `/dashboard/owner` they
  create neighborhoods and HOA admin/board accounts (with a temporary
  password owner sets directly; no invite-email flow exists yet).
- `users.passwordHash` is nullable — Google-only residents never get one.
  Credentials `authorize()` must reject sign-in if it's null rather than
  passing `null` to `bcryptjs.compare()`.
- After `/onboarding` creates a resident's `users` row, it calls
  `unstable_update()` (exported from `src/auth.ts`) to push the new
  role/neighborhoodId/id into the current JWT — there's no adapter/DB
  session, so this is the only way to refresh an existing session
  mid-request.
- Brand colors live as CSS variables in `src/app/globals.css`
  (`--color-navy #1F2937`, `--color-slate #334155`, `--color-sage #2F6F4E`,
  `--color-muted #64748B`) and are usable as Tailwind classes (`bg-navy`,
  `text-sage`, etc.) via Tailwind v4's `@theme inline`. Shared component
  classes (`.card`, `.card-link`, `.field`, `.btn-primary`,
  `.btn-secondary`, `.eyebrow`) live in the same file's `@layer components`
  block — prefer them over repeating the underlying utility strings.
- Logo is `public/logo.svg` (transparent background, house + tree mark).
