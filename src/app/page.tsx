import Image from "next/image";
import Link from "next/link";

function CheckIcon({ tone = "sage" }: { tone?: "sage" | "light" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 ${tone === "sage" ? "text-sage" : "text-sage-light"}`}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const residentFeatures = [
  "Community calendar & event RSVPs",
  "Pool, trash & recycling schedules",
  "Neighborhood announcements",
  "Yard sale & lost-and-found board",
  "Amenity reservations (pool, clubhouse, courts)",
  "Newsletter archive",
];

const boardFeatures = [
  "Post announcements & manage events",
  "Track RSVPs & waitlists",
  "Moderate community posts",
  "Upload monthly newsletters",
  "Manage amenity availability",
  "Role-based resident directory",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <header className="border-b border-slate-900/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="BlockParty logo" width={36} height={36} />
            <span className="text-lg font-semibold text-navy">BlockParty</span>
          </div>
          <Link href="/login" className="btn-secondary">
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, rgba(47,111,79,0.10) 0%, rgba(47,111,79,0) 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-sage/10 blur-3xl"
          />
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center sm:px-10 sm:py-28">
            <Image src="/logo.svg" alt="" width={72} height={72} priority />
            <p className="eyebrow">A neighborhood, online</p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
              Your neighborhood&apos;s digital gathering place.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate">
              Events, announcements, amenity reservations, and community
              updates — all in one place for residents and HOA boards.
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="btn-primary px-6 py-3 text-base">
                Sign in to your community
              </Link>
              <a href="#features" className="btn-secondary px-6 py-3 text-base">
                See what&apos;s included
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-5xl px-6 pb-24 sm:px-10">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="card">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-sage">
                For residents
              </h2>
              <ul className="flex flex-col gap-3">
                {residentFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-slate">
                    <CheckIcon />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-navy p-6 text-white shadow-sm shadow-slate-900/10">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-sage-light">
                For HOA boards &amp; admins
              </h2>
              <ul className="flex flex-col gap-3">
                {boardFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-slate-200">
                    <CheckIcon tone="light" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900/5 px-6 py-6 text-center text-sm text-muted sm:px-10">
        BlockParty — built with Next.js, Neon Postgres &amp; Drizzle ORM.
      </footer>
    </div>
  );
}
