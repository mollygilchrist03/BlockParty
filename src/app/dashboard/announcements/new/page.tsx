import { redirect } from "next/navigation";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { requireBoard } from "@/lib/session";

async function createAnnouncement(formData: FormData) {
  "use server";

  const user = await requireBoard();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body || !user.neighborhoodId) return;

  await db.insert(announcements).values({
    neighborhoodId: user.neighborhoodId,
    authorId: user.id,
    title,
    body,
  });

  redirect("/dashboard/announcements");
}

export default async function NewAnnouncementPage() {
  await requireBoard();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">New announcement</h1>
      </div>
      <form action={createAnnouncement} className="card flex flex-col gap-4">
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
