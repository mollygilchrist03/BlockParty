import Link from "next/link";
import { asc, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { neighborhoods, users } from "@/db/schema";
import { requireOwner } from "@/lib/session";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  board: "Board",
};

export default async function OwnerPage() {
  await requireOwner();

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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-12 sm:px-10">
      <div>
        <p className="eyebrow">Platform owner</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy">
          Owner dashboard
        </h1>
      </div>

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
              <li key={neighborhood.id} className="card">
                <h3 className="font-semibold text-navy">{neighborhood.name}</h3>
                <p className="mt-1 text-sm text-slate">
                  {residentCounts.get(neighborhood.id) ?? 0} residents ·{" "}
                  {staffCounts.get(neighborhood.id) ?? 0} board/admin
                </p>
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
          <ul className="divide-y divide-slate/10 overflow-hidden rounded-2xl border border-slate-900/8 bg-white shadow-sm shadow-slate-900/5">
            {staff.map((person) => (
              <li
                key={person.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="font-medium text-navy">{person.name}</p>
                  <p className="text-sm text-muted">{person.email}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium text-slate">{person.neighborhoodName}</p>
                  <p className="text-muted">{roleLabels[person.role] ?? person.role}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
