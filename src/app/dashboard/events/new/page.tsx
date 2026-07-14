import { redirect } from "next/navigation";
import { db } from "@/db";
import { events } from "@/db/schema";
import { requireBoard } from "@/lib/session";

async function createEvent(formData: FormData) {
  "use server";

  const user = await requireBoard();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const capacityRaw = String(formData.get("capacity") ?? "").trim();

  if (!title || !startsAtRaw || !user.neighborhoodId) return;

  await db.insert(events).values({
    neighborhoodId: user.neighborhoodId,
    createdById: user.id,
    title,
    description: description || null,
    location: location || null,
    startsAt: new Date(startsAtRaw),
    capacity: capacityRaw ? Number(capacityRaw) : null,
  });

  redirect("/dashboard/events");
}

export default async function NewEventPage() {
  await requireBoard();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">New event</h1>
      <form action={createEvent} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate">
          Title
          <input
            type="text"
            name="title"
            required
            className="rounded-lg border border-slate/20 px-3 py-2 text-navy outline-none focus:border-sage"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Description
          <textarea
            name="description"
            rows={4}
            className="rounded-lg border border-slate/20 px-3 py-2 text-navy outline-none focus:border-sage"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Location
          <input
            type="text"
            name="location"
            className="rounded-lg border border-slate/20 px-3 py-2 text-navy outline-none focus:border-sage"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-slate">
            Starts at
            <input
              type="datetime-local"
              name="startsAt"
              required
              className="rounded-lg border border-slate/20 px-3 py-2 text-navy outline-none focus:border-sage"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate">
            Capacity (optional)
            <input
              type="number"
              name="capacity"
              min={1}
              className="rounded-lg border border-slate/20 px-3 py-2 text-navy outline-none focus:border-sage"
            />
          </label>
        </div>
        <button
          type="submit"
          className="self-start rounded-full bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-slate"
        >
          Create event
        </button>
      </form>
    </div>
  );
}
