import { cmsConfig, assertProductionConfig, isProductionCmsEnabled } from "../../src/cms/config.mjs";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", ...headers } });
export const noContent = (headers = {}) => new Response(null, { status: 204, headers: { "cache-control": "no-store", ...headers } });
export const methodNotAllowed = allowed => json({ ok: false, error: "Method not allowed." }, 405, { Allow: allowed.join(", ") });
export const productionCmsUnavailable = () => isProductionCmsEnabled() ? null : new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
export function cookies(request) {
  return Object.fromEntries((request.headers.get("cookie") || "").split(";").map(value => value.trim()).filter(Boolean).map(value => { const index = value.indexOf("="); return [decodeURIComponent(value.slice(0, index)), decodeURIComponent(value.slice(index + 1))]; }));
}
export const sessionCookies = tokens => {
  const csrf = randomBytes(24).toString("base64url");
  return [
  `__Host-virsapur_access=${encodeURIComponent(tokens.access_token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(60, Number(tokens.expires_in || 3600))}`,
  `__Host-virsapur_refresh=${encodeURIComponent(tokens.refresh_token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`,
  `__Host-virsapur_csrf=${encodeURIComponent(csrf)}; Path=/; Secure; SameSite=Strict; Max-Age=${Math.max(60, Number(tokens.expires_in || 3600))}`
  ];
};
export const clearSessionCookies = () => [
  "__Host-virsapur_access=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
  "__Host-virsapur_refresh=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
  "__Host-virsapur_csrf=; Path=/; Secure; SameSite=Strict; Max-Age=0"
];
export function responseWithCookies(data, status, values) {
  const headers = new Headers({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" });
  for (const value of values) headers.append("set-cookie", value);
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}
async function supabaseAuth(path, { method = "GET", body, token, secret = false } = {}) {
  const config = cmsConfig();
  assertProductionConfig(config, "authentication");
  const key = secret ? config.supabaseSecretKey : config.supabasePublishableKey;
  const response = await fetch(`${config.supabaseUrl}${path}`, { method, headers: { apikey: key, authorization: `Bearer ${token || key}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const text = await response.text();
  const result = text ? JSON.parse(text) : null;
  if (!response.ok) throw Object.assign(new Error(result?.msg || result?.error_description || result?.message || "Authentication failed."), { status: response.status });
  return result;
}
export const login = (email, password) => supabaseAuth("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } });
export const refresh = refreshToken => supabaseAuth("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: refreshToken } });
export async function requireAdmin(request, roles = ["owner", "editor"]) {
  const token = cookies(request)["__Host-virsapur_access"];
  if (!token) throw Object.assign(new Error("Sign in is required."), { status: 401 });
  const user = await supabaseAuth("/auth/v1/user", { token });
  const config = cmsConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/admin_profiles?select=user_id,role,display_name&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, { headers: { apikey: config.supabaseSecretKey, authorization: `Bearer ${config.supabaseSecretKey}` } });
  const profiles = await response.json();
  const profile = profiles[0];
  if (!response.ok || !profile || !roles.includes(profile.role)) throw Object.assign(new Error("This account does not have Virsapur Admin access."), { status: 403 });
  return { user, profile, token };
}
export function requireSameOrigin(request) {
  const origin = request.headers.get("origin");
  const expected = new URL(request.url).origin;
  if (!origin || origin !== expected) throw Object.assign(new Error("Cross-origin request blocked."), { status: 403 });
}
export function requireMutationProtection(request) {
  requireSameOrigin(request);
  const cookieToken = cookies(request)["__Host-virsapur_csrf"] || "";
  const headerToken = request.headers.get("x-virsapur-csrf") || "";
  const left = Buffer.from(cookieToken);
  const right = Buffer.from(headerToken);
  if (!left.length || left.length !== right.length || !timingSafeEqual(left, right)) throw Object.assign(new Error("CSRF validation failed."), { status: 403 });
}
export async function enforceRateLimit(request, action, limit, windowSeconds) {
  const config = cmsConfig();
  assertProductionConfig(config);
  const address = (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown").split(",")[0].trim();
  const key = createHash("sha256").update(`${action}:${address}`).digest("hex");
  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/consume_cms_rate_limit`, { method: "POST", headers: { apikey: config.supabaseSecretKey, authorization: `Bearer ${config.supabaseSecretKey}`, "content-type": "application/json" }, body: JSON.stringify({ p_key_hash: key, p_limit: limit, p_window_seconds: windowSeconds }) });
  const payload = await response.json().catch(() => false);
  if (!response.ok || payload !== true) throw Object.assign(new Error("Too many requests. Try again later."), { status: 429 });
}
export function handleError(error) {
  console.error("Virsapur CMS request failed", { name: error?.name || "Error", status: error?.status || 500 });
  return json({ ok: false, error: error.message || "Unexpected server error.", errors: error.errors }, error.status || 500);
}
