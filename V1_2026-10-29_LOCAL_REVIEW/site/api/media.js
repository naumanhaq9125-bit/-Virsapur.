import { randomUUID } from "node:crypto";
import { cmsConfig } from "../src/cms/config.mjs";
import { createSupabaseProvider } from "../src/cms/providers/supabase.mjs";
import { enforceRateLimit, handleError, json, productionCmsUnavailable, requireAdmin, requireMutationProtection } from "./_lib/http.js";

const allowed = new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"]]);

async function upload(config, path, bytes, contentType) {
  const response = await fetch(`${config.supabaseUrl}/storage/v1/object/${config.privateStorageBucket}/${path}`, { method: "POST", headers: { apikey: config.supabaseSecretKey, authorization: `Bearer ${config.supabaseSecretKey}`, "content-type": contentType, "cache-control": "private, max-age=0", "x-upsert": "false" }, body: bytes });
  if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.message || `Storage upload failed (${response.status}).`); }
}

export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  try {
    if (request.method !== "POST") return json({ ok: false, error: "Media deletion is disabled in Admin; archive references and use the documented recovery procedure." }, 405);
    requireMutationProtection(request);
    await enforceRateLimit(request, "media", 30, 3600);
    const session = await requireAdmin(request);
    const { default: sharp } = await import("sharp");
    const payload = await request.json();
    const mime = String(payload.mime || "").toLowerCase();
    const extension = allowed.get(mime);
    if (!extension) return json({ ok: false, error: "Upload a JPG, PNG, or WebP image." }, 415);
    const bytes = Buffer.from(String(payload.data || "").replace(/^data:[^,]+,/, ""), "base64");
    if (!bytes.length || bytes.length > 12_000_000) return json({ ok: false, error: "Image is empty or larger than 12 MB." }, 413);
    const image = sharp(bytes).rotate();
    const meta = await image.metadata();
    if (!meta.width || !meta.height) return json({ ok: false, error: "Image dimensions could not be read." }, 422);
    const id = `media-${randomUUID()}`;
    const originalPath = `original/${id}.${extension}`;
    const derivative640 = `derived/${id}-640.webp`;
    const derivative1280 = `derived/${id}-1280.webp`;
    const small = await image.clone().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const large = await image.clone().resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
    const config = cmsConfig();
    await Promise.all([upload(config, originalPath, bytes, mime), upload(config, derivative640, small, "image/webp"), upload(config, derivative1280, large, "image/webp")]);
    const item = { id, type: "image", status: "draft", src: null, derivatives: null, storage: { visibility: "private", bucket: config.privateStorageBucket, originalPath, derivativePaths: [derivative640, derivative1280] }, width: meta.width, height: meta.height, alt: payload.alt || "", caption: payload.caption || "", credit: payload.credit || "", focalX: Number(payload.focalX ?? 50), focalY: Number(payload.focalY ?? 50), createdAt: new Date().toISOString(), createdBy: session.user.id };
    const provider = createSupabaseProvider();
    const content = await provider.loadAll();
    await provider.save("media", [item, ...(content.media || [])], session.user.id);
    return json({ ok: true, item }, 201);
  } catch (error) { return handleError(error); }
} };
