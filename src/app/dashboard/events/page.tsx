import Image from "next/image";
import Link from "next/link";
import { and, asc, count, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations, events, users } from "@/db/schema";
import { requireNeighborhoodUser } from "@/lib/session";
import { boardOnlyRoles } from "@/lib/roles";
import { Avatar } from "@/components/avatar";

function DateBadge({ date }: { date: Date }) {
  return (
    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-sage-light text-sage">
      <span className="text-[10px] font-semibold uppercase tracking-wide">
        {date.toLocaleDateString(undefined, { month: "short" })}
      </span>
      <span className="text-xl font-bold leading-none">{date.getDate()}</span>
    </div>
  );
}

const eventIcon = (
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </>
);

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await requireNeighborhoodUser();
  const { view } = await searchParams;
  const showPast = view === "past";
  const now = new Date();

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      location: events.location,
      imageUrl: events.imageUrl,
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
        eq(events.neighborhoodId, user.neighborhoodId),
        showPast ? lt(events.startsAt, now) : gte(events.startsAt, now),
      ),
    )
    .groupBy(events.id)
    .orderBy(showPast ? desc(events.startsAt) : asc(events.startsAt));

  const eventIds = rows.map((event) => event.id);
  const attendeesByEvent = new Map<string, { name: string; total: number }[]>();
  if (eventIds.length > 0) {
    const registrations = await db
      .select({ eventId: eventRegistrations.eventId, name: users.name })
      .from(eventRegistrations)
      .innerJoin(users, eq(eventRegistrations.userId, users.id))
      .where(
        and(
          inArray(eventRegistrations.eventId, eventIds),
          eq(eventRegistrations.status, "registered"),
        ),
      );
    for (const eventId of eventIds) {
      const names = registrations.filter((r) => r.eventId === eventId).map((r) => r.name);
      attendeesByEvent.set(
        eventId,
        names.slice(0, 3).map((name) => ({ name, total: names.length })),
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Events</h1>
        {boardOnlyRoles.includes(user.role) && (
          <Link href="/dashboard/events/new" className="btn-primary">
            + Create Event
          </Link>
        )}
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/dashboard/events"
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            !showPast ? "bg-navy text-white" : "border border-slate/20 bg-white text-slate hover:border-sage hover:text-sage"
          }`}
        >
          Upcoming
        </Link>
        <Link
          href="/dashboard/events?view=past"
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            showPast ? "bg-navy text-white" : "border border-slate/20 bg-white text-slate hover:border-sage hover:text-sage"
          }`}
        >
          Past Events
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-slate">{showPast ? "No past events." : "No upcoming events."}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((event) => {
            const isFull = event.capacity != null && event.registeredCount >= event.capacity;
            const attendees = attendeesByEvent.get(event.id) ?? [];
            return (
              <li key={event.id}>
                <Link href={`/dashboard/events/${event.id}`} className="card card-link flex items-center gap-4">
                  {event.imageUrl ? (
                    <Image
                      src={event.imageUrl}
                      alt=""
                      width={96}
                      height={64}
                      className="h-16 w-24 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-sage-light text-sage">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                        {eventIcon}
                      </svg>
                    </div>
                  )}
                  <DateBadge date={event.startsAt} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-navy">{event.title}</h2>
                    <p className="mt-1 truncate text-sm text-slate">
                      {event.startsAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        isFull ? "bg-slate/10 text-slate" : "bg-sage-light text-sage"
                      }`}
                    >
                      {event.capacity ? `${event.registeredCount}/${event.capacity} going` : `${event.registeredCount} going`}
                    </span>
                    {attendees.length > 0 && (
                      <div className="flex items-center">
                        {attendees.map((attendee, index) => (
                          <Avatar key={attendee.name + index} name={attendee.name} size="sm" className={index > 0 ? "-ml-2" : ""} />
                        ))}
                        {attendees[0]?.total > attendees.length && (
                          <span className="-ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate ring-2 ring-white">
                            +{attendees[0].total - attendees.length}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
