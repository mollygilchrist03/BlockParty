import Link from "next/link";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">
        Welcome back, {user.name}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/announcements"
          className="rounded-2xl border border-slate/10 bg-white p-6 transition-colors hover:border-sage"
        >
          <h2 className="font-semibold text-navy">Announcements</h2>
          <p className="mt-1 text-sm text-slate">
            See what&apos;s new in your neighborhood.
          </p>
        </Link>
        <Link
          href="/dashboard/events"
          className="rounded-2xl border border-slate/10 bg-white p-6 transition-colors hover:border-sage"
        >
          <h2 className="font-semibold text-navy">Events</h2>
          <p className="mt-1 text-sm text-slate">
            Browse upcoming events and RSVP.
          </p>
        </Link>
        <Link
          href="/dashboard/board"
          className="rounded-2xl border border-slate/10 bg-white p-6 transition-colors hover:border-sage"
        >
          <h2 className="font-semibold text-navy">Bulletin board</h2>
          <p className="mt-1 text-sm text-slate">
            Yard sales, lost &amp; found, and recommendations.
          </p>
        </Link>
        <Link
          href="/dashboard/amenities"
          className="rounded-2xl border border-slate/10 bg-white p-6 transition-colors hover:border-sage"
        >
          <h2 className="font-semibold text-navy">Amenities</h2>
          <p className="mt-1 text-sm text-slate">
            Reserve the pool cabana, clubhouse, and more.
          </p>
        </Link>
        <Link
          href="/dashboard/newsletters"
          className="rounded-2xl border border-slate/10 bg-white p-6 transition-colors hover:border-sage"
        >
          <h2 className="font-semibold text-navy">Newsletters</h2>
          <p className="mt-1 text-sm text-slate">
            Browse the monthly newsletter archive.
          </p>
        </Link>
        <Link
          href="/dashboard/directory"
          className="rounded-2xl border border-slate/10 bg-white p-6 transition-colors hover:border-sage"
        >
          <h2 className="font-semibold text-navy">Directory</h2>
          <p className="mt-1 text-sm text-slate">
            Find neighbors who&apos;ve opted into the directory.
          </p>
        </Link>
        <Link
          href="/dashboard/schedule"
          className="rounded-2xl border border-slate/10 bg-white p-6 transition-colors hover:border-sage"
        >
          <h2 className="font-semibold text-navy">Trash &amp; recycling</h2>
          <p className="mt-1 text-sm text-slate">
            Check the next pickup day.
          </p>
        </Link>
      </div>
    </div>
  );
}
