import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { db } from "@/db";
import { newsletters } from "@/db/schema";
import { requireBoard } from "@/lib/session";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

async function uploadNewsletter(formData: FormData) {
  "use server";

  const user = await requireBoard();
  const file = formData.get("file");
  const title = String(formData.get("title") ?? "").trim();
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));

  if (
    !(file instanceof File) ||
    file.size === 0 ||
    !title ||
    !user.neighborhoodId ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year)
  ) {
    return;
  }

  const blob = await put(`newsletters/${user.neighborhoodId}/${file.name}`, file, {
    access: "public",
    contentType: file.type || "application/pdf",
  });

  await db.insert(newsletters).values({
    neighborhoodId: user.neighborhoodId,
    title,
    fileUrl: blob.url,
    month,
    year,
  });

  redirect("/dashboard/newsletters");
}

export default async function NewNewsletterPage() {
  await requireBoard();
  const now = new Date();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">Upload newsletter</h1>
      <form action={uploadNewsletter} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate">
          Title
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. May 2026 Newsletter"
            className="rounded-lg border border-slate/20 px-3 py-2 text-navy outline-none focus:border-sage"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-slate">
            Month
            <select
              name="month"
              defaultValue={now.getMonth() + 1}
              className="rounded-lg border border-slate/20 px-3 py-2 text-navy outline-none focus:border-sage"
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate">
            Year
            <input
              type="number"
              name="year"
              required
              defaultValue={now.getFullYear()}
              className="rounded-lg border border-slate/20 px-3 py-2 text-navy outline-none focus:border-sage"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm text-slate">
          PDF file
          <input
            type="file"
            name="file"
            accept="application/pdf"
            required
            className="rounded-lg border border-slate/20 px-3 py-2 text-navy outline-none focus:border-sage"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded-full bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-slate"
        >
          Upload
        </button>
      </form>
    </div>
  );
}
