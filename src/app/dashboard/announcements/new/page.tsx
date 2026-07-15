import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { announcements, neighborhoods } from "@/db/schema";
import { assertNotDemo, requireBoard } from "@/lib/session";
import { postCreateRedirectPath, resolveActingNeighborhoodId } from "@/lib/roles";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

async function createAnnouncement(formData: FormData) {
  "use server";

  const user = await requireBoard();
  assertNotDemo(user, "/dashboard/announcements/new");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const neighborhoodId = resolveActingNeighborhoodId(user, formData);

  if (!title || !body || !neighborhoodId) return;

  await db.insert(announcements).values({
    neighborhoodId,
    authorId: user.id,
    title,
    body,
  });

  redirect(postCreateRedirectPath(user, "/dashboard/announcements"));
}

export default async function NewAnnouncementPage({
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
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">New announcement</h1>
      </div>
      <DemoReadonlyBanner error={error} />
      <form action={createAnnouncement} className="card flex flex-col gap-4">
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
          Message
          <textarea name="body" required rows={6} className="field" />
        </label>
        <button type="submit" className="btn-primary self-start">
          Post announcement
        </button>
      </form>
    </div>
  );
}
