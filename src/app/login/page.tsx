import Image from "next/image";
import Link from "next/link";
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

async function loginWithGoogle() {
  "use server";
  await signIn("google", { redirectTo: "/dashboard" });
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="" width={36} height={36} />
          <span className="text-lg font-semibold text-navy">BlockParty</span>
        </Link>
        <div className="card flex w-full flex-col gap-4">
          <h1 className="text-center text-xl font-semibold text-navy">
            Sign in
          </h1>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              Invalid email or password.
            </p>
          )}

          <form action={loginWithGoogle}>
            <button
              type="submit"
              className="btn-secondary flex w-full items-center justify-center gap-2"
            >
              <svg viewBox="0 0 18 18" className="h-4 w-4">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.68-3.87 2.68-6.62Z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18Z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33Z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted">
            <div className="h-px flex-1 bg-slate/15" />
            or sign in with email
            <div className="h-px flex-1 bg-slate/15" />
          </div>

          <form action={login} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-slate">
              Email
              <input type="email" name="email" required className="field" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate">
              Password
              <input type="password" name="password" required className="field" />
            </label>
            <button type="submit" className="btn-primary">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
