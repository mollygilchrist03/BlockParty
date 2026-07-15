import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { neighborhoodRequests } from "@/db/schema";
import { SavedBanner } from "@/components/saved-banner";

const REQUEST_RATE_LIMIT = 3;
const REQUEST_RATE_WINDOW_MS = 24 * 60 * 60 * 1000;
// Matches the varchar(255) columns on neighborhood_requests — validate
// before insert so an oversized field throws a friendly redirect instead
// of an unhandled Postgres error.
const MAX_SHORT_FIELD = 255;
const MAX_MESSAGE = 2000;

async function requestNeighborhood(formData: FormData) {
  "use server";

  // Honeypot — a field real visitors never see or fill, but bots
  // filling every form field on a page often do. Pretend success either
  // way so it doesn't tip them off.
  if (String(formData.get("company") ?? "").trim()) {
    console.warn("[neighborhood-request] honeypot triggered");
    redirect("/?requested=1#request");
  }

  const neighborhoodName = String(formData.get("neighborhoodName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const requesterName = String(formData.get("requesterName") ?? "").trim();
  const requesterEmail = String(formData.get("requesterEmail") ?? "").trim().toLowerCase();
  const message = String(formData.get("message") ?? "").trim();

  if (
    !neighborhoodName ||
    !requesterName ||
    !requesterEmail ||
    !requesterEmail.includes("@") ||
    neighborhoodName.length > MAX_SHORT_FIELD ||
    address.length > MAX_SHORT_FIELD ||
    requesterName.length > MAX_SHORT_FIELD ||
    requesterEmail.length > MAX_SHORT_FIELD ||
    message.length > MAX_MESSAGE
  ) {
    redirect("/?requestError=invalid#request");
  }

  const [{ recentCount }] = await db
    .select({ recentCount: count() })
    .from(neighborhoodRequests)
    .where(
      and(
        eq(neighborhoodRequests.requesterEmail, requesterEmail),
        gte(neighborhoodRequests.createdAt, new Date(Date.now() - REQUEST_RATE_WINDOW_MS)),
      ),
    );

  if (recentCount >= REQUEST_RATE_LIMIT) {
    console.warn(`[neighborhood-request] rate limit hit for ${requesterEmail}`);
    redirect("/?requestError=rate-limited#request");
  }

  try {
    await db.insert(neighborhoodRequests).values({
      neighborhoodName,
      address: address || null,
      requesterName,
      requesterEmail,
      message: message || null,
    });
  } catch (err) {
    console.error("[neighborhood-request] insert failed", err);
    redirect("/?requestError=failed#request");
  }

  redirect("/?requested=1#request");
}

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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string; requestError?: string }>;
}) {
  const { requested, requestError } = await searchParams;

  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <header className="border-b border-slate-900/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="BlockParty logo" width={36} height={36} />
            <span className="text-lg font-semibold text-navy">BlockParty</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#request"
              className="hidden text-sm font-medium text-slate hover:text-sage sm:inline"
            >
              HOA president?
            </a>
            <Link href="/login" className="btn-secondary">
              Sign in
            </Link>
          </div>
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

        <section id="request" className="mx-auto w-full max-w-2xl px-6 pb-24 sm:px-10">
          <div className="card flex flex-col gap-4">
            <div>
              <p className="eyebrow">HOA presidents &amp; board members</p>
              <h2 className="mt-1 text-2xl font-semibold text-navy">
                Bring BlockParty to your neighborhood
              </h2>
              <p className="mt-2 text-slate">
                Tell us about your community and we&apos;ll set up your
                neighborhood and send you board login credentials.
              </p>
            </div>

            <SavedBanner
              message={
                requested === "1"
                  ? "Thanks! We'll be in touch soon with your login details."
                  : null
              }
            />
            {requestError === "invalid" && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                Fill in your name, email, and neighborhood name.
              </p>
            )}
            {requestError === "rate-limited" && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                Too many requests from that email recently — try again later.
              </p>
            )}
            {requestError === "failed" && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                Something went wrong submitting that. Please try again.
              </p>
            )}

            <form action={requestNeighborhood} className="flex flex-col gap-4">
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              <label className="flex flex-col gap-1 text-sm text-slate">
                Neighborhood name
                <input
                  type="text"
                  name="neighborhoodName"
                  required
                  maxLength={255}
                  placeholder="e.g. Sunset Ridge"
                  className="field"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate">
                Address / area (optional)
                <input type="text" name="address" maxLength={255} className="field" />
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-slate">
                  Your name
                  <input type="text" name="requesterName" required maxLength={255} className="field" />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate">
                  Your email
                  <input type="email" name="requesterEmail" required maxLength={255} className="field" />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm text-slate">
                Anything else? (optional)
                <textarea
                  name="message"
                  rows={3}
                  maxLength={2000}
                  placeholder="Rough number of homes, HOA name, etc."
                  className="field"
                />
              </label>
              <button type="submit" className="btn-primary self-start">
                Request access
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900/5 px-6 py-10 sm:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="" width={22} height={22} />
              <span className="text-sm font-semibold text-navy">BlockParty</span>
            </div>
            <p className="max-w-xs text-sm text-muted">
              A neighborhood/HOA community platform, built as a portfolio
              project.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate sm:justify-end">
            <a href="#features" className="hover:text-sage">
              Features
            </a>
            <a href="#request" className="hover:text-sage">
              Request access
            </a>
            <Link href="/login" className="hover:text-sage">
              Sign in
            </Link>
            <a
              href="https://github.com/mollygilchrist03/BlockParty"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sage"
            >
              GitHub<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </nav>
        </div>

        <p className="mx-auto mt-8 w-full max-w-5xl border-t border-slate-900/5 pt-6 text-center text-sm text-muted">
          {`© ${new Date().getFullYear()} BlockParty. Built with Next.js, Neon Postgres & Drizzle ORM.`}
        </p>
      </footer>
    </div>
  );
}
