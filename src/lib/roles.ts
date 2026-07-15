export const boardOnlyRoles = ["board", "admin", "owner"];
export const ownerOnlyRoles = ["owner"];

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
