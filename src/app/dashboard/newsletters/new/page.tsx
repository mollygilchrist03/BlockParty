import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { db } from "@/db";
import { newsletters } from "@/db/schema";
import { assertNotDemo, requireBoard } from "@/lib/session";
import { neighborhoodOptionsFor, postCreateRedirectPath, resolveActingNeighborhoodId } from "@/lib/roles";
import { safeFileName } from "@/lib/files";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";
import { NeighborhoodSelect } from "@/components/neighborhood-select";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MAX_NEWSLETTER_BYTES = 15 * 1024 * 1024;

async function uploadNewsletter(formData: FormData) {
  "use server";

  const user = await requireBoard();
  assertNotDemo(user, "/dashboard/newsletters/new");
  const file = formData.get("file");
  const title = String(formData.get("title") ?? "").trim();
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const neighborhoodId = resolveActingNeighborhoodId(user, formData);

  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > MAX_NEWSLETTER_BYTES ||
    !title ||
    !neighborhoodId ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year)
  ) {
    return;
  }

  // Don't trust the client-supplied MIME type — check the actual file
  // signature so an admin/board account can't get an arbitrary file type
  // stored (and served back, publicly, with an attacker-chosen
  // content-type) under the app's newsletters.
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const isPdf = new TextDecoder().decode(header) === "%PDF-";
  if (!isPdf) return;

  let blob;
  try {
    blob = await put(`newsletters/${neighborhoodId}/${safeFileName(file.name, "newsletter.pdf")}`, file, {
      access: "public",
      contentType: "application/pdf",
    });
  } catch (err) {
    console.error("[newsletters] blob upload failed", err);
    redirect("/dashboard/newsletters/new?error=upload-failed");
  }

  await db.insert(newsletters).values({
    neighborhoodId,
    title,
    fileUrl: blob.url,
    month,
    year,
  });

  redirect(postCreateRedirectPath(user, "/dashboard/newsletters"));
}

export default async function NewNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireBoard();
  const { error } = await searchParams;
  const now = new Date();
  const neighborhoodOptions = await neighborhoodOptionsFor(user);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">Upload newsletter</h1>
      <DemoReadonlyBanner error={error} />
      {error === "upload-failed" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          The file couldn&apos;t be uploaded. Please try again.
        </p>
      )}
      <form action={uploadNewsletter} className="card flex flex-col gap-4">
        <NeighborhoodSelect neighborhoodId={user.neighborhoodId} options={neighborhoodOptions} />
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
