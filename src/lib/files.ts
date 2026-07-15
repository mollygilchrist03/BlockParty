import { put } from "@vercel/blob";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ImageUploadResult = { url: string; error?: undefined } | { url?: undefined; error: string };

/**
 * Validates and uploads an image (real file-signature check, size cap,
 * sanitized filename) to Vercel Blob. Shared by every "optional photo"
 * upload in the app (events, bulletin posts, amenities, avatars) so the
 * same hardening doesn't get re-implemented — or forgotten — per form.
 */
export async function uploadValidatedImage(
  file: File,
  pathPrefix: string,
): Promise<ImageUploadResult> {
  if (file.size === 0) return { error: "empty" };
  if (file.size > MAX_IMAGE_BYTES) return { error: "too-large" };

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const contentType = detectImageType(header);
  if (!contentType) return { error: "invalid-type" };

  try {
    const blob = await put(`${pathPrefix}/${Date.now()}-${safeFileName(file.name, "image")}`, file, {
      access: "public",
      contentType,
    });
    return { url: blob.url };
  } catch (err) {
    console.error(`[upload] failed for ${pathPrefix}`, err);
    return { error: "upload-failed" };
  }
}

export function safeFileName(name: string, fallback = "file") {
  const base = name.split(/[/\\]/).pop() ?? fallback;
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || fallback;
}

/**
 * Sniffs the actual file signature rather than trusting the client-supplied
 * MIME type, so a spoofed extension/type can't get an arbitrary file stored
 * (and served back, publicly) as an image.
 */
export function detectImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}
