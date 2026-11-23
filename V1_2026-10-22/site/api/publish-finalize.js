import { createSupabaseProvider } from "../src/cms/providers/supabase.mjs";
import { getExactDeployment, promoteExactDeployment, verifyProductionContentVersion } from "./_lib/vercel.js";
import { enforceRateLimit, handleError, json, productionCmsUnavailable, requireAdmin, requireMutationProtection } from "./_lib/http.js";

export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  try {
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
    requireMutationProtection(request);
    await enforceRateLimit(request, "promote", 10, 3600);
    const session = await requireAdmin(request, ["owner"]);
    const { jobId } = await request.json();
    const provider = createSupabaseProvider();
    let job = await provider.publishJob(jobId);
    if (!job || job.state !== "verified" || !job.deployment_id) return json({ ok: false, error: "Only a verified, exactly correlated candidate can be promoted." }, 409);
    const deployment = await getExactDeployment(job.deployment_id);
    if (deployment.id !== job.deployment_id || (deployment.readyState || deployment.state) !== "READY") return json({ ok: false, error: "The exact candidate deployment is not READY." }, 409);
    await provider.updatePublishJob(job.id, { state: "promoting", updated_at: new Date().toISOString() });
    try {
      const version = await provider.publicationVersion(job.publication_version_id);
      if (!version?.content_version) throw new Error("Publication content version is missing.");
      await promoteExactDeployment(job.deployment_id);
      if (!await verifyProductionContentVersion(version.content_version)) throw new Error("Production domain did not confirm the promoted content version.");
      const publication = await provider.promotePublication(job.publication_version_id, session.user.id);
      job = await provider.publishJob(job.id);
      return json({ ok: true, message: "The verified deployment is now live and its immutable snapshot is the current CMS version.", job, publication });
    } catch (error) {
      await provider.updatePublishJob(job.id, { state: "promotion_uncertain", error: error.message, updated_at: new Date().toISOString() });
      await provider.updatePublicationVersion(job.publication_version_id, { state: "promotion_uncertain", error: error.message });
      throw Object.assign(new Error("Promotion could not be confirmed. Further publishing is blocked until an owner reconciles this exact deployment."), { status: 502 });
    }
  } catch (error) { return handleError(error); }
} };
