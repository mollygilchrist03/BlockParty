import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-background px-6 py-16 text-center">
      <p className="eyebrow">404</p>
      <h1 className="text-2xl font-semibold text-navy">Page not found</h1>
      <p className="max-w-sm text-slate">
        The page you&apos;re looking for doesn&apos;t exist, or you don&apos;t
        have access to it.
      </p>
      <Link href="/dashboard" className="btn-primary">
        Back to dashboard
      </Link>
    </main>
  );
}
