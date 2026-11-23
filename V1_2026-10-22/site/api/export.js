import { createContentExport } from "../backend/content-contract.mjs";
import { createSupabaseProvider } from "../src/cms/providers/supabase.mjs";
import { handleError, json, productionCmsUnavailable, requireAdmin } from "./_lib/http.js";
export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  try {
    if (request.method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405);
    await requireAdmin(request, ["owner"]);
    const content = await createSupabaseProvider().loadAll();
    const bundle = createContentExport(content, { source: "production-cms" });
    return new Response(JSON.stringify(bundle, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="virsapur-production-content-${new Date().toISOString().slice(0,10)}.json"`, "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
  } catch (error) { return handleError(error); }
} };
