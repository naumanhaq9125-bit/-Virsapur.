import { next } from "@vercel/functions";
import { cmsConfig, isProductionCmsEnabled } from "./src/cms/config.mjs";

export const config = { matcher: "/admin/:path*", runtime: "nodejs" };

export default async function middleware(request) {
  if (!isProductionCmsEnabled()) return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
  const url = new URL(request.url);
  const publicAdminAsset = url.pathname.startsWith("/admin/login") || /\/(admin\.(?:css|js)|login\.js)$/.test(url.pathname);
  if (publicAdminAsset) return next({ headers: { "x-robots-tag": "noindex, nofollow" } });
  const cookie = request.headers.get("cookie") || "";
  const token = cookie.split(";").map(value => value.trim()).find(value => value.startsWith("__Host-virsapur_access="))?.split("=").slice(1).join("=");
  if (!token) return Response.redirect(new URL("/admin/login/", request.url), 302);
  try {
    const config = cmsConfig();
    if (!config.supabaseUrl || !config.supabasePublishableKey) throw new Error("Auth not configured");
    const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, { headers: { apikey: config.supabasePublishableKey, authorization: `Bearer ${decodeURIComponent(token)}` } });
    if (!response.ok) throw new Error("Session expired");
    return next({ headers: { "x-robots-tag": "noindex, nofollow", "cache-control": "private, no-store" } });
  } catch {
    const response = Response.redirect(new URL("/admin/login/?expired=1", request.url), 302);
    response.headers.append("set-cookie", "__Host-virsapur_access=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
    return response;
  }
}
