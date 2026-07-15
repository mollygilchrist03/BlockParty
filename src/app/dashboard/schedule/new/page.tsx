import { redirect } from "next/navigation";
import { db } from "@/db";
import { scheduleFrequencyEnum, wasteSchedules, wasteTypeEnum } from "@/db/schema";
import { requireBoard } from "@/lib/session";

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

  if (
    !user.neighborhoodId ||
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
    neighborhoodId: user.neighborhoodId,
    type: type as (typeof wasteTypeEnum.enumValues)[number],
    dayOfWeek,
    frequency: frequency as (typeof scheduleFrequencyEnum.enumValues)[number],
    anchorDate: new Date(anchorDateRaw),
    notes: notes || null,
  });

  redirect("/dashboard/schedule");
}

export default async function NewSchedulePage() {
  await requireBoard();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">New pickup schedule</h1>
      <form action={createSchedule} className="card flex flex-col gap-4">
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
