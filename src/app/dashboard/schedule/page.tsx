import Link from "next/link";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wasteSchedules } from "@/db/schema";
import { assertNotDemo, requireNeighborhoodUser, requireUser } from "@/lib/session";
import { dayNames, nextPickupDate } from "@/lib/waste";
import { boardOnlyRoles } from "@/lib/roles";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

const typeLabels: Record<string, string> = {
  trash: "Trash",
  recycling: "Recycling",
  bulk: "Bulk pickup",
};

const typeIcons: Record<string, React.ReactNode> = {
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </>
  ),
  recycling: (
    <>
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
      <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
      <path d="m14 16-3 3 3 3" />
      <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
      <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 12 3a1.784 1.784 0 0 1 1.545.888l3.943 6.843" />
      <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
    </>
  ),
  bulk: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
};

function daysUntilLabel(date: Date) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.round((date.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

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
      nextPickup: nextPickupDate(schedule.dayOfWeek, schedule.frequency, schedule.anchorDate),
    }))
    .sort((a, b) => a.nextPickup.getTime() - b.nextPickup.getTime());

  const nextByType = new Map<string, (typeof withNextPickup)[number]>();
  for (const schedule of withNextPickup) {
    const existing = nextByType.get(schedule.type);
    if (!existing || schedule.nextPickup < existing.nextPickup) {
      nextByType.set(schedule.type, schedule);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-navy">Trash &amp; Recycling</h1>
          {boardOnlyRoles.includes(user.role) && (
            <Link href="/dashboard/schedule/new" className="btn-primary">
              New schedule
            </Link>
          )}
        </div>
        <p className="mt-1 text-sm text-slate">Stay on top of pickup days and guidelines.</p>
      </div>

      <DemoReadonlyBanner error={error} />

      {withNextPickup.length === 0 ? (
        <p className="text-slate">No pickup schedules set up yet.</p>
      ) : (
        <>
          {(nextByType.get("trash") || nextByType.get("recycling")) && (
            <div>
              <h2 className="mb-3 font-semibold text-navy">Next Pickup</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {["trash", "recycling"].map((type) => {
                  const schedule = nextByType.get(type);
                  if (!schedule) return null;
                  return (
                    <div key={type} className="card flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-light text-sage">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          {typeIcons[type]}
                        </svg>
                      </span>
                      <div>
                        <p className="font-semibold text-navy">{typeLabels[type]}</p>
                        <p className="text-sm text-slate">
                          {schedule.nextPickup.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                        </p>
                        <p className="text-xs text-muted">{daysUntilLabel(schedule.nextPickup)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-3 font-semibold text-navy">Pickup Schedule</h2>
            <ul className="list-card">
              {withNextPickup.map((schedule) => (
                <li key={schedule.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-muted">
                      {typeIcons[schedule.type]}
                    </svg>
                    <div>
                      <p className="font-medium text-navy">{typeLabels[schedule.type]}</p>
                      <p className="text-sm text-muted">
                        Every {schedule.frequency === "biweekly" ? "other " : ""}
                        {dayNames[schedule.dayOfWeek]}
                        {schedule.notes ? ` · ${schedule.notes}` : ""}
                      </p>
                    </div>
                  </div>
                  {boardOnlyRoles.includes(user.role) && (
                    <form action={deleteSchedule.bind(null, schedule.id)}>
                      <button type="submit" className="shrink-0 text-xs font-medium text-muted hover:text-red-600">
                        Delete
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
