import { cmsConfig } from "../../src/cms/config.mjs";

const base = "https://api.vercel.com";
function configured(config) {
  const missing = ["vercelToken","vercelProjectId","vercelProjectName","vercelGitRepositoryId"].filter(key => !config[key]);
  if (missing.length) throw Object.assign(new Error(`Staged deployment is not configured: ${missing.join(", ")}.`), { status: 503 });
}
async function vercelRequest(path, { method = "GET", body } = {}) {
  const config = cmsConfig();
  configured(config);
  const separator = path.includes("?") ? "&" : "?";
  const url = `${base}${path}${config.vercelTeamId ? `${separator}teamId=${encodeURIComponent(config.vercelTeamId)}` : ""}`;
  const response = await fetch(url, { method, headers: { authorization: `Bearer ${config.vercelToken}`, "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(payload?.error?.message || payload?.message || `Vercel request failed (${response.status}).`), { status: 502 });
  return payload;
}

export async function createStagedDeployment(publication) {
  const config = cmsConfig();
  configured(config);
  return vercelRequest("/v13/deployments?forceNew=1", { method: "POST", body: {
    name: config.vercelProjectName,
    target: "production",
    gitSource: { type: config.vercelGitProvider, repoId: config.vercelGitRepositoryId, ref: config.vercelGitRef },
    env: { PRODUCTION_CMS_ENABLED: "true", CMS_DATA_MODE: "production", CMS_PUBLICATION_VERSION: publication.id, CMS_CONTENT_VERSION: publication.content_version },
    meta: { virsapurPublicationVersion: publication.id, virsapurContentVersion: publication.content_version }
  } });
}

export const getExactDeployment = deploymentId => vercelRequest(`/v13/deployments/${encodeURIComponent(deploymentId)}`);

export function promoteExactDeployment(deploymentId) {
  const config = cmsConfig();
  return vercelRequest(`/v10/projects/${encodeURIComponent(config.vercelProjectId)}/promote/${encodeURIComponent(deploymentId)}`, { method: "POST", body: {} });
}

export async function verifyProductionContentVersion(contentVersion, attempts = 6) {
  const config = cmsConfig();
  if (!config.siteOrigin) throw Object.assign(new Error("SITE_ORIGIN is required for post-promotion verification."), { status: 503 });
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(`${config.siteOrigin}/?virsapur-release-check=${encodeURIComponent(contentVersion)}-${Date.now()}`, { headers: { "cache-control": "no-cache" }, cache: "no-store", redirect: "follow" });
    const html = response.ok ? await response.text() : "";
    if (html.includes(`<meta name="virsapur-content-version" content="${contentVersion}">`)) return true;
    if (attempt < attempts - 1) await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}
