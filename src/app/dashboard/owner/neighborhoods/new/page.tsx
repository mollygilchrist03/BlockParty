import { redirect } from "next/navigation";
import { db } from "@/db";
import { neighborhoods } from "@/db/schema";
import { requireOwner } from "@/lib/session";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function createNeighborhood(formData: FormData) {
  "use server";

  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name) return;

  const slug = slugify(name);

  try {
    await db.insert(neighborhoods).values({
      name,
      slug,
      address: address || null,
    });
  } catch {
    redirect("/dashboard/owner/neighborhoods/new?error=duplicate");
  }

  redirect("/dashboard/owner?created=neighborhood");
}

export default async function NewNeighborhoodPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOwner();
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <p className="eyebrow">Platform owner</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">
          New neighborhood
        </h1>
      </div>
      <form action={createNeighborhood} className="card flex flex-col gap-4">
        {error === "duplicate" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            A neighborhood with that name already exists.
          </p>
        )}
        <label className="flex flex-col gap-1 text-sm text-slate">
          Name
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Sunset Ridge"
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Address (optional)
          <input type="text" name="address" className="field" />
        </label>
        <button type="submit" className="btn-primary self-start">
          Create neighborhood
        </button>
      </form>
    </div>
  );
}
