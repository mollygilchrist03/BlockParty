import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { compare, hash } from "bcryptjs";
import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signOut } from "@/auth";
import { assertNotDemo, requireUser } from "@/lib/session";
import { uploadValidatedImage } from "@/lib/files";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";
import { SavedBanner } from "@/components/saved-banner";
import { Avatar } from "@/components/avatar";

async function updateProfile(formData: FormData) {
  "use server";

  const user = await requireUser();
  assertNotDemo(user, "/dashboard/settings");

  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const avatarFile = formData.get("avatar");

  if (!name || name.length > 255) {
    redirect("/dashboard/settings?error=invalid-profile");
  }

  let avatarUrl: string | undefined;
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const result = await uploadValidatedImage(avatarFile, `avatars/${user.id}`);
    if (result.error) {
      redirect(`/dashboard/settings?error=avatar-${result.error}`);
    }
    avatarUrl = result.url;
  }

  const [previous] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  await db
    .update(users)
    .set({ name, unit: unit || null, ...(avatarUrl ? { avatarUrl } : {}) })
    .where(eq(users.id, user.id));

  // Best-effort cleanup of the old picture — a stale blob left behind
  // isn't worth failing the request over.
  if (avatarUrl && previous?.avatarUrl) {
    await del(previous.avatarUrl).catch((err) => {
      console.error("[settings] failed to delete old avatar blob", err);
    });
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/directory");
  redirect("/dashboard/settings?saved=profile");
}

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
  redirect("/dashboard/settings?saved=directory");
}

async function changePassword(formData: FormData) {
  "use server";

  const user = await requireUser();
  assertNotDemo(user, "/dashboard/settings");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  const [me] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!me?.passwordHash) {
    redirect("/dashboard/settings?error=no-password");
  }
  if (!currentPassword || !(await compare(currentPassword, me.passwordHash))) {
    redirect("/dashboard/settings?error=wrong-password");
  }
  if (newPassword.length < 8) {
    redirect("/dashboard/settings?error=short-password");
  }

  await db
    .update(users)
    .set({ passwordHash: await hash(newPassword, 10) })
    .where(eq(users.id, user.id));

  redirect("/dashboard/settings?saved=password");
}

async function deleteAccount() {
  "use server";

  const user = await requireUser();
  assertNotDemo(user, "/dashboard/settings");

  if (user.role === "owner") {
    redirect("/dashboard/settings?error=cannot-delete-owner");
  }

  const [me] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  await db.delete(users).where(eq(users.id, user.id));

  if (me?.avatarUrl) {
    await del(me.avatarUrl).catch((err) => {
      console.error("[settings] failed to delete avatar blob for deleted account", err);
    });
  }

  await signOut({ redirectTo: "/" });
}

const errorMessages: Record<string, string> = {
  "invalid-profile": "Name is required.",
  "avatar-too-large": "That image is too large — 5MB max.",
  "avatar-invalid-type": "Profile pictures must be a JPEG, PNG, or WEBP image.",
  "avatar-upload-failed": "The image couldn't be uploaded. Please try again.",
  "no-password": "You sign in with Google, so there's no password to change here.",
  "wrong-password": "Current password is incorrect.",
  "short-password": "New password needs at least 8 characters.",
  "cannot-delete-owner": "The platform owner account can't be self-deleted.",
};

// Errors shown inline within their own card below, rather than in the
// page-level banner. "no-password" isn't included — it can only happen
// via a crafted request, since the UI hides the password form entirely
// for Google-only accounts, so it has no form context to attach to.
const passwordCardErrors = new Set(["wrong-password", "short-password"]);
const deleteCardErrors = new Set(["cannot-delete-owner"]);

const savedMessages: Record<string, string> = {
  profile: "Profile saved.",
  directory: "Saved.",
  password: "Password changed.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { saved, error } = await searchParams;

  const [me] = await db
    .select({
      name: users.name,
      unit: users.unit,
      avatarUrl: users.avatarUrl,
      directoryOptIn: users.directoryOptIn,
      hasPassword: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const errorMessage = error ? errorMessages[error] : null;
  const showTopLevelError =
    !!errorMessage && !passwordCardErrors.has(error ?? "") && !deleteCardErrors.has(error ?? "");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-semibold text-navy">Settings</h1>

      <DemoReadonlyBanner error={error} />
      <SavedBanner message={saved ? savedMessages[saved] : null} />
      {showTopLevelError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
      )}

      <div className="card">
        <h2 className="font-semibold text-navy">Profile</h2>
        <p className="mt-1 text-sm text-slate">
          Your picture, name, and unit as shown across BlockParty.
        </p>
        <form action={updateProfile} className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={me?.name ?? user.name ?? "Neighbor"} imageUrl={me?.avatarUrl} size="lg" />
            <label className="flex flex-col gap-1 text-sm text-slate">
              Profile picture
              <input
                type="file"
                name="avatar"
                accept="image/jpeg,image/png,image/webp"
                className="field file:mr-3 file:rounded-full file:border-0 file:bg-sage-light file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-sage"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm text-slate">
            Name
            <input
              type="text"
              name="name"
              required
              maxLength={255}
              defaultValue={me?.name ?? user.name ?? ""}
              className="field"
            />
          </label>
          {user.neighborhoodId && (
            <label className="flex flex-col gap-1 text-sm text-slate">
              Unit
              <input
                type="text"
                name="unit"
                maxLength={100}
                defaultValue={me?.unit ?? ""}
                placeholder="e.g. 12B"
                className="field"
              />
            </label>
          )}
          <button type="submit" className="btn-primary self-start">
            Save profile
          </button>
        </form>
      </div>

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
          <button type="submit" className="btn-primary mt-4">
            Save
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy">Password</h2>
        {me?.hasPassword ? (
          <form action={changePassword} className="mt-4 flex flex-col gap-4">
            {error && passwordCardErrors.has(error) && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessages[error]}</p>
            )}
            <label className="flex flex-col gap-1 text-sm text-slate">
              Current password
              <input type="password" name="currentPassword" required className="field" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate">
              New password
              <input type="password" name="newPassword" required minLength={8} className="field" />
            </label>
            <button type="submit" className="btn-primary self-start">
              Change password
            </button>
          </form>
        ) : (
          <p className="mt-1 text-sm text-slate">
            You sign in with Google — there&apos;s no password to manage here.
          </p>
        )}
      </div>

      {user.role !== "owner" && (
        <div className="card border-red-200">
          <h2 className="font-semibold text-red-600">Delete account</h2>
          <p className="mt-1 text-sm text-slate">
            Permanently deletes your account and everything tied to it —
            posts, RSVPs, and reservations. This can&apos;t be undone.
          </p>
          {error === "cannot-delete-owner" && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessages[error]}
            </p>
          )}
          <form action={deleteAccount} className="mt-4">
            <button
              type="submit"
              className="rounded-full border border-red-200 px-5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Delete my account
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
