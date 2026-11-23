import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { cmsConfig } from "./config.mjs";

function privateMediaObjects(value, found = new Map()) {
  if (!value || typeof value !== "object") return found;
  if (value.storage?.visibility === "private" && value.storage?.derivativePaths?.length) found.set(value.id || value.storage.derivativePaths.join("|"), value);
  for (const child of Array.isArray(value) ? value : Object.values(value)) privateMediaObjects(child, found);
  return found;
}
async function download(config, path) {
  const response = await fetch(`${config.supabaseUrl}/storage/v1/object/${config.privateStorageBucket}/${path}`, { headers: { apikey: config.supabaseSecretKey, authorization: `Bearer ${config.supabaseSecretKey}` } });
  if (!response.ok) throw new Error(`Private media build download failed (${response.status}) for ${path}.`);
  return Buffer.from(await response.arrayBuffer());
}

export async function materializePrivateMedia(content, outputRoot) {
  const items = [...privateMediaObjects(content).values()];
  if (!items.length) return;
  const config = cmsConfig();
  for (const item of items) {
    const [smallPath, largePath = smallPath] = item.storage.derivativePaths;
    const safeId = String(item.id || "media").replace(/[^a-zA-Z0-9_-]/g, "-");
    const smallOut = `assets/cms/${safeId}-640.webp`;
    const largeOut = `assets/cms/${safeId}-1280.webp`;
    await mkdir(dirname(join(outputRoot, smallOut)), { recursive: true });
    await Promise.all([writeFile(join(outputRoot, smallOut), await download(config, smallPath)), writeFile(join(outputRoot, largeOut), await download(config, largePath))]);
    item.src = largeOut;
    item.derivatives = { webp640: smallOut, webp1280: largeOut };
    item.storage = { ...item.storage, bundled: true };
  }
}
