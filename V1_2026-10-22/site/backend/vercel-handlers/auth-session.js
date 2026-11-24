import { cookies, handleError, json, productionCmsUnavailable, refresh, requireAdmin, responseWithCookies, sessionCookies } from "../../api/_lib/http.js";
export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  if (request.method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405);
  try {
    try { const session = await requireAdmin(request); return json({ ok: true, user: { id: session.user.id, email: session.user.email }, profile: session.profile }); }
    catch (initial) {
      const refreshToken = cookies(request)["__Host-virsapur_refresh"];
      if (!refreshToken) throw initial;
      const tokens = await refresh(refreshToken);
      const headers = new Headers(request.headers);
      headers.set("cookie", `__Host-virsapur_access=${tokens.access_token}`);
      const session = await requireAdmin(new Request(request.url, { headers }));
      return responseWithCookies({ ok: true, user: { id: session.user.id, email: session.user.email }, profile: session.profile, refreshed: true }, 200, sessionCookies(tokens));
    }
  } catch (error) { return handleError(error); }
} };
