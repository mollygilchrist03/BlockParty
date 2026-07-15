import Link from "next/link";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireNeighborhoodUser } from "@/lib/session";
import { Avatar } from "@/components/avatar";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireNeighborhoodUser();
  const { q } = await searchParams;
  const search = q?.trim();

  // Only name, unit, and avatar are shown — matching exactly what the
  // opt-in toggle on Settings tells residents will become visible. Search
  // still matches on email server-side even though it isn't displayed,
  // since a resident might reasonably search by an email they know.
  const rows = await db
    .select({ id: users.id, name: users.name, unit: users.unit, avatarUrl: users.avatarUrl })
    .from(users)
    .where(
      and(
        eq(users.neighborhoodId, user.neighborhoodId),
        eq(users.directoryOptIn, true),
        search
          ? or(
              ilike(users.name, `%${search}%`),
              ilike(users.email, `%${search}%`),
              ilike(users.unit, `%${search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(users.name));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-navy">Directory</h1>
          <Link href="/dashboard/settings" className="text-sm font-medium text-sage hover:underline">
            Manage my listing
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate">
          Find neighbors who&apos;ve opted into the community directory.
        </p>
      </div>

      <form method="GET" className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, unit, or email…"
          className="field pl-9"
        />
      </form>

      {rows.length === 0 ? (
        <p className="text-slate">
          {search ? "No matches found." : "No one has opted into the directory yet."}
        </p>
      ) : (
        <ul className="list-card">
          {rows.map((resident) => (
            <li key={resident.id} className="flex items-center gap-3 px-6 py-4">
              <Avatar name={resident.name} imageUrl={resident.avatarUrl} />
              <span className="min-w-0 flex-1 truncate font-medium text-navy">{resident.name}</span>
              {resident.unit && (
                <span className="shrink-0 text-sm text-slate">{resident.unit}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
