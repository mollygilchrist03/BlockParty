import { hash } from "bcryptjs";
import { put } from "@vercel/blob";
import { db } from "./index";
import {
  amenities,
  announcements,
  eventRegistrations,
  events,
  neighborhoods,
  newsletters,
  posts,
  reservations,
  users,
  wasteSchedules,
} from "./schema";

function daysFromNow(days: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

// Minimal valid single-page PDF, built by hand — no dependency needed just
// to seed a demo newsletter file.
function placeholderPdf(title: string) {
  // Base14 Helvetica in a hand-rolled PDF has no encoding declaration, so
  // anything outside plain ASCII (em dashes, curly quotes, …) renders as
  // mojibake — flatten to a safe hyphen instead.
  const safeTitle = title.replace(/[—–]/g, "-").replace(/[^\x20-\x7e]/g, "");
  const text = `(${safeTitle.replace(/[()\\]/g, "")}) Tj`;
  const stream = `BT /F1 24 Tf 72 700 Td ${text} ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "utf-8");
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

  const [admin, resident, owner, marcus, priya, jake, sofia] = await db
    .insert(users)
    .values([
      {
        neighborhoodId: neighborhood.id,
        name: "Ada Board",
        email: "admin@maplegrove.test",
        passwordHash,
        role: "admin",
        unit: "HOA Office",
        isDemo: true,
      },
      {
        neighborhoodId: neighborhood.id,
        name: "Rosa Resident",
        email: "resident@maplegrove.test",
        passwordHash,
        role: "resident",
        unit: "12B",
        directoryOptIn: true,
        isDemo: true,
      },
      {
        name: "Olivia Owner",
        email: "owner@blockparty.test",
        passwordHash,
        role: "owner",
        isDemo: true,
      },
      {
        neighborhoodId: neighborhood.id,
        name: "Marcus Chen",
        email: "marcus.chen@maplegrove.test",
        passwordHash,
        role: "resident",
        unit: "8A",
        directoryOptIn: true,
      },
      {
        neighborhoodId: neighborhood.id,
        name: "Priya Patel",
        email: "priya.patel@maplegrove.test",
        passwordHash,
        role: "resident",
        unit: "15C",
        directoryOptIn: true,
      },
      {
        neighborhoodId: neighborhood.id,
        name: "Jake Sullivan",
        email: "jake.sullivan@maplegrove.test",
        passwordHash,
        role: "resident",
        unit: "3D",
        directoryOptIn: false,
      },
      {
        neighborhoodId: neighborhood.id,
        name: "Sofia Ramirez",
        email: "sofia.ramirez@maplegrove.test",
        passwordHash,
        role: "resident",
        unit: "21B",
        directoryOptIn: true,
      },
    ])
    .returning();

  const residents = [resident, marcus, priya, jake, sofia];

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
    {
      neighborhoodId: neighborhood.id,
      authorId: admin.id,
      title: "New security cameras installed at both entrances",
      body: "As approved at last month's board meeting, cameras are now live at the North and South gates. Footage is retained for 30 days and available to the board on request.",
    },
    {
      neighborhoodId: neighborhood.id,
      authorId: admin.id,
      title: "Fall landscaping schedule",
      body: "Crews will be mulching common areas and trimming trees the week of the 14th. Please move cars off the street on your scheduled day — a notice will be posted at your building.",
    },
    {
      neighborhoodId: neighborhood.id,
      authorId: admin.id,
      title: "Board election results",
      body: "Thanks to everyone who voted! Ada Board and two new members will begin their terms next month. Full minutes are posted in the newsletter archive.",
    },
  ]);

  const [bbq, boardMeeting, , wineTasting] = await db
    .insert(events)
    .values([
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
      {
        neighborhoodId: neighborhood.id,
        createdById: admin.id,
        title: "Fall Festival & Trunk-or-Treat",
        description: "Costume contest, hayride, and treats for the kids. Decorate your trunk!",
        location: "Clubhouse parking lot",
        startsAt: daysFromNow(30, 16),
        capacity: 100,
      },
      {
        neighborhoodId: neighborhood.id,
        createdById: admin.id,
        title: "Wine Tasting Night",
        description: "Small-batch tasting with a local sommelier. Space is limited.",
        location: "Clubhouse",
        startsAt: daysFromNow(10, 19),
        capacity: 3,
      },
    ])
    .returning();

  // Give the BBQ and board meeting a realistic partial turnout.
  await db.insert(eventRegistrations).values([
    { eventId: bbq.id, userId: resident.id, status: "registered" },
    { eventId: bbq.id, userId: marcus.id, status: "registered" },
    { eventId: bbq.id, userId: priya.id, status: "registered" },
    { eventId: bbq.id, userId: sofia.id, status: "registered" },
    { eventId: boardMeeting.id, userId: resident.id, status: "registered" },
    { eventId: boardMeeting.id, userId: jake.id, status: "registered" },
    // Wine Tasting is capacity 3 — fill it and waitlist one to show that flow.
    { eventId: wineTasting.id, userId: resident.id, status: "registered" },
    { eventId: wineTasting.id, userId: marcus.id, status: "registered" },
    { eventId: wineTasting.id, userId: priya.id, status: "registered" },
    { eventId: wineTasting.id, userId: sofia.id, status: "waitlisted" },
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
      authorId: marcus.id,
      category: "lost_and_found",
      title: "Found: grey tabby cat near the clubhouse",
      body: "No collar. Very friendly. Message me if he's yours!",
    },
    {
      neighborhoodId: neighborhood.id,
      authorId: priya.id,
      category: "recommendation",
      title: "Great local plumber — fixed our water heater same day",
      body: "Used Ramirez Plumbing after a recommendation here last year. Fair pricing, showed up on time. Happy to share their number.",
    },
    {
      neighborhoodId: neighborhood.id,
      authorId: sofia.id,
      category: "general",
      title: "Anyone interested in a neighborhood book club?",
      body: "Thinking once a month at the clubhouse, rotating picks. Reply here or find me at unit 21B if you'd want in.",
    },
  ]);

  const [pool, clubhouse, tennis] = await db
    .insert(amenities)
    .values([
      {
        neighborhoodId: neighborhood.id,
        name: "Pool Cabana",
        description: "Reservable for private parties, up to 4 hours.",
      },
      {
        neighborhoodId: neighborhood.id,
        name: "Clubhouse",
        description: "Main event space, seats up to 80.",
      },
      {
        neighborhoodId: neighborhood.id,
        name: "Tennis Court",
        description: "Court 1, first-come reservations in 1-hour blocks.",
      },
    ])
    .returning();

  function onDay(days: number, hour: number, durationHours: number) {
    const startsAt = daysFromNow(days, hour);
    const endsAt = new Date(startsAt);
    endsAt.setHours(endsAt.getHours() + durationHours);
    return { startsAt, endsAt };
  }

  await db.insert(reservations).values([
    { amenityId: pool.id, userId: resident.id, ...onDay(5, 14, 3) },
    { amenityId: clubhouse.id, userId: marcus.id, ...onDay(9, 18, 4) },
    { amenityId: tennis.id, userId: priya.id, ...onDay(2, 9, 1) },
    { amenityId: tennis.id, userId: jake.id, ...onDay(2, 10, 1) },
    { amenityId: pool.id, userId: sofia.id, ...onDay(18, 12, 4) },
  ]);

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
    {
      neighborhoodId: neighborhood.id,
      type: "bulk",
      dayOfWeek: 1, // Monday
      frequency: "biweekly",
      anchorDate: new Date(),
      notes: "Furniture and appliances only — call the HOA office for large items",
    },
  ]);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const now = new Date();
    const months = [
      { title: "Maple Grove Monthly — Latest Issue", offset: 0 },
      { title: "Maple Grove Monthly — Last Month", offset: -1 },
    ];
    for (const { title, offset } of months) {
      const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const blob = await put(
        `newsletters/${neighborhood.id}/${date.getFullYear()}-${date.getMonth() + 1}.pdf`,
        placeholderPdf(title),
        { access: "public", contentType: "application/pdf" },
      );
      await db.insert(newsletters).values({
        neighborhoodId: neighborhood.id,
        title,
        fileUrl: blob.url,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      });
    }
  } else {
    console.log("Skipping newsletter seed — BLOB_READ_WRITE_TOKEN not set.");
  }

  console.log(
    `Seeded neighborhood "${neighborhood.name}" with ${residents.length + 2} users, 5 announcements, 4 events (with RSVPs + a waitlist), 4 bulletin posts, 3 amenities, 5 reservations, and 3 pickup schedules.`,
  );
  console.log(`Admin login: ${admin.email} / password123`);
  console.log(`Resident login: ${resident.email} / password123`);
  console.log(`Owner login: ${owner.email} / password123`);
}

seed().then(() => process.exit(0));
