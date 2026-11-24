import { createSupabaseProvider } from "../../src/cms/providers/supabase.mjs";
import { getExactDeployment } from "../../api/_lib/vercel.js";
import { handleError, json, productionCmsUnavailable, requireAdmin } from "../../api/_lib/http.js";

export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  try {
    if (request.method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405);
    const session = await requireAdmin(request, ["owner"]);
    const jobId = new URL(request.url).searchParams.get("jobId");
    const provider = createSupabaseProvider();
    let job = jobId ? await provider.publishJob(jobId) : await provider.latestPublishJob(session.user.id);
    if (!job) return json({ ok: true, job: null, readyToPromote: false });
    if (["building","verified"].includes(job.state) && job.deployment_id) {
      const deployment = await getExactDeployment(job.deployment_id);
      if (deployment.id !== job.deployment_id) throw Object.assign(new Error("Deployment correlation failed."), { status: 409 });
      const state = deployment.readyState || deployment.state;
      if (state === "READY" && job.state !== "verified") {
        job = await provider.updatePublishJob(job.id, { state: "verified", updated_at: new Date().toISOString() });
        await provider.updatePublicationVersion(job.publication_version_id, { state: "verified" });
      } else if (["ERROR","CANCELED"].includes(state)) {
        const error = deployment.errorMessage || state;
        job = await provider.updatePublishJob(job.id, { state: "failed", error, updated_at: new Date().toISOString() });
        await provider.updatePublicationVersion(job.publication_version_id, { state: "failed", error });
      }
    }
    return json({ ok: true, job, readyToPromote: job.state === "verified" });
  } catch (error) { return handleError(error); }
} };
