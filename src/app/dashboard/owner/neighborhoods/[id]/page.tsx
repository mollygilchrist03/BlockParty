import { notFound, redirect } from "next/navigation";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { neighborhoods, users } from "@/db/schema";
import { assertNotDemo, requireOwner } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

async function updateNeighborhood(id: string, formData: FormData) {
  "use server";

  const user = await requireOwner();
  assertNotDemo(user, `/dashboard/owner/neighborhoods/${id}`);
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name) return;

  try {
    await db
      .update(neighborhoods)
      .set({ name, slug: slugify(name), address: address || null })
      .where(eq(neighborhoods.id, id));
  } catch {
    redirect(`/dashboard/owner/neighborhoods/${id}?error=duplicate`);
  }

  redirect("/dashboard/owner?updated=neighborhood");
}

async function deleteNeighborhood(id: string) {
  "use server";

  const user = await requireOwner();
  assertNotDemo(user, `/dashboard/owner/neighborhoods/${id}`);

  const [{ total }] = await db
    .select({ total: count() })
    .from(users)
    .where(and(eq(users.neighborhoodId, id), ne(users.role, "owner")));

  if (total > 0) {
    redirect(`/dashboard/owner/neighborhoods/${id}?error=not-empty`);
  }

  await db.delete(neighborhoods).where(eq(neighborhoods.id, id));
  redirect("/dashboard/owner?deleted=neighborhood");
}

export default async function NeighborhoodDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOwner();
  const { id } = await params;
  const { error } = await searchParams;

  const [neighborhood] = await db
    .select()
    .from(neighborhoods)
    .where(eq(neighborhoods.id, id))
    .limit(1);
  if (!neighborhood) notFound();

  const [{ userTotal }] = await db
    .select({ userTotal: count() })
    .from(users)
    .where(and(eq(users.neighborhoodId, id), ne(users.role, "owner")));

  const isEmpty = userTotal === 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <p className="eyebrow">Platform owner</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">
          Edit neighborhood
        </h1>
      </div>

      <DemoReadonlyBanner error={error} />

      <form
        action={updateNeighborhood.bind(null, id)}
        className="card flex flex-col gap-4"
      >
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
            defaultValue={neighborhood.name}
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Address (optional)
          <input
            type="text"
            name="address"
            defaultValue={neighborhood.address ?? ""}
            className="field"
          />
        </label>
        <button type="submit" className="btn-primary self-start">
          Save changes
        </button>
      </form>

      <div className="card">
        <h2 className="font-semibold text-navy">Delete neighborhood</h2>
        {error === "not-empty" && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            This neighborhood still has residents or HOA admins. Remove or
            reassign them before deleting it.
          </p>
        )}
        {isEmpty ? (
          <>
            <p className="mt-1 text-sm text-slate">
              This neighborhood has no residents or admins, so it&apos;s safe
              to delete.
            </p>
            <form action={deleteNeighborhood.bind(null, id)} className="mt-4">
              <button
                type="submit"
                className="rounded-full border border-red-200 px-5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Delete neighborhood
              </button>
            </form>
          </>
        ) : (
          <p className="mt-1 text-sm text-slate">
            Deleting a neighborhood permanently deletes every resident, HOA
            admin, and all of their posts, events, and reservations in it —
            so this is only available for empty neighborhoods. Remove all
            residents and admins first.
          </p>
        )}
      </div>
    </div>
  );
}
