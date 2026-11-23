import { createSupabaseProvider } from "../src/cms/providers/supabase.mjs";
import { hydratePrivateMediaPreviews, resolveMediaReferences } from "../src/cms/private-media.mjs";
import { handleError, json, productionCmsUnavailable, requireAdmin } from "./_lib/http.js";

const esc = (value = "") => String(value).replace(/[&<>\"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" })[char]);
const imageSrc = image => {
  if (!image) return "";
  if (image.derivatives?.webp1280) return image.derivatives.webp1280;
  if (/^https?:\/\//.test(image.src || image)) return image.src || image;
  const item = typeof image === "string" ? { src: image } : image;
  const stem = item.optimizedStem || item.src.replace(/^assets\//, "").replace(/\.[^.]+$/, "").replace(/_/g, "-");
  return `/assets/optimized/${stem}-${Math.min(item.width || 1280, 1280)}.webp`;
};
function bodyHtml(body) {
  if (typeof body === "string") return `<p>${esc(body)}</p>`;
  return (body || []).map(block => block.type === "heading" ? `<h${Number(block.level) === 3 ? 3 : 2}>${esc(block.text)}</h${Number(block.level) === 3 ? 3 : 2}>`
    : block.type === "quote" ? `<blockquote><p>“${esc(block.text)}”</p>${block.attribution ? `<footer>${esc(block.attribution)}</footer>` : ""}</blockquote>`
    : block.type === "callout" ? `<aside class="story-callout">${block.title ? `<strong>${esc(block.title)}</strong>` : ""}<p>${esc(block.text)}</p></aside>`
    : block.type === "image" ? `<figure><img src="${esc(imageSrc(block))}" alt="${esc(block.alt || "")}">${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ""}</figure>`
    : block.type === "gallery" ? `<div class="story-gallery">${(block.images || []).map(image => `<img src="${esc(imageSrc(image))}" alt="${esc(image.alt || "")}">`).join("")}</div>`
    : block.type === "embed" && /^https:\/\//.test(block.url || "") ? `<div class="story-embed"><iframe src="${esc(block.url)}" title="${esc(block.title || "Embedded content")}" loading="lazy"></iframe></div>`
    : `<p>${esc(block.text || "")}</p>`).join("");
}
function recordPreview(record, collection) {
  const image = record.featuredImage || record.image;
  const eyebrow = collection === "stories" ? record.category || "Story" : collection === "projects" ? "Project case study" : collection === "events" ? "Scheduled activity" : record.kind || "Programme";
  return `<section class="page-hero has-image"><div><p class="overline">${esc(eyebrow)}</p><h1>${esc(record.title)}</h1><p>${esc(record.summary)}</p></div>${image ? `<img class="page-hero-image" src="${esc(imageSrc(image))}" alt="${esc(image.alt || "")}">` : ""}</section><article class="story-longform"><div class="story-body">${bodyHtml(record.body)}</div></article>`;
}
export default { async fetch(request) {
  const unavailable = productionCmsUnavailable(); if (unavailable) return unavailable;
  try {
    await requireAdmin(request);
    if (request.method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405);
    const url = new URL(request.url);
    const collection = url.searchParams.get("collection");
    const id = url.searchParams.get("id");
    const route = url.searchParams.get("route") || "/";
    const content = await hydratePrivateMediaPreviews(await createSupabaseProvider().loadAll());
    const record = collection && id ? content[collection]?.find(item => item.id === id) : null;
    if (record) resolveMediaReferences(record, content.media);
    if (collection && id && !record) return json({ ok: false, error: "Preview record not found." }, 404);
    const main = record ? recordPreview(record, collection) : `<section class="page-hero"><div><p class="overline">Authenticated preview</p><h1>Public route preview</h1><p>This frame shows the current live route. Open a record from its editor to preview the saved draft.</p><a class="button" href="${esc(route)}">Open ${esc(route)}</a></div></section><iframe src="${esc(route)}" title="Current public route" style="width:100%;height:75vh;border:0"></iframe>`;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(record?.title || "Virsapur preview")}</title><link rel="stylesheet" href="/styles.css"></head><body data-mode="preview"><div class="dev-bar">AUTHENTICATED DRAFT PREVIEW · NOT PUBLIC</div><main id="main">${main}</main></body></html>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow", "content-security-policy": "frame-ancestors 'self'" } });
  } catch (error) { return handleError(error); }
} };
