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
  if (!boardOnlyRoles.includes(user.role)) redirect("/dashboard");
  return user;
}

export async function requireOwner() {
  const user = await requireUser();
  if (!ownerOnlyRoles.includes(user.role)) redirect("/dashboard");
  return user;
}
