import { hash } from "bcryptjs";
import { db } from "./index";
import { announcements, events, neighborhoods, users } from "./schema";

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

  console.log(
    `Seeded neighborhood "${neighborhood.name}" with 2 users, 2 announcements, and 2 events.`,
  );
  console.log(`Admin login: ${admin.email} / password123`);
  console.log(`Resident login: ${resident.email} / password123`);
}

seed().then(() => process.exit(0));
