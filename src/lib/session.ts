import { auth } from "@/auth";
import { redirect } from "next/navigation";

const boardOnlyRoles = ["board", "admin"];

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
