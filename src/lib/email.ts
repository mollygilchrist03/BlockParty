import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "BlockParty <onboarding@resend.dev>";

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

// These land in an HTML email body built from a template literal — escape
// anything that came from user input (a public, unauthenticated form) so
// it can't inject markup into the recipient's inbox.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Notifies the site owner of a new neighborhood request. The recipient
 * is always the owner's own address, so — unlike sendApprovalEmail/
 * sendDenialEmail — this isn't affected by Resend's sandbox restriction
 * (no verified domain yet only allows sending to the account's own
 * email), since that's exactly who this always sends to.
 */
export async function notifyOwnerOfNewRequest(request: {
  neighborhoodName: string;
  address: string | null;
  requesterName: string;
  requesterEmail: string;
  message: string | null;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set, skipping owner notification");
    return;
  }

  const to = process.env.OWNER_NOTIFICATION_EMAIL || process.env.OWNER_EMAIL;
  if (!to) {
    console.warn("[email] no OWNER_NOTIFICATION_EMAIL or OWNER_EMAIL set, skipping owner notification");
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: request.requesterEmail,
      subject: `New neighborhood request: ${request.neighborhoodName}`,
      html: `
        <p>A new neighborhood request came in on BlockParty:</p>
        <p>
          <strong>Neighborhood:</strong> ${escapeHtml(request.neighborhoodName)}<br>
          <strong>Address:</strong> ${escapeHtml(request.address ?? "(not provided)")}<br>
          <strong>Requested by:</strong> ${escapeHtml(request.requesterName)} (${escapeHtml(request.requesterEmail)})<br>
          <strong>Message:</strong> ${escapeHtml(request.message ?? "(none)")}
        </p>
        <p><a href="${siteUrl()}/dashboard/owner/requests">Review it</a> — this email's reply-to is set to the requester, so you can just hit reply.</p>
      `,
    });
    if (error) {
      console.error("[email] owner notification rejected by Resend", error);
    }
  } catch (err) {
    console.error("[email] owner notification failed", err);
  }
}

/**
 * Emails a newly-approved HOA admin their login link and temporary
 * password. Best-effort — the neighborhood/admin account is already
 * created by the time this runs, so a failed email doesn't undo that.
 */
export async function sendApprovalEmail({
  to,
  name,
  neighborhoodName,
  password,
}: {
  to: string;
  name: string;
  neighborhoodName: string;
  password: string;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set, skipping approval email");
    return;
  }

  const loginUrl = `${siteUrl()}/login`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${neighborhoodName} is ready on BlockParty`,
      html: `
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your neighborhood <strong>${escapeHtml(neighborhoodName)}</strong> is set up on BlockParty, and you've been added as an HOA admin.</p>
        <p>
          <strong>Sign in:</strong> <a href="${loginUrl}">${loginUrl}</a><br>
          <strong>Email:</strong> ${escapeHtml(to)}<br>
          <strong>Temporary password:</strong> ${escapeHtml(password)}
        </p>
        <p>We'd recommend changing your password after signing in, from Settings.</p>
      `,
    });
    // The SDK returns { error } for API-level rejections (e.g. sandbox
    // mode restrictions) rather than throwing — a bare try/catch misses
    // these entirely.
    if (error) {
      console.error("[email] approval email rejected by Resend", error);
    }
  } catch (err) {
    console.error("[email] approval email failed", err);
  }
}

/**
 * Emails a requester that their neighborhood request wasn't approved.
 */
export async function sendDenialEmail({
  to,
  name,
  neighborhoodName,
}: {
  to: string;
  name: string;
  neighborhoodName: string;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set, skipping denial email");
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Update on your BlockParty request",
      html: `
        <p>Hi ${escapeHtml(name)},</p>
        <p>Thanks for your interest in bringing BlockParty to ${escapeHtml(neighborhoodName)}. We're not able to move forward with this request right now.</p>
        <p>If you have questions, feel free to reply to this email.</p>
      `,
    });
    if (error) {
      console.error("[email] denial email rejected by Resend", error);
    }
  } catch (err) {
    console.error("[email] denial email failed", err);
  }
}
