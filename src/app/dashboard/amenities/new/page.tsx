import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { amenities, neighborhoods } from "@/db/schema";
import { assertNotDemo, requireBoard } from "@/lib/session";
import { postCreateRedirectPath, resolveActingNeighborhoodId } from "@/lib/roles";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

async function createAmenity(formData: FormData) {
  "use server";

  const user = await requireBoard();
  assertNotDemo(user, "/dashboard/amenities/new");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const neighborhoodId = resolveActingNeighborhoodId(user, formData);

  if (!name || !neighborhoodId) return;

  await db.insert(amenities).values({
    neighborhoodId,
    name,
    description: description || null,
  });

  redirect(postCreateRedirectPath(user, "/dashboard/amenities"));
}

export default async function NewAmenityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireBoard();
  const { error } = await searchParams;
  const neighborhoodOptions = user.neighborhoodId
    ? []
    : await db.select({ id: neighborhoods.id, name: neighborhoods.name }).from(neighborhoods).orderBy(asc(neighborhoods.name));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">New amenity</h1>
      <DemoReadonlyBanner error={error} />
      <form action={createAmenity} className="card flex flex-col gap-4">
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
        <button type="submit" className="btn-primary self-start">
          Create amenity
        </button>
      </form>
    </div>
  );
}
