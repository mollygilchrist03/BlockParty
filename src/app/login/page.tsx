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
        <form action={login} className="card flex w-full flex-col gap-4">
          <h1 className="text-center text-xl font-semibold text-navy">
            Sign in
          </h1>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              Invalid email or password.
            </p>
          )}
          <label className="flex flex-col gap-1 text-sm text-slate">
            Email
            <input type="email" name="email" required className="field" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate">
            Password
            <input type="password" name="password" required className="field" />
          </label>
          <button type="submit" className="btn-primary mt-2">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
