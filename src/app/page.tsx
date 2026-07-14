import Image from "next/image";
import Link from "next/link";

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
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="BlockParty logo" width={40} height={40} />
          <span className="text-lg font-semibold text-navy">BlockParty</span>
        </div>
        <Link
          href="/login"
          className="rounded-full border border-slate/20 px-4 py-2 text-sm font-medium text-slate transition-colors hover:border-sage hover:text-sage"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-6 py-16 sm:px-10">
        <section className="flex flex-col items-center gap-6 text-center">
          <Image src="/logo.svg" alt="" width={96} height={96} priority />
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            Your neighborhood&apos;s digital gathering place.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-slate">
            Events, announcements, amenity reservations, and community
            updates — all in one place for residents and HOA boards.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-full bg-navy px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate"
            >
              Sign in to your community
            </Link>
          </div>
        </section>

        <section className="grid gap-10 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate/10 bg-white p-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-sage">
              For residents
            </h2>
            <ul className="flex flex-col gap-3">
              {residentFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-slate">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate/10 bg-white p-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-navy">
              For HOA boards & admins
            </h2>
            <ul className="flex flex-col gap-3">
              {boardFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-slate">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate/10 px-6 py-6 text-center text-sm text-slate/60 sm:px-10">
        BlockParty — built with Next.js, Neon Postgres & Drizzle ORM.
      </footer>
    </div>
  );
}
