import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, asc, eq, gt, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { amenities, reservations, users } from "@/db/schema";
import { assertNotDemo, requireUser } from "@/lib/session";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

async function reserveAmenity(amenityId: string, formData: FormData) {
  "use server";

  const user = await requireUser();
  assertNotDemo(user, `/dashboard/amenities/${amenityId}`);

  const [amenity] = await db
    .select({ neighborhoodId: amenities.neighborhoodId })
    .from(amenities)
    .where(eq(amenities.id, amenityId))
    .limit(1);
  if (!amenity || amenity.neighborhoodId !== user.neighborhoodId) return;

  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const endsAtRaw = String(formData.get("endsAt") ?? "");
  if (!startsAtRaw || !endsAtRaw) return;

  const startsAt = new Date(startsAtRaw);
  const endsAt = new Date(endsAtRaw);
  if (!(startsAt < endsAt)) {
    redirect(`/dashboard/amenities/${amenityId}?error=invalid-range`);
  }

  const [conflict] = await db
    .select({ id: reservations.id })
    .from(reservations)
    .where(
      and(
        eq(reservations.amenityId, amenityId),
        lt(reservations.startsAt, endsAt),
        gt(reservations.endsAt, startsAt),
      ),
    )
    .limit(1);

  if (conflict) {
    redirect(`/dashboard/amenities/${amenityId}?error=conflict`);
  }

  await db.insert(reservations).values({
    amenityId,
    userId: user.id,
    startsAt,
    endsAt,
  });

  revalidatePath(`/dashboard/amenities/${amenityId}`);
}

async function cancelReservation(reservationId: string) {
  "use server";

  const user = await requireUser();
  const [reservation] = await db
    .select()
    .from(reservations)
    .where(eq(reservations.id, reservationId))
    .limit(1);

  if (!reservation || reservation.userId !== user.id) return;
  assertNotDemo(user, `/dashboard/amenities/${reservation.amenityId}`);

  await db.delete(reservations).where(eq(reservations.id, reservationId));
  revalidatePath(`/dashboard/amenities/${reservation.amenityId}`);
}

export default async function AmenityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const user = await requireUser();

  const [amenity] = await db
    .select()
    .from(amenities)
    .where(eq(amenities.id, id))
    .limit(1);
  if (!amenity || amenity.neighborhoodId !== user.neighborhoodId) notFound();

  const upcoming = await db
    .select({
      id: reservations.id,
      startsAt: reservations.startsAt,
      endsAt: reservations.endsAt,
      userId: reservations.userId,
      userName: users.name,
    })
    .from(reservations)
    .innerJoin(users, eq(reservations.userId, users.id))
    .where(and(eq(reservations.amenityId, id), gte(reservations.endsAt, new Date())))
    .orderBy(asc(reservations.startsAt));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <h1 className="text-2xl font-semibold text-navy">{amenity.name}</h1>
        {amenity.description && (
          <p className="mt-1 text-slate">{amenity.description}</p>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy">Reserve a time slot</h2>
        <DemoReadonlyBanner error={error} />
        {error === "conflict" && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            That time overlaps with an existing reservation. Try a different slot.
          </p>
        )}
        {error === "invalid-range" && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            End time must be after the start time.
          </p>
        )}
        <form
          action={reserveAmenity.bind(null, amenity.id)}
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1 text-sm text-slate">
            Starts at
            <input type="datetime-local" name="startsAt" required className="field" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate">
            Ends at
            <input type="datetime-local" name="endsAt" required className="field" />
          </label>
          <button type="submit" className="btn-primary self-start sm:col-span-2">
            Reserve
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-navy">Upcoming reservations</h2>
        {upcoming.length === 0 ? (
          <p className="text-slate">No upcoming reservations.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {upcoming.map((reservation) => (
              <li
                key={reservation.id}
                className="flex items-center justify-between rounded-xl border border-slate-900/8 bg-white px-4 py-3 shadow-sm shadow-slate-900/5"
              >
                <div>
                  <p className="text-sm font-medium text-navy">
                    {reservation.startsAt.toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    –{" "}
                    {reservation.endsAt.toLocaleString(undefined, {
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-xs text-muted">
                    {reservation.userId === user.id ? "You" : reservation.userName}
                  </p>
                </div>
                {reservation.userId === user.id && (
                  <form action={cancelReservation.bind(null, reservation.id)}>
                    <button
                      type="submit"
                      className="text-xs font-medium text-muted hover:text-red-600"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
