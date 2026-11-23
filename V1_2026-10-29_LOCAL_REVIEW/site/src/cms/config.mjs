const clean = value => String(value || "").trim().replace(/\/$/, "");

export function cmsConfig(env = process.env) {
  return {
    productionCmsEnabled: env.PRODUCTION_CMS_ENABLED === "true",
    dataMode: env.CMS_DATA_MODE || env.STUDIO_DATA_MODE || "local",
    supabaseUrl: clean(env.SUPABASE_URL),
    supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || "",
    supabaseSecretKey: env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "",
    privateStorageBucket: env.SUPABASE_PRIVATE_STORAGE_BUCKET || "virsapur-private",
    publicStorageBucket: env.SUPABASE_PUBLIC_STORAGE_BUCKET || "virsapur-public",
    vercelToken: env.VERCEL_API_TOKEN || "",
    vercelProjectId: env.VERCEL_PROJECT_ID || "",
    vercelProjectName: env.VERCEL_PROJECT_NAME || "",
    vercelTeamId: env.VERCEL_TEAM_ID || "",
    vercelGitRepositoryId: env.VERCEL_GIT_REPOSITORY_ID || "",
    vercelGitProvider: env.VERCEL_GIT_PROVIDER || "github",
    vercelGitRef: env.VERCEL_GIT_REF || "main",
    siteOrigin: clean(env.SITE_ORIGIN)
  };
}

export function isProductionCmsEnabled(env = process.env) {
  return env.PRODUCTION_CMS_ENABLED === "true";
}

export function assertProductionConfig(config, purpose = "production CMS") {
  const missing = [];
  if (!config.productionCmsEnabled) missing.push("PRODUCTION_CMS_ENABLED=true");
  if (!config.supabaseUrl) missing.push("SUPABASE_URL");
  if (!config.supabaseSecretKey) missing.push("SUPABASE_SECRET_KEY");
  if (purpose === "authentication" && !config.supabasePublishableKey) missing.push("SUPABASE_PUBLISHABLE_KEY");
  if (missing.length) throw new Error(`${purpose} is not configured. Missing ${missing.join(", ")}.`);
}

export function isProductionDataMode(env = process.env) {
  return (env.CMS_DATA_MODE || env.STUDIO_DATA_MODE || "local") === "production";
}
