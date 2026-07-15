import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { neighborhoods, users } from "@/db/schema";
import { requireBoard } from "@/lib/session";
import { SavedBanner } from "@/components/saved-banner";

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
      <SavedBanner message={updated === "1" ? "Resident saved." : null} />
      {rows.length === 0 ? (
        <p className="text-slate">No residents yet.</p>
      ) : (
        <ul className="list-card">
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
