import "./src/qa-platform.mjs";
/*
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

const projectRoot = new URL(".", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const publicRoot = join(projectRoot, "dist");
const errors = [];
const warnings = [];
const titles = new Map();

async function filesUnder(dir) {
  const result = [];
  for (const name of await readdir(dir)) {
    const path = join(dir, name);
    const info = await stat(path);
    if (info.isDirectory()) result.push(...await filesUnder(path));
    else result.push(path);
  }
  return result;
}

const routeForFile = file => {
  const rel = relative(publicRoot, file).split(sep).join("/");
  if (rel === "index.html") return "/";
  if (rel === "404.html") return "/404-file";
  return `/${rel.replace(/\/index\.html$/, "")}`;
};
const decodeAttribute = value => value.replaceAll("&quot;", '"').replaceAll("&amp;", "&").replaceAll("&#39;", "'");
const files = await filesUnder(publicRoot);
const htmlFiles = files.filter(path => path.endsWith(".html"));
const manifest = JSON.parse(await readFile(join(publicRoot, "route-manifest.json"), "utf8"));
const manifestByRoute = new Map(manifest.routes.map(item => [item.route, item]));

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const route = routeForFile(file);
  const entry = manifestByRoute.get(route === "/404-file" ? "/404" : route);
  const isRedirect = /http-equiv="refresh"/.test(html);
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)"/s)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/s)?.[1];
  const robots = html.match(/<meta name="robots" content="([^"]*)"/s)?.[1];
  const h1Count = (html.match(/<h1(?:\s|>)/g) || []).length;

  if (!title) errors.push(`${route}: missing title`);
  if (!description && !isRedirect) errors.push(`${route}: missing meta description`);
  if (!canonical) errors.push(`${route}: missing canonical`);
  if (!isRedirect && h1Count !== 1) errors.push(`${route}: expected one H1, found ${h1Count}`);
  if (!isRedirect && !robots) errors.push(`${route}: missing robots directive`);
  if (!isRedirect && !/<meta name="twitter:card"/.test(html)) errors.push(`${route}: missing Twitter card metadata`);
  if (!isRedirect && !/<meta property="og:image:alt"/.test(html)) errors.push(`${route}: missing social image alt`);
  if (!isRedirect && !/<script type="application\/ld\+json">/.test(html)) errors.push(`${route}: missing structured page data`);
  if (entry && !isRedirect) {
    if (entry.indexable && !robots?.startsWith("index,")) errors.push(`${route}: published route is not indexable`);
    if (!entry.indexable && !robots?.startsWith("noindex,")) errors.push(`${route}: non-published route is indexable`);
  }
  for (const schemaMatch of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(schemaMatch[1]); } catch { errors.push(`${route}: invalid structured JSON`); }
  }
  if (title && !isRedirect && route !== "/404-file") {
    if (titles.has(title)) warnings.push(`${route}: duplicate title also used by ${titles.get(title)}`);
    else titles.set(title, route);
  }

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = match[1];
    if (/^(?:https?:|mailto:|tel:|#|data:)/.test(ref)) continue;
    const clean = ref.split("#")[0].split("?")[0];
    if (!clean) continue;
    const target = resolve(dirname(file), clean);
    if (!target.startsWith(publicRoot)) {
      errors.push(`${route}: local reference escapes the public bundle: ${ref}`);
      continue;
    }
    try { await stat(target); } catch { errors.push(`${route}: broken local reference ${ref}`); }
  }
  for (const match of html.matchAll(/data-map-scripts='([^']+)'/g)) {
    for (const ref of JSON.parse(decodeAttribute(match[1]))) {
      const target = resolve(dirname(file), ref.split("?")[0]);
      if (!target.startsWith(publicRoot)) {
        errors.push(`${route}: lazy map reference escapes the public bundle: ${ref}`);
        continue;
      }
      try { await stat(target); } catch { errors.push(`${route}: broken lazy map reference ${ref}`); }
    }
  }

  const mapPresent = /data-heritage-map/.test(html);
  const shouldHaveMap = route === "/" || route === "/heritage-map";
  if (mapPresent !== shouldHaveMap) errors.push(`${route}: map loading scope is incorrect`);
  if (!isRedirect && /<img\b/.test(html)) {
    for (const image of html.matchAll(/<img\b[^>]*>/g)) {
      if (!/\bwidth="\d+"/.test(image[0]) || !/\bheight="\d+"/.test(image[0])) errors.push(`${route}: image lacks intrinsic dimensions`);
      if (!/\balt="[^"]*"/.test(image[0])) errors.push(`${route}: image lacks alt attribute`);
    }
  }
  if (!isRedirect && /prototype|content to be supplied|editorial template|coming soon|future home/i.test(html)) errors.push(`${route}: exposes development-stage language`);
  if (/successfully sent|thank you for your submission/i.test(html)) errors.push(`${route}: contains an unverified submission-success message`);
}

const home = await readFile(join(publicRoot, "index.html"), "utf8");
const homeMain = home.match(/<main id="main">([\s\S]*?)<\/main>/)?.[1] || "";
const homeSections = (homeMain.match(/<section\b/g) || []).length;
if (homeSections !== 6) errors.push(`/: expected six visible modules with unpublished current/story/project modules hidden, found ${homeSections}`);
if (/founder-grid|data-contact-form/.test(homeMain)) errors.push("/: founders or contact form should not appear on the homepage");
if (/VIRSAPUR/.test(homeMain)) errors.push("/: oversized brand-name treatment remains in homepage content");
if ((homeMain.match(/class="button (?:primary|secondary)"/g) || []).length < 4) errors.push("/: homepage button hierarchy is incomplete");
if ((homeMain.match(/class="quick-index"/g) || []).length !== 4) errors.push("/: quick-discovery module must contain four real shortcuts");
if ((homeMain.match(/class="experience-card/g) || []).length !== 4) errors.push("/: Experiences module must contain four image-led programme cards");
for (const label of ["Experience", "Learn", "Our work", "Events &amp; collaboration"]) {
  if (!homeMain.includes(`<p>${label}</p>`)) errors.push(`/: missing accurate programme category label ${label}`);
}
if (!/class="[^"]*home-map-section/.test(homeMain) || homeMain.indexOf("data-heritage-map") < 0) errors.push("/: Heritage Map is missing from the homepage discovery journey");
if (/home-current|home-stories|home-projects/.test(homeMain)) errors.push("/: unpublished current, story or project modules are visible");
if (/v1-hero|pathway-grid|service-card-grid|why-home/.test(homeMain)) errors.push("/: retired institutional homepage composition remains in output");

const styles = await readFile(join(publicRoot, "styles.css"), "utf8");
if (/Visual softness pass|--radius-control|--radius-card|--radius-feature|--soft-shadow/.test(styles)) errors.push("styles: obsolete visual-softness override remains");
if (/border-radius:\s*(?:40|58|92|999)px/.test(styles)) errors.push("styles: oversized or pill radius reintroduced");

const sitemap = await readFile(join(publicRoot, "sitemap.xml"), "utf8");
for (const entry of manifest.routes) {
  const present = sitemap.includes(`<loc>${manifest.siteOrigin}${entry.route === "/" ? "/" : entry.route}</loc>`);
  if (entry.sitemap !== present) errors.push(`${entry.route}: sitemap state does not match manifest`);
}
if (files.some(path => /dist[\\/]assets[\\/](?!optimized|maps)/.test(path))) errors.push("dist: public assets contain files outside optimized images and map runtime");

const report = {
  publicRoot,
  htmlFiles: htmlFiles.length,
  manifestRoutes: manifest.routes.length,
  indexableRoutes: manifest.routes.filter(item => item.indexable).length,
  errors,
  warnings
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
*/
