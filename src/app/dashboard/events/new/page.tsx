import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { events, neighborhoods } from "@/db/schema";
import { requireBoard } from "@/lib/session";
import { postCreateRedirectPath, resolveActingNeighborhoodId } from "@/lib/roles";

async function createEvent(formData: FormData) {
  "use server";

  const user = await requireBoard();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const neighborhoodId = resolveActingNeighborhoodId(user, formData);

  if (!title || !startsAtRaw || !neighborhoodId) return;

  await db.insert(events).values({
    neighborhoodId,
    createdById: user.id,
    title,
    description: description || null,
    location: location || null,
    startsAt: new Date(startsAtRaw),
    capacity: capacityRaw ? Number(capacityRaw) : null,
  });

  redirect(postCreateRedirectPath(user, "/dashboard/events"));
}

export default async function NewEventPage() {
  const user = await requireBoard();
  const neighborhoodOptions = user.neighborhoodId
    ? []
    : await db.select({ id: neighborhoods.id, name: neighborhoods.name }).from(neighborhoods).orderBy(asc(neighborhoods.name));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">New event</h1>
      </div>
      <form action={createEvent} className="card flex flex-col gap-4">
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
          Title
          <input type="text" name="title" required className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Description
          <textarea name="description" rows={4} className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Location
          <input type="text" name="location" className="field" />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate">
            Starts at
            <input type="datetime-local" name="startsAt" required className="field" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate">
            Capacity (optional)
            <input type="number" name="capacity" min={1} className="field" />
          </label>
        </div>
        <button type="submit" className="btn-primary self-start">
          Create event
        </button>
      </form>
    </div>
  );
}
