import { notFound, redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { neighborhoods, users } from "@/db/schema";
import { requireOwner } from "@/lib/session";

async function updateAdmin(id: string, formData: FormData) {
  "use server";

  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const neighborhoodId = String(formData.get("neighborhoodId") ?? "");
  const role = String(formData.get("role") ?? "admin");

  const validRole = (["board", "admin"] as const).includes(
    role as "board" | "admin",
  );

  if (!name || !email || !neighborhoodId || !validRole) {
    redirect(`/dashboard/owner/admins/${id}?error=invalid`);
  }
  if (password && password.length < 8) {
    redirect(`/dashboard/owner/admins/${id}?error=short-password`);
  }

  try {
    await db
      .update(users)
      .set({
        name,
        email,
        neighborhoodId,
        role: role as "board" | "admin",
        ...(password ? { passwordHash: await hash(password, 10) } : {}),
      })
      .where(eq(users.id, id));
  } catch {
    redirect(`/dashboard/owner/admins/${id}?error=duplicate`);
  }

  redirect("/dashboard/owner?updated=admin");
}

async function deleteAdmin(id: string) {
  "use server";

  await requireOwner();
  await db.delete(users).where(eq(users.id, id));
  redirect("/dashboard/owner?deleted=admin");
}

export default async function AdminDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOwner();
  const { id } = await params;
  const { error } = await searchParams;

  const [admin] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!admin || !["board", "admin"].includes(admin.role)) {
    notFound();
  }

  const neighborhoodOptions = await db
    .select({ id: neighborhoods.id, name: neighborhoods.name })
    .from(neighborhoods)
    .orderBy(asc(neighborhoods.name));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <p className="eyebrow">Platform owner</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">
          Edit HOA admin
        </h1>
      </div>

      <form
        action={updateAdmin.bind(null, id)}
        className="card flex flex-col gap-4"
      >
        {error === "duplicate" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            An account with that email already exists.
          </p>
        )}
        {error === "invalid" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            Fill in every field.
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
            defaultValue={admin.name}
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Email
          <input
            type="email"
            name="email"
            required
            defaultValue={admin.email}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate">
            Neighborhood
            <select
              name="neighborhoodId"
              required
              defaultValue={admin.neighborhoodId ?? ""}
              className="field"
            >
              {neighborhoodOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate">
            Role
            <select name="role" defaultValue={admin.role} className="field">
              <option value="admin">Admin</option>
              <option value="board">Board</option>
            </select>
          </label>
        </div>
        <button type="submit" className="btn-primary self-start">
          Save changes
        </button>
      </form>

      <div className="card">
        <h2 className="font-semibold text-navy">Delete account</h2>
        <p className="mt-1 text-sm text-slate">
          This also deletes any announcements, events, and bulletin board
          posts {admin.name} created — residents keep everything else
          (RSVPs, reservations, etc.).
        </p>
        <form action={deleteAdmin.bind(null, id)} className="mt-4">
          <button
            type="submit"
            className="rounded-full border border-red-200 px-5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Delete account
          </button>
        </form>
      </div>
    </div>
  );
}
