import { eq } from "drizzle-orm";
import { db } from "@/db";
import { neighborhoods, users } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { boardOnlyRoles, ownerOnlyRoles } from "@/lib/roles";
import { DashboardNav } from "@/components/dashboard-nav";

const roleLabels: Record<string, string> = {
  owner: "Platform owner",
  admin: "Admin",
  board: "Board member",
  resident: "Resident",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const isBoard = boardOnlyRoles.includes(user.role);
  const isOwner = ownerOnlyRoles.includes(user.role);

  const [me] = await db
    .select({ unit: users.unit, avatarUrl: users.avatarUrl, neighborhoodName: neighborhoods.name })
    .from(users)
    .leftJoin(neighborhoods, eq(users.neighborhoodId, neighborhoods.id))
    .where(eq(users.id, user.id))
    .limit(1);

  const userSubtitle = me?.unit || me?.neighborhoodName || roleLabels[user.role] || "";

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background xl:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <DashboardNav
        isBoard={isBoard}
        isOwner={isOwner}
        userName={user.name ?? "Neighbor"}
        userSubtitle={userSubtitle}
        avatarUrl={me?.avatarUrl}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
