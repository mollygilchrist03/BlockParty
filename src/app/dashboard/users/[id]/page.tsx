import { notFound, redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { assertNotDemo, requireBoard } from "@/lib/session";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

async function canActOn(
  actor: { role: string; neighborhoodId: string | null },
  targetId: string,
) {
  const [target] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!target || target.role !== "resident") return null;
  if (actor.role !== "owner" && target.neighborhoodId !== actor.neighborhoodId) return null;
  return target;
}

async function updateResident(id: string, formData: FormData) {
  "use server";

  const user = await requireBoard();
  assertNotDemo(user, `/dashboard/users/${id}`);

  const target = await canActOn(user, id);
  if (!target) notFound();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const unit = String(formData.get("unit") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email) {
    redirect(`/dashboard/users/${id}?error=invalid`);
  }
  if (password && password.length < 8) {
    redirect(`/dashboard/users/${id}?error=short-password`);
  }

  try {
    await db
      .update(users)
      .set({
        name,
        email,
        unit: unit || null,
        ...(password ? { passwordHash: await hash(password, 10) } : {}),
      })
      .where(eq(users.id, id));
  } catch {
    redirect(`/dashboard/users/${id}?error=duplicate`);
  }

  redirect("/dashboard/users?updated=1");
}

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireBoard();
  const { id } = await params;
  const { error } = await searchParams;

  const target = await canActOn(user, id);
  if (!target) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">Edit resident</h1>

      <DemoReadonlyBanner error={error} />

      <form
        action={updateResident.bind(null, id)}
        className="card flex flex-col gap-4"
      >
        {error === "duplicate" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            An account with that email already exists.
          </p>
        )}
        {error === "invalid" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            Name and email are required.
          </p>
        )}
        {error === "short-password" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            New password needs at least 8 characters, or leave it blank to
            keep the current one.
          </p>
        )}
        <label className="flex flex-col gap-1 text-sm text-slate">
          Name
          <input
            type="text"
            name="name"
            required
            defaultValue={target.name}
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Email
          <input
            type="email"
            name="email"
            required
            defaultValue={target.email}
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Unit
          <input
            type="text"
            name="unit"
            defaultValue={target.unit ?? ""}
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          New password (optional)
          <input
            type="text"
            name="password"
            minLength={8}
            placeholder="Leave blank to keep current password"
            className="field"
          />
        </label>
        <button type="submit" className="btn-primary self-start">
          Save changes
        </button>
      </form>
    </div>
  );
}
