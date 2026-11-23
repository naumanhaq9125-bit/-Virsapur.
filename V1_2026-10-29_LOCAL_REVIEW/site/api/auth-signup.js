import { enforceRateLimit, handleError, json, productionCmsUnavailable, requireSameOrigin, signUp } from "./_lib/http.js";

export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
  try {
    requireSameOrigin(request);
    await enforceRateLimit(request, "signup", 4, 3600);
    const { email, password, firstName, lastName } = await request.json();
    if (!email || !password || !firstName || !lastName) return json({ ok: false, error: "First name, last name, email and password are required." }, 422);
    if (String(password).length < 8) return json({ ok: false, error: "Password must be at least 8 characters." }, 422);
    await signUp(String(email).trim().toLowerCase(), password, String(firstName).trim(), String(lastName).trim());
    return json({ ok: true }, 201);
  } catch (error) { return handleError(error); }
} };
