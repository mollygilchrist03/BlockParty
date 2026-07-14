import { hash } from "bcryptjs";
import { db } from "./index";
import {
  amenities,
  announcements,
  events,
  posts,
  neighborhoods,
  users,
  wasteSchedules,
} from "./schema";

function daysFromNow(days: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function seed() {
  const [neighborhood] = await db
    .insert(neighborhoods)
    .values({ name: "Maple Grove", slug: "maple-grove" })
    .returning();

  // Bare neighborhoods (no demo content) so the onboarding neighborhood
  // picker has more than one real option.
  await db.insert(neighborhoods).values([
    { name: "Bellair Commons", slug: "bellair-commons" },
    { name: "Riverside Meadows", slug: "riverside-meadows" },
  ]);

  const passwordHash = await hash("password123", 10);

  const [admin, resident] = await db
    .insert(users)
    .values([
      {
        neighborhoodId: neighborhood.id,
        name: "Ada Board",
        email: "admin@maplegrove.test",
        passwordHash,
        role: "admin",
        unit: "HOA Office",
      },
      {
        neighborhoodId: neighborhood.id,
        name: "Rosa Resident",
        email: "resident@maplegrove.test",
        passwordHash,
        role: "resident",
        unit: "12B",
        directoryOptIn: true,
      },
    ])
    .returning();

  await db.insert(announcements).values([
    {
      neighborhoodId: neighborhood.id,
      authorId: admin.id,
      title: "Pool opens for the season this Saturday",
      body: "The community pool opens at 9am this Saturday. Please review the updated guest policy posted at the clubhouse.",
    },
    {
      neighborhoodId: neighborhood.id,
      authorId: admin.id,
      title: "Reminder: HOA dues due May 1st",
      body: "Dues can be paid online through the resident portal or dropped off at the HOA office.",
    },
  ]);

  await db.insert(events).values([
    {
      neighborhoodId: neighborhood.id,
      createdById: admin.id,
      title: "Summer Kickoff BBQ",
      description: "Bring a side dish to share! Burgers and drinks provided.",
      location: "Clubhouse lawn",
      startsAt: daysFromNow(14, 17),
      capacity: 60,
    },
    {
      neighborhoodId: neighborhood.id,
      createdById: admin.id,
      title: "HOA Board Meeting",
      description: "Monthly open board meeting. All residents welcome.",
      location: "Clubhouse conference room",
      startsAt: daysFromNow(7, 18),
      capacity: 20,
    },
  ]);

  await db.insert(posts).values([
    {
      neighborhoodId: neighborhood.id,
      authorId: resident.id,
      category: "yard_sale",
      title: "Multi-family yard sale — Saturday 8am-noon",
      body: "12B, 14A, and 16C are all selling. Furniture, kids' clothes, and a barely-used grill.",
    },
    {
      neighborhoodId: neighborhood.id,
      authorId: resident.id,
      category: "lost_and_found",
      title: "Found: grey tabby cat near the clubhouse",
      body: "No collar. Very friendly. Message me if he's yours!",
    },
  ]);

  const [pool] = await db
    .insert(amenities)
    .values({
      neighborhoodId: neighborhood.id,
      name: "Pool Cabana",
      description: "Reservable for private parties, up to 4 hours.",
    })
    .returning();

  await db.insert(amenities).values({
    neighborhoodId: neighborhood.id,
    name: "Clubhouse",
    description: "Main event space, seats up to 80.",
  });

  await db.insert(wasteSchedules).values([
    {
      neighborhoodId: neighborhood.id,
      type: "trash",
      dayOfWeek: 2, // Tuesday
      frequency: "weekly",
      anchorDate: new Date(),
      notes: "Bins out by 7am",
    },
    {
      neighborhoodId: neighborhood.id,
      type: "recycling",
      dayOfWeek: 5, // Friday
      frequency: "biweekly",
      anchorDate: new Date(),
    },
  ]);

  console.log(
    `Seeded neighborhood "${neighborhood.name}" with 2 users, 2 announcements, 2 events, 2 bulletin posts, 2 amenities (${pool.name} + Clubhouse), and 2 pickup schedules.`,
  );
  console.log(`Admin login: ${admin.email} / password123`);
  console.log(`Resident login: ${resident.email} / password123`);
}

seed().then(() => process.exit(0));
