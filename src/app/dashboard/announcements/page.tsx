import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { announcementCategoryEnum, announcements, users } from "@/db/schema";
import { requireNeighborhoodUser } from "@/lib/session";
import { boardOnlyRoles } from "@/lib/roles";
import { timeAgo } from "@/lib/time-ago";

const categoryMeta: Record<
  (typeof announcementCategoryEnum.enumValues)[number],
  { label: string; badge: string; icon: React.ReactNode }
> = {
  urgent: {
    label: "Urgent",
    badge: "bg-red-50 text-red-700",
    icon: (
      <>
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </>
    ),
  },
  general: {
    label: "General",
    badge: "bg-sage-light text-sage",
    icon: (
      <>
        <path d="M3 11v2a2 2 0 0 0 2 2h1l3 5V4L6 9H5a2 2 0 0 0-2 2Z" />
        <path d="M14 8a4 4 0 0 1 0 8" />
      </>
    ),
  },
  maintenance: {
    label: "Maintenance",
    badge: "bg-amber-50 text-amber-700",
    icon: (
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L2 19l3 3 7.3-7.3a4 4 0 0 0 5.4-5.4L14.3 12 12 9.7Z" />
    ),
  },
};

const categories = announcementCategoryEnum.enumValues.map((value) => ({
  value,
  ...categoryMeta[value],
}));

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const user = await requireNeighborhoodUser();
  const { category } = await searchParams;
  const activeCategory = announcementCategoryEnum.enumValues.find((c) => c === category);

  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      category: announcements.category,
      createdAt: announcements.createdAt,
      authorName: users.name,
    })
    .from(announcements)
    .innerJoin(users, eq(announcements.authorId, users.id))
    .where(
      activeCategory
        ? and(eq(announcements.neighborhoodId, user.neighborhoodId), eq(announcements.category, activeCategory))
        : eq(announcements.neighborhoodId, user.neighborhoodId),
    )
    .orderBy(desc(announcements.createdAt));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Announcements</h1>
        {boardOnlyRoles.includes(user.role) && (
          <Link href="/dashboard/announcements/new" className="btn-primary">
            + New Announcement
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/dashboard/announcements"
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            !activeCategory
              ? "bg-navy text-white"
              : "border border-slate/20 bg-white text-slate hover:border-sage hover:text-sage"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.value}
            href={`/dashboard/announcements?category=${c.value}`}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              activeCategory === c.value
                ? "bg-navy text-white"
                : "border border-slate/20 bg-white text-slate hover:border-sage hover:text-sage"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-slate">No announcements yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((announcement) => {
            const meta = categoryMeta[announcement.category];
            return (
              <li key={announcement.id} className="card">
                <div className="flex items-start gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.badge}`}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      {meta.icon}
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </div>
                    <h2 className="mt-1.5 font-semibold text-navy">{announcement.title}</h2>
                    <p className="mt-1 whitespace-pre-wrap text-slate">{announcement.body}</p>
                    <p className="mt-3 text-xs text-muted">
                      {timeAgo(announcement.createdAt)} · {announcement.authorName}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
