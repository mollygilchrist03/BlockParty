import { desc } from "drizzle-orm";
import { db } from "@/db";
import { demoLoginEvents } from "@/db/schema";
import { requireOwner } from "@/lib/session";
import { timeAgo } from "@/lib/time-ago";
import { LiveTimeAgo } from "@/components/live-time-ago";

const roleLabels: Record<string, string> = {
  resident: "Resident",
  board: "Board",
  admin: "Admin",
  owner: "Owner",
};

export default async function DemoActivityPage() {
  await requireOwner();

  const rows = await db
    .select()
    .from(demoLoginEvents)
    .orderBy(desc(demoLoginEvents.createdAt))
    .limit(100);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <p className="eyebrow">Platform owner</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">Demo login activity</h1>
        <p className="mt-1 text-sm text-slate">
          Sign-ins using the published demo credentials, most recent first (last 100).
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-slate">No demo logins yet.</p>
      ) : (
        <ul className="list-card">
          {rows.map((event) => (
            <li key={event.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="font-medium text-navy">{event.email}</p>
                <p className="text-sm text-muted">{roleLabels[event.role] ?? event.role}</p>
              </div>
              <time className="shrink-0 text-xs text-muted">
                <LiveTimeAgo date={event.createdAt} initialText={timeAgo(event.createdAt)} />
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
