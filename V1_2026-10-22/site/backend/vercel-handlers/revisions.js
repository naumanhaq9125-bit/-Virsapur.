import { createSupabaseProvider } from "../../src/cms/providers/supabase.mjs";
import { handleError, json, productionCmsUnavailable, requireAdmin, requireMutationProtection } from "../../api/_lib/http.js";
export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  try {
    await requireAdmin(request);
    const provider = createSupabaseProvider();
    if (request.method === "GET") {
      const url = new URL(request.url);
      const revisions = await provider.revisions({ collection: url.searchParams.get("collection") || undefined, id: url.searchParams.get("id") || undefined });
      return json({ ok: true, revisions });
    }
    if (request.method === "POST") {
      requireMutationProtection(request);
      const session = await requireAdmin(request);
      const { revisionId } = await request.json();
      return json(await provider.restoreRevision(revisionId, session.user.id));
    }
    return json({ ok: false, error: "Method not allowed." }, 405);
  } catch (error) { return handleError(error); }
} };
