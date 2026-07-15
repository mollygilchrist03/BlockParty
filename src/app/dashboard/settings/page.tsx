import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { assertNotDemo, requireUser } from "@/lib/session";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

async function updateDirectoryOptIn(formData: FormData) {
  "use server";

  const user = await requireUser();
  assertNotDemo(user, "/dashboard/settings");
  const optIn = formData.get("directoryOptIn") === "on";

  await db
    .update(users)
    .set({ directoryOptIn: optIn })
    .where(eq(users.id, user.id));

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/directory");
  redirect("/dashboard/settings?saved=1");
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { saved, error } = await searchParams;

  const [me] = await db
    .select({ directoryOptIn: users.directoryOptIn })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">Settings</h1>

      <DemoReadonlyBanner error={error} />

      <div className="card">
        <h2 className="font-semibold text-navy">Community directory</h2>
        <p className="mt-1 text-sm text-slate">
          When enabled, your name and unit are visible to other residents on
          the{" "}
          <a href="/dashboard/directory" className="text-sage underline">
            directory page
          </a>
          .
        </p>
        <form action={updateDirectoryOptIn} className="mt-4">
          <label className="flex items-center gap-2 text-sm text-slate">
            <input
              type="checkbox"
              name="directoryOptIn"
              defaultChecked={me?.directoryOptIn ?? false}
              className="h-4 w-4 rounded border-slate/40 text-sage focus:ring-sage"
            />
            List me in the community directory
          </label>
          <div className="mt-4 flex items-center gap-3">
            <button type="submit" className="btn-primary">
              Save
            </button>
            {saved === "1" && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-sage">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
