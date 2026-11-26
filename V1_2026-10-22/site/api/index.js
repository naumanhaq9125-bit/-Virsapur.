import { json } from "./_lib/http.js";
import { resolveApiHandler } from "./[...path].js";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = String(url.searchParams.get("path") || "").replace(/^\/+/, "");
    url.searchParams.delete("path");
    url.pathname = `/api/${path}`;
    const load = resolveApiHandler(url.pathname);
    if (!load) return json({ ok: false, error: "Not found." }, 404);
    const { default: handler } = await load();
    return handler.fetch(new Request(url, request));
  }
};
