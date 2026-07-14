import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

async function login(formData: FormData) {
  "use server";

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid-credentials");
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6">
      <form
        action={login}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-slate/10 bg-white p-8"
      >
        <h1 className="text-center text-xl font-semibold text-navy">
          Sign in to BlockParty
        </h1>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            Invalid email or password.
          </p>
        )}
        <label className="flex flex-col gap-1 text-sm text-slate">
          Email
          <input
            type="email"
            name="email"
            required
            className="rounded-lg border border-slate/20 px-3 py-2 text-navy outline-none focus:border-sage"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate">
          Password
          <input
            type="password"
            name="password"
            required
            className="rounded-lg border border-slate/20 px-3 py-2 text-navy outline-none focus:border-sage"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-full bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
