import Image from "next/image";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { amenities, amenityLocationEnum } from "@/db/schema";
import { requireNeighborhoodUser } from "@/lib/session";
import { boardOnlyRoles } from "@/lib/roles";

const amenityIcon = (
  <>
    <circle cx="8" cy="15" r="4" />
    <path d="M11 12l7-7M16 3l3 3M19 6l-3.5 3.5" />
  </>
);

export default async function AmenitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireNeighborhoodUser();
  const { type } = await searchParams;
  const activeType = amenityLocationEnum.enumValues.find((t) => t === type);

  const rows = await db
    .select()
    .from(amenities)
    .where(
      activeType
        ? and(eq(amenities.neighborhoodId, user.neighborhoodId), eq(amenities.locationType, activeType))
        : eq(amenities.neighborhoodId, user.neighborhoodId),
    );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-navy">Amenities</h1>
          {boardOnlyRoles.includes(user.role) && (
            <Link href="/dashboard/amenities/new" className="btn-primary">
              New amenity
            </Link>
          )}
        </div>
        <p className="mt-1 text-sm text-slate">Reserve a community amenity.</p>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/dashboard/amenities"
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            !activeType ? "bg-navy text-white" : "border border-slate/20 bg-white text-slate hover:border-sage hover:text-sage"
          }`}
        >
          All Amenities
        </Link>
        <Link
          href="/dashboard/amenities?type=indoor"
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            activeType === "indoor" ? "bg-navy text-white" : "border border-slate/20 bg-white text-slate hover:border-sage hover:text-sage"
          }`}
        >
          Indoor
        </Link>
        <Link
          href="/dashboard/amenities?type=outdoor"
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            activeType === "outdoor" ? "bg-navy text-white" : "border border-slate/20 bg-white text-slate hover:border-sage hover:text-sage"
          }`}
        >
          Outdoor
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-slate">No amenities set up yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((amenity) => (
            <li key={amenity.id} className="card overflow-hidden !p-0">
              <div className="relative h-36 w-full bg-sage-light">
                {amenity.imageUrl ? (
                  <Image src={amenity.imageUrl} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sage">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                      {amenityIcon}
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 p-4">
                <h2 className="font-semibold text-navy">{amenity.name}</h2>
                {amenity.description && <p className="text-sm text-slate">{amenity.description}</p>}
                {amenity.capacity && (
                  <p className="text-sm text-muted">Max Capacity: {amenity.capacity} people</p>
                )}
                <Link href={`/dashboard/amenities/${amenity.id}`} className="btn-primary mt-1 self-start text-sm">
                  Reserve
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
