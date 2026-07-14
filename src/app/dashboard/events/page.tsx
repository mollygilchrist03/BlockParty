import Link from "next/link";
import { and, asc, count, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations, events } from "@/db/schema";
import { requireUser } from "@/lib/session";

const boardOnlyRoles = ["board", "admin"];

export default async function EventsPage() {
  const user = await requireUser();

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      location: events.location,
      startsAt: events.startsAt,
      capacity: events.capacity,
      registeredCount: count(eventRegistrations.id),
    })
    .from(events)
    .leftJoin(
      eventRegistrations,
      and(
        eq(eventRegistrations.eventId, events.id),
        eq(eventRegistrations.status, "registered"),
      ),
    )
    .where(
      and(
        eq(events.neighborhoodId, user.neighborhoodId ?? ""),
        gte(events.startsAt, new Date()),
      ),
    )
    .groupBy(events.id)
    .orderBy(asc(events.startsAt));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Upcoming events</h1>
        {boardOnlyRoles.includes(user.role) && (
          <Link
            href="/dashboard/events/new"
            className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-slate"
          >
            New event
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-slate">No upcoming events.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((event) => {
            const isFull =
              event.capacity != null && event.registeredCount >= event.capacity;
            return (
              <li key={event.id}>
                <Link
                  href={`/dashboard/events/${event.id}`}
                  className="flex items-center justify-between rounded-2xl border border-slate/10 bg-white p-6 transition-colors hover:border-sage"
                >
                  <div>
                    <h2 className="font-semibold text-navy">{event.title}</h2>
                    <p className="mt-1 text-sm text-slate">
                      {event.startsAt.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      isFull
                        ? "bg-slate/10 text-slate"
                        : "bg-sage-light text-sage"
                    }`}
                  >
                    {event.capacity
                      ? `${event.registeredCount}/${event.capacity} going`
                      : `${event.registeredCount} going`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
