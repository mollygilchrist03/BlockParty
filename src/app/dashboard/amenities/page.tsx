import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { amenities } from "@/db/schema";
import { requireNeighborhoodUser } from "@/lib/session";
import { boardOnlyRoles } from "@/lib/roles";

export default async function AmenitiesPage() {
  const user = await requireNeighborhoodUser();

  const rows = await db
    .select()
    .from(amenities)
    .where(eq(amenities.neighborhoodId, user.neighborhoodId));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Amenities</h1>
        {boardOnlyRoles.includes(user.role) && (
          <Link href="/dashboard/amenities/new" className="btn-primary">
            New amenity
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-slate">No amenities set up yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((amenity) => (
            <li key={amenity.id}>
              <Link
                href={`/dashboard/amenities/${amenity.id}`}
                className="card card-link block"
              >
                <h2 className="font-semibold text-navy">{amenity.name}</h2>
                {amenity.description && (
                  <p className="mt-1 text-sm text-slate">{amenity.description}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
