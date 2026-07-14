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
      </div>
    </div>
  );
}
