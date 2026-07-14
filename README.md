# BlockParty

Your neighborhood's digital gathering place — events, announcements, a
community bulletin board, amenity reservations, and a newsletter archive
for residents and HOA boards.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS v4
- [Neon](https://neon.tech) serverless Postgres + [Drizzle ORM](https://orm.drizzle.team)
- [Auth.js v5](https://authjs.dev) (Credentials provider, JWT sessions, role-based access)
- Deployed on [Vercel](https://vercel.com)

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a [Neon](https://console.neon.tech) project and copy its
   connection string into a `.env.local` file:

   ```bash
   cp .env.example .env.local
   ```

3. Push the schema and seed some sample data:

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign in with the
   seeded accounts (`admin@maplegrove.test` / `resident@maplegrove.test`,
   password `password123`).

## Database

Schema lives in `src/db/schema.ts`. Useful scripts:

- `npm run db:generate` — generate a SQL migration from schema changes
- `npm run db:push` — push the current schema straight to the database
  (fine for early development; switch to migrations once there's real data)
- `npm run db:studio` — browse data in Drizzle Studio

## Deployment

- **App** → Vercel. Set `DATABASE_URL` and `AUTH_SECRET` as environment
  variables in the Vercel project settings.
- **Database** → Neon. Use a pooled connection string for serverless
  functions.
