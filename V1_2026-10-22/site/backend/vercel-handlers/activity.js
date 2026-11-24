import { createSupabaseProvider } from "../../src/cms/providers/supabase.mjs";
import { handleError, json, productionCmsUnavailable, requireAdmin } from "../../api/_lib/http.js";
export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  try {
    await requireAdmin(request, ["owner"]);
    if (request.method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405);
    return json({ ok: true, activity: await createSupabaseProvider().activity(100) });
  } catch (error) { return handleError(error); }
} };
