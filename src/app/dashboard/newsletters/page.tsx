import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { newsletters } from "@/db/schema";
import { requireNeighborhoodUser } from "@/lib/session";
import { boardOnlyRoles } from "@/lib/roles";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function NewslettersPage() {
  const user = await requireNeighborhoodUser();

  const rows = await db
    .select()
    .from(newsletters)
    .where(eq(newsletters.neighborhoodId, user.neighborhoodId))
    .orderBy(desc(newsletters.year), desc(newsletters.month));

  const [latest, ...past] = rows;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-navy">Newsletters</h1>
          {boardOnlyRoles.includes(user.role) && (
            <Link href="/dashboard/newsletters/new" className="btn-primary">
              Upload newsletter
            </Link>
          )}
        </div>
        <p className="mt-1 text-sm text-slate">Stay up to date with our community.</p>
      </div>

      {!latest ? (
        <p className="text-slate">No newsletters uploaded yet.</p>
      ) : (
        <>
          <div className="card overflow-hidden !p-0">
            <div className="flex h-40 items-center justify-center bg-sage-light text-sage sm:h-48">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16">
                <path d="M4 4h13a2 2 0 0 1 2 2v13a1 1 0 0 1-1.55.83L14 18" />
                <path d="M4 4v14a2 2 0 0 0 2 2h10" />
                <path d="M7 8h8M7 12h8M7 16h4" />
              </svg>
            </div>
            <div className="p-5">
              <p className="eyebrow">
                {monthNames[latest.month - 1]} {latest.year}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-navy">{latest.title}</h2>
              <a
                href={latest.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-4 inline-block"
              >
                Read Newsletter
              </a>
            </div>
          </div>

          {past.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold text-navy">Past newsletters</h2>
              <ul className="list-card">
                {past.map((newsletter) => (
                  <li key={newsletter.id}>
                    <a
                      href={newsletter.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-sage-light/40"
                    >
                      <div>
                        <p className="font-medium text-navy">{newsletter.title}</p>
                        <p className="text-sm text-muted">
                          {monthNames[newsletter.month - 1]} {newsletter.year}
                        </p>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-muted">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
