import { sql } from "drizzle-orm";
import { db } from "./index";

// Seed data isn't idempotent (plain inserts, unique emails/slugs), and CI
// reseeds on every run — wipe first so a second run doesn't hit a unique
// constraint violation. Truncating neighborhoods/users cascades out
// everything scoped to them; the two standalone tables are cleared too.
async function reset() {
  await db.execute(sql`
    TRUNCATE TABLE neighborhoods, users, neighborhood_requests, demo_login_events CASCADE
  `);
  console.log("Database reset.");
}

reset().then(() => process.exit(0));
