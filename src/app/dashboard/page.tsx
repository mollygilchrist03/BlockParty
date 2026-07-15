import Link from "next/link";
import { and, asc, count, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import { amenities, announcements, eventRegistrations, events, reservations, users } from "@/db/schema";
import { requireNeighborhoodUser } from "@/lib/session";
import { Avatar } from "@/components/avatar";
import { timeAgo } from "@/lib/time-ago";

function StatCard({
  href,
  icon,
  iconClassName,
  value,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  iconClassName: string;
  value: number;
  label: string;
}) {
  return (
    <div className="card flex flex-col gap-3">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClassName}`}>
        {icon}
      </span>
      <div>
        <p className="text-3xl font-semibold text-navy">{value}</p>
        <p className="text-sm text-slate">{label}</p>
      </div>
      <Link href={href} className="text-sm font-medium text-sage hover:underline">
        View all →
      </Link>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireNeighborhoodUser();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    [{ upcomingEventCount }],
    [{ newAnnouncementCount }],
    [{ reservationsTodayCount }],
    [{ neighborCount }],
    upcomingEvents,
    recentAnnouncements,
  ] = await Promise.all([
    db
      .select({ upcomingEventCount: count() })
      .from(events)
      .where(and(eq(events.neighborhoodId, user.neighborhoodId), gte(events.startsAt, now))),
    db
      .select({ newAnnouncementCount: count() })
      .from(announcements)
      .where(and(eq(announcements.neighborhoodId, user.neighborhoodId), gte(announcements.createdAt, weekAgo))),
    db
      .select({ reservationsTodayCount: count() })
      .from(reservations)
      .innerJoin(amenities, eq(reservations.amenityId, amenities.id))
      .where(
        and(
          eq(amenities.neighborhoodId, user.neighborhoodId),
          gte(reservations.startsAt, todayStart),
          lte(reservations.startsAt, todayEnd),
        ),
      ),
    db
      .select({ neighborCount: count() })
      .from(users)
      .where(and(eq(users.neighborhoodId, user.neighborhoodId), eq(users.role, "resident"))),
    db
      .select({
        id: events.id,
        title: events.title,
        startsAt: events.startsAt,
        location: events.location,
      })
      .from(events)
      .where(and(eq(events.neighborhoodId, user.neighborhoodId), gte(events.startsAt, now)))
      .orderBy(asc(events.startsAt))
      .limit(3),
    db
      .select({
        id: announcements.id,
        title: announcements.title,
        body: announcements.body,
        createdAt: announcements.createdAt,
      })
      .from(announcements)
      .where(eq(announcements.neighborhoodId, user.neighborhoodId))
      .orderBy(desc(announcements.createdAt))
      .limit(3),
  ]);

  const eventIds = upcomingEvents.map((event) => event.id);
  const attendeesByEvent = new Map<string, { name: string; total: number }[]>();
  if (eventIds.length > 0) {
    const registrations = await db
      .select({
        eventId: eventRegistrations.eventId,
        name: users.name,
      })
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-navy">
            Welcome back, {user.name?.split(" ")[0] ?? "neighbor"}! 👋
          </h1>
          <p className="mt-1 text-slate">Here&apos;s what&apos;s happening in your neighborhood.</p>
        </div>
        <Link href="/dashboard/board/new" className="btn-primary self-start">
          + New post
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          href="/dashboard/events"
          value={upcomingEventCount}
          label="Upcoming events"
          iconClassName="bg-sage-light text-sage"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M8 3v4M16 3v4M3 10h18" />
            </svg>
          }
        />
        <StatCard
          href="/dashboard/announcements"
          value={newAnnouncementCount}
          label="New announcements"
          iconClassName="bg-blue-50 text-blue-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M3 11v2a2 2 0 0 0 2 2h1l3 5V4L6 9H5a2 2 0 0 0-2 2Z" />
              <path d="M14 8a4 4 0 0 1 0 8" />
            </svg>
          }
        />
        <StatCard
          href="/dashboard/amenities"
          value={reservationsTodayCount}
          label="Reservations today"
          iconClassName="bg-amber-50 text-amber-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4" />
            </svg>
          }
        />
        <StatCard
          href="/dashboard/directory"
          value={neighborCount}
          label="Neighbors"
          iconClassName="bg-violet-50 text-violet-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <circle cx="9" cy="8" r="3" />
              <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              <path d="M16 4.2a3 3 0 0 1 0 5.6M20 20c0-2.8-1.9-5.1-4.5-5.8" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card flex flex-col gap-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy">Upcoming events</h2>
            <Link href="/dashboard/events" className="text-sm font-medium text-sage hover:underline">
              View all
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-slate">No upcoming events yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate/10">
              {upcomingEvents.map((event) => {
                const attendees = attendeesByEvent.get(event.id) ?? [];
                return (
                  <li key={event.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <Link href={`/dashboard/events/${event.id}`} className="min-w-0 flex-1">
                      <p className="truncate font-medium text-navy hover:text-sage">{event.title}</p>
                      <p className="mt-0.5 text-sm text-slate">
                        {event.startsAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </Link>
                    {attendees.length > 0 && (
                      <div className="flex shrink-0 items-center">
                        {attendees.map((attendee, index) => (
                          <Avatar
                            key={attendee.name + index}
                            name={attendee.name}
                            size="sm"
                            className={index > 0 ? "-ml-2" : ""}
                          />
                        ))}
                        {attendees[0]?.total > attendees.length && (
                          <span className="-ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate ring-2 ring-white">
                            +{attendees[0].total - attendees.length}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy">Recent announcements</h2>
            <Link href="/dashboard/announcements" className="text-sm font-medium text-sage hover:underline">
              View all
            </Link>
          </div>
          {recentAnnouncements.length === 0 ? (
            <p className="text-sm text-slate">No announcements yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate/10">
              {recentAnnouncements.map((announcement) => (
                <li key={announcement.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-light text-sage">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M3 11v2a2 2 0 0 0 2 2h1l3 5V4L6 9H5a2 2 0 0 0-2 2Z" />
                      <path d="M14 8a4 4 0 0 1 0 8" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-navy">{announcement.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate">{announcement.body}</p>
                    <p className="mt-1 text-xs text-muted">{timeAgo(announcement.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
