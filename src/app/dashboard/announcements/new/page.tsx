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
      <h1 className="text-2xl font-semibold text-navy">New announcement</h1>
      <form action={createAnnouncement} className="flex flex-col gap-4">
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
          Message
          <textarea
            name="body"
            required
            rows={6}
            className="rounded-lg border border-slate/20 px-3 py-2 text-navy outline-none focus:border-sage"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded-full bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-slate"
        >
          Post announcement
        </button>
      </form>
    </div>
  );
}
