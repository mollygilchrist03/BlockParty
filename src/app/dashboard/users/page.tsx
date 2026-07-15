import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { neighborhoods, users } from "@/db/schema";
import { requireBoard } from "@/lib/session";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const user = await requireBoard();
  const { updated } = await searchParams;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      unit: users.unit,
      neighborhoodName: neighborhoods.name,
    })
    .from(users)
    .innerJoin(neighborhoods, eq(users.neighborhoodId, neighborhoods.id))
    .where(
      user.neighborhoodId
        ? and(eq(users.role, "resident"), eq(users.neighborhoodId, user.neighborhoodId))
        : eq(users.role, "resident"),
    )
    .orderBy(asc(neighborhoods.name), asc(users.name));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">Residents</h1>
      {updated === "1" && (
        <p className="flex items-center gap-1.5 rounded-lg bg-sage-light px-3 py-2 text-sm font-medium text-sage">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Resident saved.
        </p>
      )}
      {rows.length === 0 ? (
        <p className="text-slate">No residents yet.</p>
      ) : (
        <ul className="divide-y divide-slate/10 overflow-hidden rounded-2xl border border-slate-900/8 bg-white shadow-sm shadow-slate-900/5">
          {rows.map((resident) => (
            <li key={resident.id}>
              <Link
                href={`/dashboard/users/${resident.id}`}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-sage-light/40"
              >
                <div>
                  <p className="font-medium text-navy">{resident.name}</p>
                  <p className="text-sm text-muted">{resident.email}</p>
                </div>
                <div className="text-right text-sm">
                  {!user.neighborhoodId && (
                    <p className="font-medium text-slate">{resident.neighborhoodName}</p>
                  )}
                  <p className="text-muted">{resident.unit ?? "—"}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
