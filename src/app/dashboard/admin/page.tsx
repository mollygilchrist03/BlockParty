import Link from "next/link";
import { requireBoard } from "@/lib/session";

export default async function AdminPage() {
  await requireBoard();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">Admin</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/announcements/new"
          className="rounded-2xl border border-slate/10 bg-white p-6 transition-colors hover:border-sage"
        >
          <h2 className="font-semibold text-navy">Post an announcement</h2>
          <p className="mt-1 text-sm text-slate">
            Share news with the whole neighborhood.
          </p>
        </Link>
        <Link
          href="/dashboard/events/new"
          className="rounded-2xl border border-slate/10 bg-white p-6 transition-colors hover:border-sage"
        >
          <h2 className="font-semibold text-navy">Create an event</h2>
          <p className="mt-1 text-sm text-slate">
            Set a date, location, and capacity.
          </p>
        </Link>
        <Link
          href="/dashboard/amenities/new"
          className="rounded-2xl border border-slate/10 bg-white p-6 transition-colors hover:border-sage"
        >
          <h2 className="font-semibold text-navy">Add an amenity</h2>
          <p className="mt-1 text-sm text-slate">
            Set up a bookable space like a pool cabana or clubhouse.
          </p>
        </Link>
        <Link
          href="/dashboard/newsletters/new"
          className="rounded-2xl border border-slate/10 bg-white p-6 transition-colors hover:border-sage"
        >
          <h2 className="font-semibold text-navy">Upload a newsletter</h2>
          <p className="mt-1 text-sm text-slate">
            Add a monthly newsletter PDF to the archive.
          </p>
        </Link>
      </div>
    </div>
  );
}
