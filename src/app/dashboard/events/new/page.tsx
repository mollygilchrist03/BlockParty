import { redirect } from "next/navigation";
import { db } from "@/db";
import { events } from "@/db/schema";
import { assertNotDemo, requireBoard } from "@/lib/session";
import { neighborhoodOptionsFor, postCreateRedirectPath, resolveActingNeighborhoodId } from "@/lib/roles";
import { uploadValidatedImage } from "@/lib/files";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";
import { NeighborhoodSelect } from "@/components/neighborhood-select";

async function createEvent(formData: FormData) {
  "use server";

  const user = await requireBoard();
  assertNotDemo(user, "/dashboard/events/new");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const neighborhoodId = resolveActingNeighborhoodId(user, formData);
  const photo = formData.get("photo");

  if (!title || !startsAtRaw || !neighborhoodId) return;

  let imageUrl: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    const result = await uploadValidatedImage(photo, `events/${neighborhoodId}`);
    if (result.error) {
      redirect(`/dashboard/events/new?error=photo-${result.error}`);
    }
    imageUrl = result.url;
  }

  await db.insert(events).values({
    neighborhoodId,
    createdById: user.id,
    title,
    description: description || null,
    location: location || null,
    imageUrl,
    startsAt: new Date(startsAtRaw),
    capacity: capacityRaw ? Number(capacityRaw) : null,
  });

  redirect(postCreateRedirectPath(user, "/dashboard/events"));
}

const photoErrors: Record<string, string> = {
  "photo-too-large": "That image is too large — 5MB max.",
  "photo-invalid-type": "Photos must be a JPEG, PNG, or WEBP image.",
  "photo-upload-failed": "The photo couldn't be uploaded. Please try again.",
};

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireBoard();
  const { error } = await searchParams;
  const neighborhoodOptions = await neighborhoodOptionsFor(user);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">New event</h1>
      </div>
      <DemoReadonlyBanner error={error} />
      <form action={createEvent} className="card flex flex-col gap-4">
        {error && photoErrors[error] && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{photoErrors[error]}</p>
        )}
        <NeighborhoodSelect neighborhoodId={user.neighborhoodId} options={neighborhoodOptions} />
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
        <label className="flex flex-col gap-1 text-sm text-slate">
          Photo (optional)
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            className="field file:mr-3 file:rounded-full file:border-0 file:bg-sage-light file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-sage"
          />
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
