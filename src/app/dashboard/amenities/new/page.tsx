import { redirect } from "next/navigation";
import { db } from "@/db";
import { amenities } from "@/db/schema";
import { requireBoard } from "@/lib/session";

async function createAmenity(formData: FormData) {
  "use server";

  const user = await requireBoard();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name || !user.neighborhoodId) return;

  await db.insert(amenities).values({
    neighborhoodId: user.neighborhoodId,
    name,
    description: description || null,
  });

  redirect("/dashboard/amenities");
}

export default async function NewAmenityPage() {
  await requireBoard();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">New amenity</h1>
      <form action={createAmenity} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate">
          Name
          <input
            type="text"
            name="name"
            required
            placeholder="Pool cabana, clubhouse, tennis court…"
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
        <button
          type="submit"
          className="self-start rounded-full bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-slate"
        >
          Create amenity
        </button>
      </form>
    </div>
  );
}
