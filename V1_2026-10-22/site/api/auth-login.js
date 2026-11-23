import { enforceRateLimit, handleError, json, login, productionCmsUnavailable, requireSameOrigin, responseWithCookies, sessionCookies } from "./_lib/http.js";
export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
  try {
    requireSameOrigin(request);
    await enforceRateLimit(request, "login", 8, 900);
    const { email, password } = await request.json();
    if (!email || !password) return json({ ok: false, error: "Email and password are required." }, 422);
    const tokens = await login(email, password);
    return responseWithCookies({ ok: true, expiresIn: tokens.expires_in }, 200, sessionCookies(tokens));
  } catch (error) { return handleError(error); }
} };
