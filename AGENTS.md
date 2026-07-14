<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# BlockParty

A neighborhood/HOA community platform: events with RSVPs, announcements, a
bulletin board (yard sales, lost & found), amenity reservations, a
newsletter archive, and trash/recycling schedules — scoped per
neighborhood with resident / board / admin roles.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Neon Postgres + Drizzle ORM (`src/db/schema.ts`)
- Auth.js v5 (NextAuth), Credentials provider, JWT sessions, role stored on
  the JWT/session (`src/auth.ts`, `src/middleware.ts`)
- Deploy target: Vercel (app) + Neon (database)

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL from console.neon.tech
npm run db:push              # push schema to the database
npm run db:seed              # seed one neighborhood + admin/resident login
npm run dev
```

Seeded logins (from `src/db/seed.ts`): `admin@maplegrove.test` /
`resident@maplegrove.test`, password `password123` for both.

## Conventions

- All domain tables are scoped by `neighborhoodId` — new tables/queries
  should follow that pattern rather than assuming a single tenant.
- Roles are `resident | board | admin` (Postgres enum in
  `src/db/schema.ts`); `/admin/*` routes are gated in `src/middleware.ts`.
- Brand colors live as CSS variables in `src/app/globals.css`
  (`--color-navy #1F2937`, `--color-slate #334155`, `--color-sage #6BA58C`)
  and are usable as Tailwind classes (`bg-navy`, `text-sage`, etc.) via
  Tailwind v4's `@theme inline`.
- Logo is `public/logo.svg` (transparent background, house + tree mark).
