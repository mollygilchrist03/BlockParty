import { redirect } from "next/navigation";
import { db } from "@/db";
import { announcementCategoryEnum, announcements } from "@/db/schema";
import { assertNotDemo, requireBoard } from "@/lib/session";
import { neighborhoodOptionsFor, postCreateRedirectPath, resolveActingNeighborhoodId } from "@/lib/roles";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";
import { NeighborhoodSelect } from "@/components/neighborhood-select";

const categoryLabels: Record<(typeof announcementCategoryEnum.enumValues)[number], string> = {
  general: "General",
  urgent: "Urgent",
  maintenance: "Maintenance",
};

async function createAnnouncement(formData: FormData) {
  "use server";

  const user = await requireBoard();
  assertNotDemo(user, "/dashboard/announcements/new");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "general");
  const neighborhoodId = resolveActingNeighborhoodId(user, formData);

  if (
    !title ||
    !body ||
    !neighborhoodId ||
    !announcementCategoryEnum.enumValues.includes(category as (typeof announcementCategoryEnum.enumValues)[number])
  ) {
    return;
  }

  await db.insert(announcements).values({
    neighborhoodId,
    authorId: user.id,
    title,
    body,
    category: category as (typeof announcementCategoryEnum.enumValues)[number],
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
  const neighborhoodOptions = await neighborhoodOptionsFor(user);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">New announcement</h1>
      </div>
      <DemoReadonlyBanner error={error} />
      <form action={createAnnouncement} className="card flex flex-col gap-4">
        <NeighborhoodSelect neighborhoodId={user.neighborhoodId} options={neighborhoodOptions} />
        <label className="flex flex-col gap-1 text-sm text-slate">
          Title
          <input type="text" name="title" required className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Category
          <select name="category" defaultValue="general" className="field">
            {announcementCategoryEnum.enumValues.map((value) => (
              <option key={value} value={value}>
                {categoryLabels[value]}
              </option>
            ))}
          </select>
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
