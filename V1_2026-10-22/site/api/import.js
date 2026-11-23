import { createSupabaseProvider } from "../src/cms/providers/supabase.mjs";
import { validateCollection, validateSingleton } from "../src/cms/validation.mjs";
import { enforceRateLimit, handleError, json, productionCmsUnavailable, requireAdmin, requireMutationProtection } from "./_lib/http.js";
export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  try {
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
    requireMutationProtection(request);
    await enforceRateLimit(request, "import", 5, 3600);
    const session = await requireAdmin(request, ["owner"]);
    const bundle = await request.json();
    if (bundle.format !== "virsapur-content-export/v1") return json({ ok: false, error: "Unsupported export format." }, 422);
    if (bundle.records?.some(record => record.data?.demo === true)) return json({ ok: false, error: "Import blocked: demo fixture detected." }, 422);
    for (const [name, value] of Object.entries(bundle.singletons || {})) { const errors = validateSingleton(name, value); if (errors.length) return json({ ok: false, errors }, 422); }
    const groups = (bundle.records || []).reduce((result, record) => { (result[record.collection] ||= []).push(record); return result; }, {});
    for (const [name, records] of Object.entries(groups)) { const errors = validateCollection(name, records.map(record => record.data)); if (errors.length) return json({ ok: false, errors }, 422); }
    const provider = createSupabaseProvider();
    for (const [name, value] of Object.entries(bundle.singletons || {})) await provider.save(name, value, session.user.id);
    for (const [name, records] of Object.entries(groups)) await provider.save(name, records.map(record => record.data), session.user.id);
    return json({ ok: true, message: `Imported ${bundle.records.length} working records. Published snapshots were not redeployed; review changes and use Publish explicitly.` });
  } catch (error) { return handleError(error); }
} };
