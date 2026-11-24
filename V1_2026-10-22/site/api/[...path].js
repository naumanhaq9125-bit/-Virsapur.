import { json } from "./_lib/http.js";

const routes = [
  ["/api/activity", () => import("../backend/vercel-handlers/activity.js")],
  ["/api/admin-custom-tour-quotes", () => import("../backend/vercel-handlers/admin-custom-tour-quotes.js")],
  ["/api/admin/trip-bookings", () => import("../backend/vercel-handlers/admin/trip-bookings.js")],
  ["/api/auth/login", () => import("../backend/vercel-handlers/auth/login.js")],
  ["/api/auth/logout", () => import("../backend/vercel-handlers/auth/logout.js")],
  ["/api/auth/profile", () => import("../backend/vercel-handlers/auth/profile.js")],
  ["/api/auth/session", () => import("../backend/vercel-handlers/auth/session.js")],
  ["/api/auth/signup", () => import("../backend/vercel-handlers/auth/signup.js")],
  ["/api/auth-login", () => import("../backend/vercel-handlers/auth-login.js")],
  ["/api/auth-logout", () => import("../backend/vercel-handlers/auth-logout.js")],
  ["/api/auth-session", () => import("../backend/vercel-handlers/auth-session.js")],
  ["/api/content", () => import("../backend/vercel-handlers/content.js")],
  ["/api/custom-tour-quotes", () => import("../backend/vercel-handlers/custom-tour-quotes.js")],
  ["/api/export", () => import("../backend/vercel-handlers/export.js")],
  ["/api/import", () => import("../backend/vercel-handlers/import.js")],
  ["/api/media", () => import("../backend/vercel-handlers/media.js")],
  ["/api/media-preview", () => import("../backend/vercel-handlers/media-preview.js")],
  ["/api/member/places", () => import("../backend/vercel-handlers/member/places.js")],
  ["/api/member/trip-bookings", () => import("../backend/vercel-handlers/member/trip-bookings.js")],
  ["/api/member/trips", () => import("../backend/vercel-handlers/member/trips.js")],
  ["/api/member-session", () => import("../backend/vercel-handlers/member-session.js")],
  ["/api/preview", () => import("../backend/vercel-handlers/preview.js")],
  ["/api/publish", () => import("../backend/vercel-handlers/publish.js")],
  ["/api/publish-finalize", () => import("../backend/vercel-handlers/publish-finalize.js")],
  ["/api/publish-status", () => import("../backend/vercel-handlers/publish-status.js")],
  ["/api/revisions", () => import("../backend/vercel-handlers/revisions.js")],
  ["/api/saved-articles", () => import("../backend/vercel-handlers/saved-articles.js")],
  ["/api/stripe/webhook", () => import("../backend/vercel-handlers/stripe/webhook.js")],
  ["/api/trip-bookings", () => import("../backend/vercel-handlers/trip-bookings.js")],
];

const dynamicRoutes = [
  [/^\/api\/admin\/trip-bookings\/[^/]+$/, () => import("../backend/vercel-handlers/admin/trip-bookings/[id].js")],
  [/^\/api\/member\/trips\/[^/]+\/submit$/, () => import("../backend/vercel-handlers/member/trips/[id]/submit.js")],
  [/^\/api\/member\/trips\/[^/]+$/, () => import("../backend/vercel-handlers/member/trips/[id].js")],
  [/^\/api\/saved-articles\/[^/]+$/, () => import("../backend/vercel-handlers/saved-articles/[articleId].js")],
];

export function resolveApiHandler(pathname) {
  const route = pathname.replace(/\/+$/, "") || "/";
  return routes.find(([path]) => path === route)?.[1]
    ?? dynamicRoutes.find(([pattern]) => pattern.test(route))?.[1]
    ?? null;
}

export default {
  async fetch(request) {
    const load = resolveApiHandler(new URL(request.url).pathname);
    if (!load) return json({ ok: false, error: "Not found." }, 404);
    const { default: handler } = await load();
    return handler.fetch(request);
  },
};
