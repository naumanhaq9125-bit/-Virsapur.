import { cmsConfig } from "../../src/cms/config.mjs";
import { createSupabaseProvider } from "../../src/cms/providers/supabase.mjs";
import { handleError, json, productionCmsUnavailable, requireAdmin } from "../../api/_lib/http.js";

export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  try {
    if (request.method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405);
    await requireAdmin(request);
    const id = new URL(request.url).searchParams.get("id");
    const media = (await createSupabaseProvider().loadAll()).media?.find(item => item.id === id);
    if (!media?.storage?.derivativePaths?.[1]) return json({ ok: false, error: "Private media item not found." }, 404);
    const config = cmsConfig();
    const path = media.storage.derivativePaths[1];
    const response = await fetch(`${config.supabaseUrl}/storage/v1/object/sign/${config.privateStorageBucket}/${path}`, { method: "POST", headers: { apikey: config.supabaseSecretKey, authorization: `Bearer ${config.supabaseSecretKey}`, "content-type": "application/json" }, body: JSON.stringify({ expiresIn: 300 }) });
    const signed = await response.json();
    if (!response.ok) throw new Error(signed.message || "Could not create private preview URL.");
    return json({ ok: true, expiresIn: 300, url: `${config.supabaseUrl}/storage/v1${signed.signedURL}` });
  } catch (error) { return handleError(error); }
} };
