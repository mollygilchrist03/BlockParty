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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Newsletter archive</h1>
        {boardOnlyRoles.includes(user.role) && (
          <Link href="/dashboard/newsletters/new" className="btn-primary">
            Upload newsletter
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-slate">No newsletters uploaded yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((newsletter) => (
            <li key={newsletter.id}>
              <a
                href={newsletter.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-link flex items-center justify-between"
              >
                <div>
                  <h2 className="font-semibold text-navy">{newsletter.title}</h2>
                  <p className="mt-1 text-sm text-slate">
                    {monthNames[newsletter.month - 1]} {newsletter.year}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-sage">
                  View PDF →
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
