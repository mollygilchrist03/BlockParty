import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { neighborhoods, users } from "@/db/schema";
import { assertNotDemo, requireOwner } from "@/lib/session";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

async function createAdmin(formData: FormData) {
  "use server";

  const user = await requireOwner();
  assertNotDemo(user, "/dashboard/owner/admins/new");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const neighborhoodId = String(formData.get("neighborhoodId") ?? "");
  const role = String(formData.get("role") ?? "admin");

  const validRole = (["board", "admin"] as const).includes(
    role as "board" | "admin",
  );

  if (!name || !email || password.length < 8 || !neighborhoodId || !validRole) {
    redirect("/dashboard/owner/admins/new?error=invalid");
  }

  const passwordHash = await hash(password, 10);

  try {
    await db.insert(users).values({
      neighborhoodId,
      name,
      email,
      passwordHash,
      role: role as "board" | "admin",
    });
  } catch {
    redirect("/dashboard/owner/admins/new?error=duplicate");
  }

  redirect("/dashboard/owner?created=admin");
}

export default async function NewAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOwner();
  const { error } = await searchParams;

  const neighborhoodOptions = await db
    .select({ id: neighborhoods.id, name: neighborhoods.name })
    .from(neighborhoods)
    .orderBy(asc(neighborhoods.name));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <p className="eyebrow">Platform owner</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">New HOA admin</h1>
      </div>
      <form action={createAdmin} className="card flex flex-col gap-4">
        <DemoReadonlyBanner error={error} />
        {error === "duplicate" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            An account with that email already exists.
          </p>
        )}
        {error === "invalid" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            Fill in every field — password needs at least 8 characters.
          </p>
        )}
        <label className="flex flex-col gap-1 text-sm text-slate">
          Name
          <input type="text" name="name" required className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Email
          <input type="email" name="email" required className="field" />
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
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate">
            Neighborhood
            {neighborhoodOptions.length === 0 ? (
              <p className="text-sm text-red-600">
                Create a neighborhood first.
              </p>
            ) : (
              <select name="neighborhoodId" required className="field">
                {neighborhoodOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate">
            Role
            <select name="role" defaultValue="admin" className="field">
              <option value="admin">Admin</option>
              <option value="board">Board</option>
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={neighborhoodOptions.length === 0}
          className="btn-primary self-start disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create account
        </button>
      </form>
    </div>
  );
}
