import { notFound, redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { neighborhoodRequests, neighborhoods, users } from "@/db/schema";
import { assertNotDemo, requireOwner } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

async function approveRequest(requestId: string, formData: FormData) {
  "use server";

  const user = await requireOwner();
  assertNotDemo(user, `/dashboard/owner/requests/${requestId}`);

  const [request] = await db
    .select()
    .from(neighborhoodRequests)
    .where(eq(neighborhoodRequests.id, requestId))
    .limit(1);
  if (!request || request.status !== "pending") notFound();

  const neighborhoodName = String(formData.get("neighborhoodName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const adminName = String(formData.get("adminName") ?? "").trim();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!neighborhoodName || !adminName || !adminEmail || password.length < 8) {
    redirect(`/dashboard/owner/requests/${requestId}?error=invalid`);
  }

  const passwordHash = await hash(password, 10);

  let neighborhoodId: string;
  try {
    const [neighborhood] = await db
      .insert(neighborhoods)
      .values({ name: neighborhoodName, slug: slugify(neighborhoodName), address: address || null })
      .returning();
    neighborhoodId = neighborhood.id;
  } catch {
    redirect(`/dashboard/owner/requests/${requestId}?error=duplicate-neighborhood`);
  }

  try {
    await db.insert(users).values({
      neighborhoodId,
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "admin",
    });
  } catch {
    // Admin account creation failed (duplicate email) — don't leave an
    // orphaned, admin-less neighborhood behind.
    await db.delete(neighborhoods).where(eq(neighborhoods.id, neighborhoodId));
    redirect(`/dashboard/owner/requests/${requestId}?error=duplicate-email`);
  }

  await db
    .update(neighborhoodRequests)
    .set({ status: "approved" })
    .where(eq(neighborhoodRequests.id, requestId));

  redirect("/dashboard/owner?created=admin");
}

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOwner();
  const { id } = await params;
  const { error } = await searchParams;

  const [request] = await db
    .select()
    .from(neighborhoodRequests)
    .where(eq(neighborhoodRequests.id, id))
    .limit(1);
  if (!request || request.status !== "pending") notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <p className="eyebrow">Platform owner</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">
          Approve neighborhood request
        </h1>
        <p className="mt-2 text-sm text-slate">
          Requested by {request.requesterName} ({request.requesterEmail})
          {request.message && <> — &ldquo;{request.message}&rdquo;</>}
        </p>
      </div>

      <form
        action={approveRequest.bind(null, request.id)}
        className="card flex flex-col gap-4"
      >
        <DemoReadonlyBanner error={error} />
        {error === "invalid" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            Fill in every field — password needs at least 8 characters.
          </p>
        )}
        {error === "duplicate-neighborhood" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            A neighborhood with that name already exists.
          </p>
        )}
        {error === "duplicate-email" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            An account with that email already exists.
          </p>
        )}
        <label className="flex flex-col gap-1 text-sm text-slate">
          Neighborhood name
          <input
            type="text"
            name="neighborhoodName"
            required
            defaultValue={request.neighborhoodName}
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Address (optional)
          <input
            type="text"
            name="address"
            defaultValue={request.address ?? ""}
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Admin name
          <input
            type="text"
            name="adminName"
            required
            defaultValue={request.requesterName}
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Admin email
          <input
            type="email"
            name="adminEmail"
            required
            defaultValue={request.requesterEmail}
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Temporary password
          <input
            type="text"
            name="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="field"
          />
          <span className="text-xs text-muted">
            Send this to {request.requesterName} yourself — there&apos;s no
            automated invite email yet.
          </span>
        </label>
        <button type="submit" className="btn-primary self-start">
          Create neighborhood &amp; admin account
        </button>
      </form>
    </div>
  );
}
