import { createHash } from "node:crypto";
import { createSupabaseProvider } from "../src/cms/providers/supabase.mjs";
import { handleError, json, productionCmsUnavailable, requireAdmin } from "./_lib/http.js";
const collections = ["programmes","stories","projects","events","people","testimonials","media"];
export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  try {
    if (request.method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405);
    await requireAdmin(request, ["owner"]);
    const content = await createSupabaseProvider().loadAll();
    const records = collections.flatMap(collection => (content[collection] || []).map(data => ({ collection, id: data.id, slug: data.slug || null, status: data.status || "draft", data })));
    const singletons = { site: content.site, homepage: content.homepage };
    const canonical = JSON.stringify({ singletons, records });
    const bundle = { format: "virsapur-content-export/v1", exportedAt: new Date().toISOString(), source: "production-cms", excludes: ["demo fixtures", "authentication data", "secrets", "mock orders"], counts: { singletons: 2, records: records.length, byCollection: Object.fromEntries(collections.map(name => [name, content[name]?.length || 0])) }, checksum: `sha256:${createHash("sha256").update(canonical).digest("hex")}`, singletons, records };
    return new Response(JSON.stringify(bundle, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="virsapur-production-content-${new Date().toISOString().slice(0,10)}.json"`, "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
  } catch (error) { return handleError(error); }
} };
