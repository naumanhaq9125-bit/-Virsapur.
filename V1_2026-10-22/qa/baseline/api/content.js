import { createSupabaseProvider } from "../src/cms/providers/supabase.mjs";
import { hydratePrivateMediaPreviews } from "../src/cms/private-media.mjs";
import { handleError, json, productionCmsUnavailable, requireAdmin, requireMutationProtection } from "./_lib/http.js";
export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  try {
    const session = await requireAdmin(request);
    const provider = createSupabaseProvider();
    if (request.method === "GET") return json({ ok: true, content: await hydratePrivateMediaPreviews(await provider.loadAll()), mode: "production", session: { email: session.user.email, role: session.profile.role, displayName: session.profile.display_name } });
    if (request.method === "PUT") {
      requireMutationProtection(request);
      const { name, value } = await request.json();
      if (["site", "homepage", "navigation", "seo"].includes(name) && session.profile.role !== "owner") return json({ ok: false, error: "Only an owner can change global site, homepage, navigation, or SEO settings." }, 403);
      await provider.save(name, value, session.user.id);
      return json({ ok: true, message: `${name} draft saved. Public content is unchanged until Publish completes.` });
    }
    return json({ ok: false, error: "Method not allowed." }, 405);
  } catch (error) { return handleError(error); }
} };
