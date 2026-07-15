import { redirect } from "next/navigation";
import { db } from "@/db";
import { amenities, amenityLocationEnum } from "@/db/schema";
import { assertNotDemo, requireBoard } from "@/lib/session";
import { neighborhoodOptionsFor, postCreateRedirectPath, resolveActingNeighborhoodId } from "@/lib/roles";
import { uploadValidatedImage } from "@/lib/files";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";
import { NeighborhoodSelect } from "@/components/neighborhood-select";

async function createAmenity(formData: FormData) {
  "use server";

  const user = await requireBoard();
  assertNotDemo(user, "/dashboard/amenities/new");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const locationType = String(formData.get("locationType") ?? "outdoor");
  const neighborhoodId = resolveActingNeighborhoodId(user, formData);
  const photo = formData.get("photo");

  if (
    !name ||
    !neighborhoodId ||
    !amenityLocationEnum.enumValues.includes(locationType as (typeof amenityLocationEnum.enumValues)[number])
  ) {
    return;
  }

  let imageUrl: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    const result = await uploadValidatedImage(photo, `amenities/${neighborhoodId}`);
    if (result.error) {
      redirect(`/dashboard/amenities/new?error=photo-${result.error}`);
    }
    imageUrl = result.url;
  }

  await db.insert(amenities).values({
    neighborhoodId,
    name,
    description: description || null,
    capacity: capacityRaw ? Number(capacityRaw) : null,
    locationType: locationType as (typeof amenityLocationEnum.enumValues)[number],
    imageUrl,
  });

  redirect(postCreateRedirectPath(user, "/dashboard/amenities"));
}

const photoErrors: Record<string, string> = {
  "photo-too-large": "That image is too large — 5MB max.",
  "photo-invalid-type": "Photos must be a JPEG, PNG, or WEBP image.",
  "photo-upload-failed": "The photo couldn't be uploaded. Please try again.",
};

export default async function NewAmenityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireBoard();
  const { error } = await searchParams;
  const neighborhoodOptions = await neighborhoodOptionsFor(user);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">New amenity</h1>
      <DemoReadonlyBanner error={error} />
      <form action={createAmenity} className="card flex flex-col gap-4">
        {error && photoErrors[error] && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{photoErrors[error]}</p>
        )}
        <NeighborhoodSelect neighborhoodId={user.neighborhoodId} options={neighborhoodOptions} />
        <label className="flex flex-col gap-1 text-sm text-slate">
          Name
          <input
            type="text"
            name="name"
            required
            placeholder="Pool cabana, clubhouse, tennis court…"
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Description
          <textarea name="description" rows={4} className="field" />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate">
            Max capacity (optional)
            <input type="number" name="capacity" min={1} className="field" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate">
            Indoor or outdoor
            <select name="locationType" defaultValue="outdoor" className="field">
              <option value="outdoor">Outdoor</option>
              <option value="indoor">Indoor</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Photo (optional)
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            className="field file:mr-3 file:rounded-full file:border-0 file:bg-sage-light file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-sage"
          />
        </label>
        <button type="submit" className="btn-primary self-start">
          Create amenity
        </button>
      </form>
    </div>
  );
}
