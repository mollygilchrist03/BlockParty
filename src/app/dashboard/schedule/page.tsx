import Link from "next/link";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wasteSchedules } from "@/db/schema";
import { assertNotDemo, requireNeighborhoodUser, requireUser } from "@/lib/session";
import { nextPickupDate } from "@/lib/waste";
import { boardOnlyRoles } from "@/lib/roles";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

const typeLabels: Record<string, string> = {
  trash: "Trash",
  recycling: "Recycling",
  bulk: "Bulk pickup",
};

const dayNames = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

async function deleteSchedule(scheduleId: string) {
  "use server";

  const user = await requireUser();
  if (!boardOnlyRoles.includes(user.role)) return;

  const [schedule] = await db
    .select({ neighborhoodId: wasteSchedules.neighborhoodId })
    .from(wasteSchedules)
    .where(eq(wasteSchedules.id, scheduleId))
    .limit(1);
  if (!schedule || schedule.neighborhoodId !== user.neighborhoodId) return;
  assertNotDemo(user, "/dashboard/schedule");

  await db.delete(wasteSchedules).where(eq(wasteSchedules.id, scheduleId));
  revalidatePath("/dashboard/schedule");
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireNeighborhoodUser();
  const { error } = await searchParams;

  const rows = await db
    .select()
    .from(wasteSchedules)
    .where(eq(wasteSchedules.neighborhoodId, user.neighborhoodId));

  const withNextPickup = rows
    .map((schedule) => ({
      ...schedule,
      nextPickup: nextPickupDate(
        schedule.dayOfWeek,
        schedule.frequency,
        schedule.anchorDate,
      ),
    }))
    .sort((a, b) => a.nextPickup.getTime() - b.nextPickup.getTime());

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">
          Trash &amp; recycling
        </h1>
        {boardOnlyRoles.includes(user.role) && (
          <Link href="/dashboard/schedule/new" className="btn-primary">
            New schedule
          </Link>
        )}
      </div>

      <DemoReadonlyBanner error={error} />

      {withNextPickup.length === 0 ? (
        <p className="text-slate">No pickup schedules set up yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {withNextPickup.map((schedule) => (
            <li key={schedule.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block rounded-full bg-sage-light px-2 py-0.5 text-xs font-medium text-sage">
                    {typeLabels[schedule.type]}
                  </span>
                  <p className="mt-2 font-semibold text-navy">
                    Next pickup:{" "}
                    {schedule.nextPickup.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-sm text-slate">
                    Every {schedule.frequency === "biweekly" ? "other " : ""}
                    {dayNames[schedule.dayOfWeek]}
                  </p>
                  {schedule.notes && (
                    <p className="mt-1 text-sm text-slate">{schedule.notes}</p>
                  )}
                </div>
                {boardOnlyRoles.includes(user.role) && (
                  <form action={deleteSchedule.bind(null, schedule.id)}>
                    <button
                      type="submit"
                      className="text-xs font-medium text-muted hover:text-red-600"
                    >
                      Delete
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
