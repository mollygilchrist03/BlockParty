import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { neighborhoodRequests } from "@/db/schema";
import { assertNotDemo, requireOwner } from "@/lib/session";
import { sendDenialEmail } from "@/lib/email";
import { SavedBanner } from "@/components/saved-banner";
import { DemoReadonlyBanner } from "@/components/demo-readonly-banner";

async function denyRequest(requestId: string) {
  "use server";

  const user = await requireOwner();
  assertNotDemo(user, "/dashboard/owner/requests");

  const [request] = await db
    .select()
    .from(neighborhoodRequests)
    .where(eq(neighborhoodRequests.id, requestId))
    .limit(1);
  if (!request || request.status !== "pending") {
    redirect("/dashboard/owner/requests");
  }

  await db
    .update(neighborhoodRequests)
    .set({ status: "denied" })
    .where(eq(neighborhoodRequests.id, requestId));

  await sendDenialEmail({
    to: request.requesterEmail,
    name: request.requesterName,
    neighborhoodName: request.neighborhoodName,
  });

  redirect("/dashboard/owner/requests?denied=1");
}

export default async function NeighborhoodRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string; error?: string }>;
}) {
  await requireOwner();
  const { denied, error } = await searchParams;

  const rows = await db
    .select()
    .from(neighborhoodRequests)
    .where(eq(neighborhoodRequests.status, "pending"))
    .orderBy(asc(neighborhoodRequests.createdAt));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <p className="eyebrow">Platform owner</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy">
          Neighborhood requests
        </h1>
      </div>

      <DemoReadonlyBanner error={error} />
      <SavedBanner message={denied === "1" ? "Request denied." : null} />

      {rows.length === 0 ? (
        <p className="text-slate">No pending requests.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((request) => (
            <li key={request.id} className="card flex flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-navy">{request.neighborhoodName}</h2>
                  {request.address && (
                    <p className="text-sm text-slate">{request.address}</p>
                  )}
                </div>
                <time className="shrink-0 text-xs text-muted">
                  {request.createdAt.toLocaleDateString()}
                </time>
              </div>
              <p className="text-sm text-slate">
                {request.requesterName} · {request.requesterEmail}
              </p>
              {request.message && (
                <p className="whitespace-pre-wrap text-sm text-slate">{request.message}</p>
              )}
              <div className="mt-2 flex items-center gap-3">
                <Link
                  href={`/dashboard/owner/requests/${request.id}`}
                  className="btn-primary"
                >
                  Approve
                </Link>
                <form action={denyRequest.bind(null, request.id)}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-muted hover:text-red-600"
                  >
                    Deny
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
