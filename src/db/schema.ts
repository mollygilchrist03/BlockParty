import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["resident", "board", "admin"]);
export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "registered",
  "waitlisted",
  "cancelled",
]);
export const postCategoryEnum = pgEnum("post_category", [
  "yard_sale",
  "lost_and_found",
  "recommendation",
  "general",
]);
export const wasteTypeEnum = pgEnum("waste_type", [
  "trash",
  "recycling",
  "bulk",
]);
export const scheduleFrequencyEnum = pgEnum("schedule_frequency", [
  "weekly",
  "biweekly",
]);

export const neighborhoods = pgTable("neighborhoods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  address: varchar("address", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  neighborhoodId: uuid("neighborhood_id").references(() => neighborhoods.id, {
    onDelete: "cascade",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("resident"),
  unit: varchar("unit", { length: 100 }),
  directoryOptIn: boolean("directory_opt_in").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  neighborhoodId: uuid("neighborhood_id")
    .notNull()
    .references(() => neighborhoods.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  neighborhoodId: uuid("neighborhood_id")
    .notNull()
    .references(() => neighborhoods.id, { onDelete: "cascade" }),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at"),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: rsvpStatusEnum("status").notNull().default("registered"),
    checkedIn: boolean("checked_in").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.eventId, table.userId)],
);

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  neighborhoodId: uuid("neighborhood_id")
    .notNull()
    .references(() => neighborhoods.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: postCategoryEnum("category").notNull().default("general"),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const amenities = pgTable("amenities", {
  id: uuid("id").primaryKey().defaultRandom(),
  neighborhoodId: uuid("neighborhood_id")
    .notNull()
    .references(() => neighborhoods.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  amenityId: uuid("amenity_id")
    .notNull()
    .references(() => amenities.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const wasteSchedules = pgTable("waste_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  neighborhoodId: uuid("neighborhood_id")
    .notNull()
    .references(() => neighborhoods.id, { onDelete: "cascade" }),
  type: wasteTypeEnum("type").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  frequency: scheduleFrequencyEnum("frequency").notNull().default("weekly"),
  anchorDate: timestamp("anchor_date").notNull(),
  notes: varchar("notes", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const newsletters = pgTable("newsletters", {
  id: uuid("id").primaryKey().defaultRandom(),
  neighborhoodId: uuid("neighborhood_id")
    .notNull()
    .references(() => neighborhoods.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
