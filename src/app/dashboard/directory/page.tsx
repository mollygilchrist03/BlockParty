import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireNeighborhoodUser } from "@/lib/session";

export default async function DirectoryPage() {
  const user = await requireNeighborhoodUser();

  const rows = await db
    .select({ id: users.id, name: users.name, unit: users.unit })
    .from(users)
    .where(
      and(
        eq(users.neighborhoodId, user.neighborhoodId),
        eq(users.directoryOptIn, true),
      ),
    )
    .orderBy(asc(users.name));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">
          Community directory
        </h1>
        <Link
          href="/dashboard/settings"
          className="text-sm font-medium text-sage hover:underline"
        >
          Manage my listing
        </Link>
      </div>
      <p className="text-sm text-slate">
        Only residents who&apos;ve opted in are listed here.
      </p>

      {rows.length === 0 ? (
        <p className="text-slate">No one has opted into the directory yet.</p>
      ) : (
        <ul className="divide-y divide-slate/10 overflow-hidden rounded-2xl border border-slate-900/8 bg-white shadow-sm shadow-slate-900/5">
          {rows.map((resident) => (
            <li
              key={resident.id}
              className="flex items-center justify-between px-6 py-4"
            >
              <span className="font-medium text-navy">{resident.name}</span>
              {resident.unit && (
                <span className="text-sm text-slate">{resident.unit}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
