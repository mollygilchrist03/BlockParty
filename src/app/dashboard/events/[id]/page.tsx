import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations, events } from "@/db/schema";
import { assertNotDemo, requireUser } from "@/lib/session";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

async function toggleRsvp(eventId: string) {
  "use server";

  const user = await requireUser();
  assertNotDemo(user, `/dashboard/events/${eventId}`);

  const [existing] = await db
    .select()
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, user.id),
      ),
    )
    .limit(1);

  if (existing && existing.status !== "cancelled") {
    await db
      .update(eventRegistrations)
      .set({ status: "cancelled" })
      .where(eq(eventRegistrations.id, existing.id));

    const [nextInLine] = await db
      .select()
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, eventId),
          eq(eventRegistrations.status, "waitlisted"),
        ),
      )
      .orderBy(asc(eventRegistrations.createdAt))
      .limit(1);

    if (nextInLine) {
      await db
        .update(eventRegistrations)
        .set({ status: "registered" })
        .where(eq(eventRegistrations.id, nextInLine.id));
    }
  } else {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    if (!event) return;

    const [{ registeredCount }] = await db
      .select({ registeredCount: count() })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, eventId),
          eq(eventRegistrations.status, "registered"),
        ),
      );

    const isFull =
      event.capacity != null && registeredCount >= event.capacity;
    const status = isFull ? "waitlisted" : "registered";

    if (existing) {
      await db
        .update(eventRegistrations)
        .set({ status })
        .where(eq(eventRegistrations.id, existing.id));
    } else {
      await db.insert(eventRegistrations).values({ eventId, userId: user.id, status });
    }
  }

  revalidatePath(`/dashboard/events/${eventId}`);
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const user = await requireUser();

  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event || event.neighborhoodId !== user.neighborhoodId) notFound();

  const [{ registeredCount }] = await db
    .select({ registeredCount: count() })
    .from(eventRegistrations)
    .where(
      and(eq(eventRegistrations.eventId, id), eq(eventRegistrations.status, "registered")),
    );

  const [myRegistration] = await db
    .select()
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, id), eq(eventRegistrations.userId, user.id)))
    .limit(1);

  const myStatus = myRegistration?.status;
  const isGoing = myStatus === "registered" || myStatus === "waitlisted";
  const isFull = event.capacity != null && registeredCount >= event.capacity;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <h1 className="text-2xl font-semibold text-navy">{event.title}</h1>
        <p className="mt-1 text-slate">
          {event.startsAt.toLocaleString(undefined, {
            dateStyle: "full",
            timeStyle: "short",
          })}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      </div>

      {event.description && (
        <p className="whitespace-pre-wrap text-slate">{event.description}</p>
      )}

      <DemoReadonlyBanner error={error} />

      <div className="card flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-slate">
            {event.capacity
              ? `${registeredCount}/${event.capacity} spots taken`
              : `${registeredCount} going`}
          </p>
          {myStatus === "waitlisted" && (
            <p className="mt-1 text-sm font-medium text-sage">
              You&apos;re on the waitlist — you&apos;ll be moved in
              automatically if a spot opens up.
            </p>
          )}
        </div>
        <form action={toggleRsvp.bind(null, event.id)}>
          <button
            type="submit"
            className={isGoing ? "btn-secondary" : "btn-primary"}
          >
            {isGoing
              ? "Cancel RSVP"
              : isFull
                ? "Join waitlist"
                : "RSVP"}
          </button>
        </form>
      </div>
    </div>
  );
}
