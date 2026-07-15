import { asc } from "drizzle-orm";
import { db } from "@/db";
import { neighborhoods } from "@/db/schema";

export const boardOnlyRoles = ["board", "admin", "owner"];
export const ownerOnlyRoles = ["owner"];

/**
 * Options for the neighborhood picker shown on board-only create forms
 * when the acting user is owner (no neighborhood of their own). Empty for
 * board/admin, who never see the picker.
 */
export async function neighborhoodOptionsFor(user: { neighborhoodId: string | null }) {
  if (user.neighborhoodId) return [];
  return db
    .select({ id: neighborhoods.id, name: neighborhoods.name })
    .from(neighborhoods)
    .orderBy(asc(neighborhoods.name));
}

/**
 * Board/admin act on their own neighborhood implicitly. Owner isn't tied
 * to one, so board-only create forms show a neighborhood picker just for
 * them and this resolves which one they picked.
 */
export function resolveActingNeighborhoodId(
  user: { neighborhoodId: string | null },
  formData: FormData,
): string | null {
  if (user.neighborhoodId) return user.neighborhoodId;
  const picked = String(formData.get("neighborhoodId") ?? "").trim();
  return picked || null;
}

/**
 * Where to send a board-only create form after success. Board/admin land
 * on the resource's own list page; owner's list pages redirect away (no
 * single neighborhood to show), so send them to the admin hub instead.
 */
export function postCreateRedirectPath(
  user: { neighborhoodId: string | null },
  listPath: string,
): string {
  return user.neighborhoodId ? listPath : "/dashboard/admin";
}
