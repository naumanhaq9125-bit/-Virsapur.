import { cmsConfig } from "./config.mjs";

async function signedUrl(config, path, expiresIn) {
  const response = await fetch(`${config.supabaseUrl}/storage/v1/object/sign/${config.privateStorageBucket}/${path}`, { method: "POST", headers: { apikey: config.supabaseSecretKey, authorization: `Bearer ${config.supabaseSecretKey}`, "content-type": "application/json" }, body: JSON.stringify({ expiresIn }) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Could not sign private media (${response.status}).`);
  return `${config.supabaseUrl}/storage/v1${payload.signedURL}`;
}

export async function hydratePrivateMediaPreviews(content, expiresIn = 300) {
  const config = cmsConfig();
  const items = content.media || [];
  await Promise.all(items.map(async item => {
    if (item.storage?.visibility !== "private" || !item.storage.derivativePaths?.length) return;
    const [small, large = small] = item.storage.derivativePaths;
    const [webp640, webp1280] = await Promise.all([signedUrl(config, small, expiresIn), signedUrl(config, large, expiresIn)]);
    item.derivatives = { webp640, webp1280 };
    item.previewExpiresIn = expiresIn;
  }));
  return content;
}

export function resolveMediaReferences(value, mediaItems) {
  const byId = new Map((mediaItems || []).map(item => [item.id, item]));
  const visit = item => {
    if (!item || typeof item !== "object") return item;
    if (item.mediaId && byId.has(item.mediaId)) Object.assign(item, byId.get(item.mediaId));
    for (const child of Array.isArray(item) ? item : Object.values(item)) visit(child);
    return item;
  };
  return visit(value);
}
