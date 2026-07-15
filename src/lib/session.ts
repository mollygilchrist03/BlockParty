import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { boardOnlyRoles, ownerOnlyRoles } from "./roles";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireBoard() {
  const user = await requireUser();
  if (!boardOnlyRoles.includes(user.role)) {
    console.warn(`[access-control] denied board-only route to ${user.email} (role: ${user.role})`);
    redirect("/dashboard");
  }
  return user;
}

export async function requireOwner() {
  const user = await requireUser();
  if (!ownerOnlyRoles.includes(user.role)) {
    console.warn(`[access-control] denied owner-only route to ${user.email} (role: ${user.role})`);
    redirect("/dashboard");
  }
  return user;
}

/**
 * For pages scoped to a single neighborhood's day-to-day content
 * (announcements, events, etc). The owner role isn't tied to any
 * neighborhood, so `neighborhoodId` would otherwise be null here —
 * redirect rather than let a `null` flow into a uuid query param.
 */
export async function requireNeighborhoodUser() {
  const user = await requireUser();
  const { neighborhoodId } = user;
  if (!neighborhoodId) redirect("/dashboard/owner");
  return { ...user, neighborhoodId };
}

/**
 * The credentials published in the README (admin/resident/owner demo
 * accounts) are publicly known, so anyone can sign in as them. Call this
 * at the top of every mutating Server Action to block writes from those
 * accounts while still letting them browse everything.
 */
export function assertNotDemo(user: { isDemo: boolean; email?: string | null }, redirectTo: string) {
  if (user.isDemo) {
    console.warn(`[demo-lockdown] blocked write from ${user.email ?? "demo account"} at ${redirectTo}`);
    redirect(`${redirectTo}?error=demo-readonly`);
  }
}
