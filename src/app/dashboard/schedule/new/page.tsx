import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { neighborhoods, scheduleFrequencyEnum, wasteSchedules, wasteTypeEnum } from "@/db/schema";
import { requireBoard } from "@/lib/session";
import { postCreateRedirectPath, resolveActingNeighborhoodId } from "@/lib/roles";

const dayNames = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

async function createSchedule(formData: FormData) {
  "use server";

  const user = await requireBoard();
  const type = String(formData.get("type") ?? "");
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const frequency = String(formData.get("frequency") ?? "weekly");
  const anchorDateRaw = String(formData.get("anchorDate") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const neighborhoodId = resolveActingNeighborhoodId(user, formData);

  if (
    !neighborhoodId ||
    !wasteTypeEnum.enumValues.includes(type as (typeof wasteTypeEnum.enumValues)[number]) ||
    !scheduleFrequencyEnum.enumValues.includes(
      frequency as (typeof scheduleFrequencyEnum.enumValues)[number],
    ) ||
    !Number.isInteger(dayOfWeek) ||
    dayOfWeek < 0 ||
    dayOfWeek > 6 ||
    !anchorDateRaw
  ) {
    return;
  }

  await db.insert(wasteSchedules).values({
    neighborhoodId,
    type: type as (typeof wasteTypeEnum.enumValues)[number],
    dayOfWeek,
    frequency: frequency as (typeof scheduleFrequencyEnum.enumValues)[number],
    anchorDate: new Date(anchorDateRaw),
    notes: notes || null,
  });

  redirect(postCreateRedirectPath(user, "/dashboard/schedule"));
}

export default async function NewSchedulePage() {
  const user = await requireBoard();
  const today = new Date().toISOString().slice(0, 10);
  const neighborhoodOptions = user.neighborhoodId
    ? []
    : await db.select({ id: neighborhoods.id, name: neighborhoods.name }).from(neighborhoods).orderBy(asc(neighborhoods.name));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">New pickup schedule</h1>
      <form action={createSchedule} className="card flex flex-col gap-4">
        {!user.neighborhoodId && (
          <label className="flex flex-col gap-1 text-sm text-slate">
            Neighborhood
            <select name="neighborhoodId" required className="field">
              {neighborhoodOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm text-slate">
          Type
          <select name="type" defaultValue="trash" className="field">
            <option value="trash">Trash</option>
            <option value="recycling">Recycling</option>
            <option value="bulk">Bulk pickup</option>
          </select>
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate">
            Day of week
            <select name="dayOfWeek" defaultValue="1" className="field">
              {dayNames.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate">
            Frequency
            <select name="frequency" defaultValue="weekly" className="field">
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Anchor date
          <input
            type="date"
            name="anchorDate"
            required
            defaultValue={today}
            className="field"
          />
          <span className="text-xs text-muted">
            Any confirmed pickup date on the right day of the week. Used to
            work out which week a biweekly pickup falls on.
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Notes (optional)
          <input
            type="text"
            name="notes"
            placeholder="e.g. Bins out by 7am"
            className="field"
          />
        </label>
        <button type="submit" className="btn-primary self-start">
          Create schedule
        </button>
      </form>
    </div>
  );
}
