import { createSupabaseProvider } from "../../src/cms/providers/supabase.mjs";
import { enforceRateLimit, handleError, json, productionCmsUnavailable, requireAdmin, requireMutationProtection } from "../../api/_lib/http.js";
import { createStagedDeployment } from "../../api/_lib/vercel.js";

export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  try {
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
    requireMutationProtection(request);
    await enforceRateLimit(request, "publish", 10, 3600);
    const session = await requireAdmin(request, ["owner"]);
    const { contentKind = "record", collection, id, unpublish = false } = await request.json();
    if (!id || !["record","singleton"].includes(contentKind)) return json({ ok: false, error: "A valid content target is required." }, 422);
    const provider = createSupabaseProvider();
    const publication = await provider.stagePublication({ contentKind, collection: collection || "singletons", id, actorId: session.user.id, unpublish });
    const job = await provider.publishJobForVersion(publication.id);
    try {
      const deployment = await createStagedDeployment(publication);
      const deploymentCreatedAt = deployment.createdAt ? new Date(deployment.createdAt).toISOString() : new Date().toISOString();
      const updated = await provider.updatePublishJob(job.id, { state: "building", deployment_id: deployment.id, provider_job_id: deployment.id, deployment_url: deployment.url ? `https://${deployment.url}` : null, deployment_created_at: deploymentCreatedAt, updated_at: new Date().toISOString() });
      await provider.updatePublicationVersion(publication.id, { state: "building", deployment_id: deployment.id, deployment_url: deployment.url ? `https://${deployment.url}` : null, deployment_created_at: deploymentCreatedAt });
      return json({ ok: true, message: "A versioned production candidate is building. Nothing is live; verify it, then use Promote Live.", job: updated });
    } catch (error) {
      await provider.updatePublishJob(job.id, { state: "failed", error: error.message, updated_at: new Date().toISOString() });
      await provider.updatePublicationVersion(publication.id, { state: "failed", error: error.message });
      throw Object.assign(new Error(`Candidate staging failed. Live content was not changed: ${error.message}`), { status: 502 });
    }
  } catch (error) { return handleError(error); }
} };
