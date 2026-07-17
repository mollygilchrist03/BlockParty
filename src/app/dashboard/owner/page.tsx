import Link from "next/link";
import { asc, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { demoLoginEvents, neighborhoodRequests, neighborhoods, users } from "@/db/schema";
import { requireOwner } from "@/lib/session";
import { SavedBanner } from "@/components/saved-banner";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  board: "Board",
};

const createdCopy: Record<string, string> = {
  neighborhood: "Neighborhood created.",
  admin: "HOA admin created.",
};

const confirmationCopy: Record<string, string> = {
  neighborhood: "Neighborhood saved.",
  admin: "HOA admin saved.",
};

const deletionCopy: Record<string, string> = {
  neighborhood: "Neighborhood deleted.",
  admin: "HOA admin account deleted.",
};

export default async function OwnerPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; deleted?: string }>;
}) {
  await requireOwner();
  const { created, updated, deleted } = await searchParams;

  const [{ pendingRequestCount }] = await db
    .select({ pendingRequestCount: count() })
    .from(neighborhoodRequests)
    .where(eq(neighborhoodRequests.status, "pending"));

  const [{ demoLoginCount }] = await db
    .select({ demoLoginCount: count() })
    .from(demoLoginEvents);

  const neighborhoodRows = await db
    .select()
    .from(neighborhoods)
    .orderBy(asc(neighborhoods.name));

  const counts = await db
    .select({
      neighborhoodId: users.neighborhoodId,
      role: users.role,
      total: count(),
    })
    .from(users)
    .groupBy(users.neighborhoodId, users.role);

  const residentCounts = new Map<string, number>();
  const staffCounts = new Map<string, number>();
  for (const row of counts) {
    if (!row.neighborhoodId) continue;
    if (row.role === "resident") {
      residentCounts.set(row.neighborhoodId, row.total);
    } else if (row.role === "board" || row.role === "admin") {
      staffCounts.set(row.neighborhoodId, (staffCounts.get(row.neighborhoodId) ?? 0) + row.total);
    }
  }

  const staff = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      neighborhoodName: neighborhoods.name,
    })
    .from(users)
    .innerJoin(neighborhoods, eq(users.neighborhoodId, neighborhoods.id))
    .where(inArray(users.role, ["board", "admin"]))
    .orderBy(asc(neighborhoods.name), asc(users.name));

  const residents = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      unit: users.unit,
      neighborhoodName: neighborhoods.name,
    })
    .from(users)
    .innerJoin(neighborhoods, eq(users.neighborhoodId, neighborhoods.id))
    .where(eq(users.role, "resident"))
    .orderBy(asc(neighborhoods.name), asc(users.name));

  const banner = created
    ? createdCopy[created]
    : updated
      ? confirmationCopy[updated]
      : deleted
        ? deletionCopy[deleted]
        : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-12 sm:px-10">
      <div>
        <p className="eyebrow">Platform owner</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy">
          Owner dashboard
        </h1>
      </div>

      <SavedBanner message={banner} />

      {pendingRequestCount > 0 && (
        <Link
          href="/dashboard/owner/requests"
          className="card card-link flex items-center justify-between"
        >
          <span className="font-medium text-navy">
            {pendingRequestCount} neighborhood{pendingRequestCount === 1 ? "" : "s"} requested
          </span>
          <span className="text-sm font-medium text-sage">Review →</span>
        </Link>
      )}

      <Link
        href="/dashboard/owner/demo-activity"
        className="card card-link flex items-center justify-between"
      >
        <span className="font-medium text-navy">
          {demoLoginCount} demo login{demoLoginCount === 1 ? "" : "s"} recorded
        </span>
        <span className="text-sm font-medium text-sage">View →</span>
      </Link>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">Neighborhoods</h2>
          <Link href="/dashboard/owner/neighborhoods/new" className="btn-primary">
            New neighborhood
          </Link>
        </div>
        {neighborhoodRows.length === 0 ? (
          <p className="text-slate">No neighborhoods yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {neighborhoodRows.map((neighborhood) => (
              <li key={neighborhood.id}>
                <Link
                  href={`/dashboard/owner/neighborhoods/${neighborhood.id}`}
                  className="card card-link block"
                >
                  <h3 className="font-semibold text-navy">{neighborhood.name}</h3>
                  <p className="mt-1 text-sm text-slate">
                    {residentCounts.get(neighborhood.id) ?? 0} residents ·{" "}
                    {staffCounts.get(neighborhood.id) ?? 0} board/admin
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">HOA admins</h2>
          <Link href="/dashboard/owner/admins/new" className="btn-primary">
            New HOA admin
          </Link>
        </div>
        {staff.length === 0 ? (
          <p className="text-slate">No board/admin accounts yet.</p>
        ) : (
          <ul className="list-card">
            {staff.map((person) => (
              <li key={person.id}>
                <Link
                  href={`/dashboard/owner/admins/${person.id}`}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-sage-light/40"
                >
                  <div>
                    <p className="font-medium text-navy">{person.name}</p>
                    <p className="text-sm text-muted">{person.email}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-slate">{person.neighborhoodName}</p>
                    <p className="text-muted">{roleLabels[person.role] ?? person.role}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">Residents</h2>
          <span className="text-sm text-muted">{residents.length} total</span>
        </div>
        {residents.length === 0 ? (
          <p className="text-slate">No residents yet.</p>
        ) : (
          <ul className="list-card">
            {residents.map((person) => (
              <li key={person.id}>
                <Link
                  href={`/dashboard/users/${person.id}`}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-sage-light/40"
                >
                  <div>
                    <p className="font-medium text-navy">{person.name}</p>
                    <p className="text-sm text-muted">{person.email}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-slate">{person.neighborhoodName}</p>
                    <p className="text-muted">{person.unit ?? "—"}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
