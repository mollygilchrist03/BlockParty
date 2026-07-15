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
      <form action={uploadNewsletter} className="card flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate">
          Title
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. May 2026 Newsletter"
            className="field"
          />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate">
            Month
            <select name="month" defaultValue={now.getMonth() + 1} className="field">
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
              className="field"
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
            className="field file:mr-3 file:rounded-full file:border-0 file:bg-sage-light file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-sage"
          />
        </label>
        <button type="submit" className="btn-primary self-start">
          Upload
        </button>
      </form>
    </div>
  );
}
