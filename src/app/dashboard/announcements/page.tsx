import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { announcements, users } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { boardOnlyRoles } from "@/lib/roles";

export default async function AnnouncementsPage() {
  const user = await requireUser();

  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      createdAt: announcements.createdAt,
      authorName: users.name,
    })
    .from(announcements)
    .innerJoin(users, eq(announcements.authorId, users.id))
    .where(eq(announcements.neighborhoodId, user.neighborhoodId ?? ""))
    .orderBy(desc(announcements.createdAt));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Announcements</h1>
        {boardOnlyRoles.includes(user.role) && (
          <Link href="/dashboard/announcements/new" className="btn-primary">
            New announcement
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-slate">No announcements yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((announcement) => (
            <li key={announcement.id} className="card">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-semibold text-navy">{announcement.title}</h2>
                <time className="shrink-0 text-xs text-muted">
                  {announcement.createdAt.toLocaleDateString()}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-slate">
                {announcement.body}
              </p>
              <p className="mt-3 text-xs text-muted">
                Posted by {announcement.authorName}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
