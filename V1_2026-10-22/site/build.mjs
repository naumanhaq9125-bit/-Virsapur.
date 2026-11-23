import "./src/site-builder.mjs";
/*
import { dirname, join } from "node:path";
import { homepage, homepageCurrent } from "./content/homepage.mjs";
import { people } from "./content/people.mjs";
import { programmes } from "./content/programmes.mjs";
import { projects } from "./content/projects.mjs";
import { siteSettings } from "./content/site.mjs";
import { stories } from "./content/stories.mjs";
import { testimonials } from "./content/testimonials.mjs";
import { trailsPage } from "./content/trails.mjs";
import { workshopsPage } from "./content/workshops.mjs";
import { coursesPage } from "./content/courses.mjs";

const root = new URL(".", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const outputRoot = join(root, "dist");
const siteOrigin = (process.env.SITE_ORIGIN || siteSettings.defaultSiteOrigin).replace(/\/+$/, "");
const publishedProgrammes = programmes.filter(item => item.status === "published").sort((a, b) => a.sortOrder - b.sortOrder);
const publishedStories = stories.filter(item => item.status === "published");
const publishedProjects = projects.filter(item => item.status === "published");
const publishedTestimonials = testimonials.filter(item => item.status === "published");
const routeManifest = [];

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

const esc = (value = "") => String(value).replace(/[&<>\"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
const depthFor = route => route.split("/").filter(Boolean).length;
const prefixFor = route => "../".repeat(depthFor(route));
const hrefFor = (route, target) => {
  const [beforeHash, hash = ""] = target.split("#");
  const [path, query = ""] = beforeHash.split("?");
  const clean = path.replace(/^\//, "");
  return `${prefixFor(route)}${clean ? `${clean}/` : ""}index.html${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
};
const assetFor = (route, path) => `${prefixFor(route)}${path}`;
const canonicalFor = route => `${siteOrigin}${route === "/" ? "/" : route}`;
const phoneHref = siteSettings.phone.replace(/[^+\d]/g, "");

const media = {
  "archive-anarkali": [800, 600], "archive-architecture": [1200, 628], "archive-gurdwara": [639, 426],
  "archive-katas": [640, 379], "archive-lanes": [726, 387], "archive-priest-king": [590, 388],
  "archive-wells": [640, 404], "founder-ahmad": [1600, 1200], "founder-altamash": [787, 591],
  "fresco-room": [1153, 2048], "fresco-strip": [1035, 320], "hero-badshahi": [1918, 1080],
  "logo-full-slate": [1289, 781], "logo-full-white": [1289, 781], "pillar-red": [1153, 2048],
  "pillar-white": [1153, 2048], "project-1": [1920, 1080], "project-2": [1920, 1080],
  "temple-angle": [1153, 2048], "temple-distant": [1153, 2048], "temple-entrance": [1153, 2048], "temple-shadow": [1153, 2048]
};

function imageRecord(value) {
  if (typeof value === "string") {
    const stem = value.replace(/^assets\//, "").replace(/\.[^.]+$/, "").replace(/_/g, "-");
    const [width, height] = media[stem] || [1280, 720];
    return { optimizedStem: stem, width, height, alt: "" };
  }
  const stem = value.optimizedStem || value.src.replace(/^assets\//, "").replace(/\.[^.]+$/, "").replace(/_/g, "-");
  const [width, height] = media[stem] || [value.width, value.height];
  return { ...value, optimizedStem: stem, width, height };
}

function optimizedImagePath(image, requestedWidth = 1280) {
  const item = imageRecord(image);
  const width = Math.min(item.width, requestedWidth);
  const path = `assets/optimized/${item.optimizedStem}-${width}.webp`;
  return item.optimizedStem.startsWith("logo-") ? `${path}?v=v1alpha` : path;
}

function picture(route, image, { className = "", loading = "lazy", fetchpriority = "auto", decorative = false, sizes = "(max-width: 760px) 100vw, 50vw" } = {}) {
  const item = imageRecord(image);
  const widths = [...new Set([Math.min(item.width, 640), Math.min(item.width, 1280)])].sort((a, b) => a - b);
  const srcset = widths.map(width => `${assetFor(route, `assets/optimized/${item.optimizedStem}-${width}.webp`)} ${width}w`).join(", ");
  const fallback = assetFor(route, `assets/optimized/${item.optimizedStem}-${widths.at(-1)}.webp`);
  const alt = decorative ? "" : esc(item.alt || "");
  return `<picture${className ? ` class="${className}"` : ""}><source type="image/webp" srcset="${srcset}" sizes="${sizes}"><img src="${fallback}" width="${item.width}" height="${item.height}" alt="${alt}" loading="${loading}" decoding="async" fetchpriority="${fetchpriority}"></picture>`;
}

function header(route, active) {
  const headerLogo = route === "/" ? "assets/logo_full_white.png" : "assets/logo_full_slate.png";
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="brand" href="${hrefFor(route, "/")}" aria-label="Virsapur home"><img src="${assetFor(route, optimizedImagePath(headerLogo, 640))}" width="1289" height="781" alt="Virsapur"></a>
  <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="navigation">Menu</button>
  <nav id="navigation" aria-label="Main navigation">${siteSettings.navigation.filter(item => item.id !== "home").map(item => `<a href="${hrefFor(route, item.route)}"${active === item.id ? ' aria-current="page"' : ""}>${esc(item.label)}</a>`).join("")}</nav>
  <a class="contact-link" href="${hrefFor(route, "/contact")}"${active === "contact" ? ' aria-current="page"' : ""}>Get in touch</a>
</header>`;
}

function footer(route) {
  const exploreLinks = siteSettings.footer.explore.map(id => siteSettings.navigation.find(item => item.id === id)).filter(Boolean);
  return `<footer class="site-footer">
  <div class="footer-identity"><img src="${assetFor(route, optimizedImagePath("assets/logo_full_white.png", 640))}" width="1289" height="781" alt="Virsapur"><p>${esc(siteSettings.purpose)}</p></div>
  <div><p class="footer-label">Explore</p><nav aria-label="Footer navigation">${exploreLinks.map(item => `<a href="${hrefFor(route, item.route)}">${esc(item.label)}</a>`).join("")}</nav></div>
  <div class="footer-contact"><p class="footer-label">Connect</p><a href="${hrefFor(route, "/contact")}">Contact</a><a href="mailto:${siteSettings.email}">${siteSettings.email}</a><a href="tel:${phoneHref}">${esc(siteSettings.phone)}</a><small>© ${new Date().getFullYear()} Virsapur</small></div>
</footer>`;
}

function breadcrumbs(route, items, { visible = true } = {}) {
  const html = visible ? `<nav class="breadcrumb" aria-label="Breadcrumb">${items.map(item => item.path ? `<a href="${hrefFor(route, item.path)}">${esc(item.label)}</a><span aria-hidden="true">›</span>` : `<span aria-current="page">${esc(item.label)}</span>`).join("")}</nav>` : "";
  const schema = { "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.label, item: canonicalFor(item.path || route) })) };
  return { html, schema };
}

function pageHero(route, { eyebrow, title, intro, image, alt, compact = false }) {
  const heroImage = image ? picture(route, { src: image, alt: alt || "" }, { className: "page-hero-image", loading: "eager", fetchpriority: "high", sizes: "(max-width: 820px) 100vw, 48vw" }) : "";
  return `<section class="page-hero${image ? " has-image" : ""}${compact ? " compact" : ""}"><div><p class="overline">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p>${esc(intro)}</p></div>${heroImage}</section>`;
}

function cta(route, title = "Start a conversation about heritage.", summary = "For programmes, research, education and collaboration.") {
  return `<section class="page-cta"><p class="overline">Work with Virsapur</p><h2>${esc(title)}</h2><p>${esc(summary)}</p><a class="button light" href="${hrefFor(route, "/contact")}">Contact Virsapur</a></section>`;
}

function shell({ route, active, title, description, main, status = "published", socialImage = siteSettings.defaultSeoImage, schema = [], bodyClass = "" }) {
  const indexable = status === "published";
  const canonical = canonicalFor(route);
  const social = imageRecord(socialImage);
  const socialPath = optimizedImagePath(social, 1280);
  const socialUrl = `${siteOrigin}/${socialPath}`;
  const schemas = [{ "@type": "WebPage", name: title, description, url: canonical, isPartOf: { "@id": `${siteOrigin}/#website` } }, ...schema];
  const jsonLd = { "@context": "https://schema.org", "@graph": schemas };
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}">
<meta name="robots" content="${indexable ? "index,follow,max-image-preview:large" : "noindex,nofollow"}"><meta property="og:locale" content="en_PK"><meta property="og:type" content="website"><meta property="og:site_name" content="Virsapur"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${socialUrl}"><meta property="og:image:width" content="${Math.min(social.width, 1280)}"><meta property="og:image:height" content="${Math.round(social.height * Math.min(social.width, 1280) / social.width)}"><meta property="og:image:alt" content="${esc(social.alt || title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${socialUrl}">
<meta name="theme-color" content="#f6f0e6"><link rel="icon" href="${assetFor(route, optimizedImagePath("assets/logo_full_slate.png", 640))}" type="image/webp"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="${assetFor(route, "styles.css?v=v1-refinement-1")}"><script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script></head>
<body class="${bodyClass}" data-route="${route}" data-content-status="${status}" data-contact-connected="${String(siteSettings.integrations.contact.connected)}">${header(route, active)}<main id="main">${main}</main>${footer(route)}<script src="${assetFor(route, "app.js?v=v1-refinement-1")}" defer></script></body></html>`;
}

function mapModule(route, { full = false } = {}) {
  const scripts = ["assets/maps/pakistan-admin-1.js", "data/administrative-snapshot.js", "data/regions.js", "data/districts.js", "components/heritage-map.js"].map(path => assetFor(route, path));
  return `<section class="map-section${full ? " map-section-full" : ""}${route === "/" ? " home-map-section" : ""}" id="map"><div class="map-heading"><div><p class="overline">${esc(homepage.map.eyebrow)}</p><h2>${esc(homepage.map.title)}</h2><p>${esc(homepage.map.summary)}</p></div><a class="button light" href="${hrefFor(route, "/heritage-map")}">${full ? "Map overview" : esc(homepage.map.cta.label)}</a></div>
  <div class="map-app" data-heritage-map data-map-scripts='${esc(JSON.stringify(scripts))}'>
    <div class="map-topbar"><nav class="map-crumbs" aria-label="Current map location"></nav><div><span class="layer-name">Country view</span><button class="map-prev" type="button" hidden>Back to Pakistan</button></div></div>
    <div class="map-stage"><div class="map-summary" aria-live="polite"></div><div class="map-load-status" role="status" hidden><p></p><button type="button" hidden>Retry district data</button></div><svg id="pakistan-map" viewBox="0 0 960 720" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="pakistan-map-title pakistan-map-description"><title id="pakistan-map-title">Interactive map of Pakistan’s provinces, regions and districts</title><desc id="pakistan-map-description">Select one of seven geographic regions, then select a district.</desc><defs><filter id="map-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="7" stdDeviation="8" flood-color="#30333a" flood-opacity=".16"/></filter></defs><g class="map-vector-viewport"><g class="map-region-paths"></g><g class="map-region-labels"></g></g><g class="map-district-viewport" hidden><path class="map-parent-outline" fill-rule="evenodd" vector-effect="non-scaling-stroke"></path><g class="map-district-paths"></g><g class="map-district-labels" aria-hidden="true"></g></g></svg><div class="map-scope"><span>Pakistan → province / region → district</span></div></div>
  </div>
  <details class="map-methodology"><summary>Map data & methodology</summary><p data-admin-attribution>Administrative boundaries are compiled from WFP/UNOCHA COD and verified provincial administrative sources, including Pakistan Bureau of Statistics Digital Census 2023. Punjab reflects the latest verified structure available to Virsapur; other regions retain their stated review status.</p><p>The map stops at district level and uses stable geographic identifiers so editorial records can be connected later without creating empty public place pages.</p></details></section>`;
}

function homePage() {
  const route = "/";
  const currentRecords = homepageCurrent.filter(item => item.status === "published");
  const testimonial = publishedTestimonials.find(item => item.id === homepage.about.testimonialId);
  const experienceRecords = homepage.experiences.programmeIds.map(id => publishedProgrammes.find(item => item.id === id)).filter(Boolean);
  const featuredExperience = experienceRecords.find(item => item.id === homepage.experiences.featuredProgrammeId) || experienceRecords[0];
  const secondaryExperiences = experienceRecords.filter(item => item.id !== featuredExperience?.id);

  const renderHero = () => `<section class="discovery-hero"><div class="discovery-hero-media">${picture(route, homepage.hero.image, { loading: "eager", fetchpriority: "high", sizes: "100vw" })}</div><div class="discovery-hero-shade"></div><div class="discovery-hero-content"><p class="overline">${esc(homepage.hero.eyebrow)}</p><h1>${esc(homepage.hero.title)}</h1><p>${esc(homepage.hero.summary)}</p><div class="hero-actions">${homepage.hero.actions.map(action => `<a class="button ${action.style}" href="${hrefFor(route, action.route)}">${esc(action.label)}<span aria-hidden="true">→</span></a>`).join("")}</div></div><p class="hero-place">${esc(homepage.hero.image.caption)}</p></section>`;

  const renderQuickDiscovery = () => `<section class="quick-discovery" aria-label="Explore Virsapur">${homepage.quickDiscovery.map((item, index) => `<a href="${hrefFor(route, item.route)}"><span class="quick-index">0${index + 1}</span><span><small>${esc(item.eyebrow)}</small><strong>${esc(item.title)}</strong></span><b aria-hidden="true">↗</b></a>`).join("")}</section>`;

  const renderCurrent = () => currentRecords.length ? `<section class="home-current section"><div class="home-section-intro"><p class="overline">What’s happening</p><h2>See what’s happening with Virsapur.</h2></div><div class="current-grid">${currentRecords.map(item => `<a href="${hrefFor(route, item.route)}">${picture(route, item.image, { sizes: "(max-width: 760px) 100vw, 33vw" })}<div><p>${esc(item.type)} · ${esc(item.date)}${item.location ? ` · ${esc(item.location)}` : ""}</p><h3>${esc(item.title)}</h3><span>${esc(item.ctaLabel || "Explore")} →</span></div></a>`).join("")}</div></section>` : "";

  const experienceCard = (item, featured = false) => `<a class="experience-card${featured ? " is-featured" : ""}" href="${hrefFor(route, `/service/${item.slug}`)}">${picture(route, item.featuredImage, { sizes: featured ? "(max-width: 760px) 100vw, 60vw" : "(max-width: 760px) 100vw, 31vw" })}<span class="experience-shade"></span><div><p>${esc(homepage.experiences.categoryLabels[item.id] || "Programme")}</p><h3>${esc(item.title)}</h3><span>Explore <b aria-hidden="true">→</b></span></div></a>`;
  const renderExperiences = () => `<section class="home-experiences section"><div class="home-section-intro"><div><p class="overline">${esc(homepage.experiences.eyebrow)}</p><h2>${esc(homepage.experiences.title)}</h2></div><div><p>${esc(homepage.experiences.summary)}</p><a class="text-action" href="${hrefFor(route, homepage.experiences.cta.route)}">${esc(homepage.experiences.cta.label)} <span aria-hidden="true">→</span></a></div></div><div class="experience-grid">${featuredExperience ? experienceCard(featuredExperience, true) : ""}<div class="experience-small-grid">${secondaryExperiences.map(item => experienceCard(item)).join("")}</div></div></section>`;

  const renderStories = () => {
    if (!publishedStories.length) return "";
    const [feature, ...secondary] = publishedStories.slice(0, 3);
    const storyCard = (item, featured = false) => `<a class="story-card${featured ? " is-featured" : ""}" href="${hrefFor(route, `/archives/${item.slug}`)}">${picture(route, item.featuredImage, { sizes: featured ? "(max-width: 760px) 100vw, 65vw" : "(max-width: 760px) 100vw, 32vw" })}<div><p>${esc(item.category)}${item.location ? ` · ${esc(item.location)}` : ""}</p><h3>${esc(item.title)}</h3>${item.summary ? `<span>${esc(item.summary)}</span>` : ""}</div></a>`;
    return `<section class="home-stories section"><div class="home-section-intro"><div><p class="overline">${esc(homepage.stories.eyebrow)}</p><h2>${esc(homepage.stories.title)}</h2></div><div><p>${esc(homepage.stories.summary)}</p><a class="text-action" href="${hrefFor(route, homepage.stories.cta.route)}">${esc(homepage.stories.cta.label)} <span aria-hidden="true">→</span></a></div></div><div class="story-grid">${storyCard(feature, true)}<div>${secondary.map(item => storyCard(item)).join("")}</div></div></section>`;
  };

  const renderProjects = () => publishedProjects.length ? `<section class="home-projects section"><div class="home-section-intro"><p class="overline">${esc(homepage.projects.eyebrow)}</p><h2>${esc(homepage.projects.title)}</h2></div><div class="project-preview-grid">${publishedProjects.slice(0, 3).map(item => `<a href="${hrefFor(route, `/projects/${item.slug}`)}">${picture(route, item.featuredImage)}<p>${esc(item.location || "Virsapur project")}</p><h3>${esc(item.title)}</h3></a>`).join("")}</div></section>` : "";

  const renderAbout = () => `<section class="home-about"><div class="about-mosaic"><div class="about-image-tall">${picture(route, homepage.about.images[0], { sizes: "(max-width: 760px) 60vw, 31vw" })}</div><div class="about-image-wide">${picture(route, homepage.about.images[1], { sizes: "(max-width: 760px) 70vw, 31vw" })}</div><div class="about-image-small">${picture(route, homepage.about.images[2], { sizes: "(max-width: 760px) 55vw, 24vw" })}</div></div><div class="about-home-copy"><p class="overline">${esc(homepage.about.eyebrow)}</p><h2>${esc(homepage.about.title)}</h2><p>${esc(homepage.about.summary)}</p><a class="text-action light-action" href="${hrefFor(route, homepage.about.cta.route)}">${esc(homepage.about.cta.label)} <span aria-hidden="true">→</span></a>${testimonial ? `<blockquote><p>“${esc(testimonial.quote)}”</p><footer>${esc(testimonial.attribution)}</footer></blockquote>` : ""}</div></section>`;

  const renderFinalAction = () => `<section class="home-final-action">${picture(route, homepage.finalAction.image, { decorative: true, sizes: "100vw" })}<span class="final-action-shade"></span><div><p class="overline">${esc(homepage.finalAction.eyebrow)}</p><h2>${esc(homepage.finalAction.title)}</h2><p>${esc(homepage.finalAction.summary)}</p><div>${homepage.finalAction.actions.map(action => `<a class="button ${action.style}" href="${hrefFor(route, action.route)}">${esc(action.label)}<span aria-hidden="true">→</span></a>`).join("")}</div></div></section>`;

  const renderers = { hero: renderHero, quickDiscovery: renderQuickDiscovery, current: renderCurrent, map: () => mapModule(route), experiences: renderExperiences, stories: renderStories, projects: renderProjects, about: renderAbout, finalAction: renderFinalAction };
  const main = homepage.modules.filter(module => module.enabled && renderers[module.type]).map(module => renderers[module.type]()).join("");
  return shell({ route, active: "home", title: homepage.seo.title, description: homepage.seo.description, main, socialImage: homepage.hero.image, schema: [{ "@type": "WebSite", "@id": `${siteOrigin}/#website`, name: siteSettings.name, url: `${siteOrigin}/` }, { "@type": "Organization", "@id": `${siteOrigin}/#organization`, name: siteSettings.name, url: `${siteOrigin}/`, email: siteSettings.email, telephone: siteSettings.phone }] });
}

function aboutPage() {
  const route = "/why-virsapur";
  const founders = people.filter(item => item.status === "published").map(person => `<article>${picture(route, person.image, { sizes: "(max-width: 760px) 100vw, 40vw" })}<div><p class="overline">${esc(person.role)}</p><h3>${esc(person.name)}</h3><p>${esc(person.biography)}</p></div></article>`).join("");
  const main = `${pageHero(route, { eyebrow: "Purpose · people · preservation", title: "Why Virsapur?", intro: "Making Pakistan’s heritage visible, understandable and worth protecting.", image: "assets/fresco_room.jpg", alt: "Painted architectural detail" })}
  <section class="editorial-layout section"><div><p class="overline">Who we are</p><h2>History becomes meaningful when people can find themselves within it.</h2></div><div class="prose"><p>Virsapur is a cultural enterprise dedicated to making Pakistan’s history, heritage and diverse cultural identity accessible to all. Through research-driven programmes, heritage tours, workshops and digital storytelling, Virsapur reconnects communities with their cultural roots.</p><p>We work at the intersection of heritage preservation, education and cultural engagement so the past can become a source of knowledge, pride and agency for the future.</p></div></section>
  <section class="mission-band section"><div><p class="overline">Mission</p><h2>From scholarship to public curiosity.</h2></div><p>Virsapur bridges historical knowledge and public engagement through immersive experiences, documentation and digital storytelling, with attention to under-explored places and community narratives.</p></section>
  <section class="founders section"><div class="section-heading"><p class="overline">People</p><h2>Founders</h2></div><div class="founder-grid">${founders}</div></section>${cta(route)}`;
  return shell({ route, active: "about", title: "Why Virsapur | Purpose, people and approach", description: "Learn about Virsapur’s purpose, founders and approach to making Pakistan’s heritage accessible.", main, socialImage: "assets/fresco_room.jpg" });
}

function programmesPage() {
  const route = "/programmes";
  const rows = publishedProgrammes.map((item, index) => `<article class="zigzag-row${index % 2 ? " is-reversed" : ""}">${picture(route, item.featuredImage, { sizes: "(max-width: 820px) 100vw, 48vw" })}<div><p class="overline">0${index + 1} · Programme</p><h2>${esc(item.title)}</h2><p>${esc(item.summary)}</p><a href="${hrefFor(route, `/service/${item.slug}`)}">View programme <span aria-hidden="true">→</span></a></div></article>`).join("");
  const main = `${pageHero(route, { eyebrow: "Experience · learning · research", title: "Programmes rooted in place.", intro: "Four clear ways to work with Virsapur across experiences, learning, research and cultural collaboration.", image: "assets/temple_angle.jpg", alt: "Historic temple architecture" })}<section class="zigzag-section section">${rows}</section>${cta(route, "Find the right way to work together.")}`;
  return shell({ route, active: "programmes", title: "Programmes | Virsapur", description: "Explore Virsapur heritage tours, learning programmes, research work and cultural collaborations.", main, socialImage: "assets/temple_angle.jpg" });
}

function programmePage(item) {
  const route = `/service/${item.slug}`;
  const crumb = breadcrumbs(route, [{ label: "Home", path: "/" }, { label: "Programmes", path: "/programmes" }, { label: item.title }]);
  const factLabels = { audience: "Who it is for", format: "Format", duration: "Duration", location: "Location", availability: "Availability", price: "Price" };
  const facts = Object.entries(item.practical).filter(([, value]) => value).map(([key, value]) => `<div><dt>${factLabels[key]}</dt><dd>${esc(value)}</dd></div>`).join("");
  const main = `${crumb.html}${pageHero(route, { eyebrow: "Virsapur programme", title: item.title, intro: item.summary, image: item.featuredImage.src, alt: item.featuredImage.alt })}<section class="programme-detail section"><div><p class="overline">Overview</p><h2>${esc(item.summary)}</h2></div><div class="prose"><p>${esc(item.body)}</p>${facts ? `<dl class="fact-grid">${facts}</dl>` : ""}<a class="button" href="${hrefFor(route, item.cta.target)}" data-action="programme-enquiry" data-programme-id="${item.id}">${esc(item.cta.label)}</a></div></section>`;
  return shell({ route, active: "programmes", title: item.seo.title, description: item.seo.description, main, socialImage: item.featuredImage, schema: [crumb.schema] });
}

function heritageMapPage() {
  const route = "/heritage-map";
  const main = `${pageHero(route, { eyebrow: "Pakistan · province · district", title: "Heritage Map of Pakistan", intro: "Explore Pakistan through a three-level map designed to connect cultural stories, programmes and research to place.", image: "assets/hero-badshahi.jpg", alt: "Aerial view of Badshahi Mosque and Lahore" })}<section class="map-intro section"><div><p class="overline">How to explore</p><h2>Start broad. Move closer.</h2></div><ol><li><span>01</span><strong>Pakistan</strong><p>Choose a province or region.</p></li><li><span>02</span><strong>Province or region</strong><p>Review its districts.</p></li><li><span>03</span><strong>District</strong><p>Open a focused geographic view.</p></li></ol></section>${mapModule(route, { full: true })}${cta(route, "Contribute research or geographic context.")}`;
  return shell({ route, active: "map", title: "Heritage Map of Pakistan | Virsapur", description: "Explore Virsapur’s interactive Heritage Map of Pakistan across provinces, regions and districts.", main, socialImage: "assets/hero-badshahi.jpg", schema: [{ "@type": "CollectionPage", name: "Heritage Map of Pakistan", url: canonicalFor(route) }] });
}

function archivesPage() {
  const route = "/archives";
  const listing = publishedStories.length ? `<section class="archive-browser section"><label for="archive-search">Search the Archives</label><input id="archive-search" type="search" data-archive-search><p data-archive-results>${publishedStories.length} stories</p><div data-archive-grid>${publishedStories.map(story => `<article data-search="${esc(`${story.title} ${story.category} ${story.location}`.toLowerCase())}"><a href="${hrefFor(route, `/archives/${story.slug}`)}">${picture(route, story.featuredImage)}<h2>${esc(story.title)}</h2></a></article>`).join("")}</div></section>` : `<section class="archive-direction section"><div><p class="overline">Explore by place</p><h2>Use the Heritage Map to move from Pakistan to province and district.</h2><p>The Archives will bring together researched cultural stories as complete editorial records are published.</p><a class="button" href="${hrefFor(route, "/heritage-map")}">Explore the Heritage Map</a></div>${picture(route, "assets/archive-architecture.webp", { decorative: true })}</section>`;
  const main = `${pageHero(route, { eyebrow: "Places · objects · cultural memory", title: "Archives", intro: "A home for researched stories about Pakistan’s built heritage, archaeology and living traditions.", image: "assets/archive-architecture.webp", alt: "Ancient brick architecture at Mohenjo-daro" })}${listing}${cta(route, "Share knowledge or propose a story.")}`;
  return shell({ route, active: "archives", title: "Archives | Virsapur", description: "Explore Virsapur’s platform for stories about Pakistan’s places, objects, architecture and living heritage.", main, socialImage: "assets/archive-architecture.webp" });
}

function contactPage() {
  const route = "/contact";
  const main = `${pageHero(route, { eyebrow: "Get in touch", title: "Start a conversation about heritage.", intro: "For programmes, research, education and cultural collaboration.", image: "assets/temple-shadow.jpg", alt: "Historic stone architecture" })}<section class="contact-page section"><div><p class="overline">Contact details</p><h2>Virsapur</h2><dl><div><dt>Phone</dt><dd><a href="tel:${phoneHref}">${esc(siteSettings.phone)}</a></dd></div><div><dt>Email</dt><dd><a href="mailto:${siteSettings.email}">${siteSettings.email}</a></dd></div></dl></div><form data-contact-form data-action="contact-submit" novalidate><div><label for="contact-name">Name</label><input id="contact-name" name="name" autocomplete="name" required></div><div><label for="contact-email">Email address</label><input id="contact-email" name="email" type="email" autocomplete="email" required></div><div class="full"><label for="contact-type">Enquiry type</label><select id="contact-type" name="type"><option value="general">General enquiry</option><option value="heritage-tours">Heritage tours</option><option value="workshops">Workshops and learning</option><option value="research">Research and projects</option><option value="collaboration">Collaboration</option></select></div><div class="full"><label for="contact-message">Message</label><textarea id="contact-message" name="message" rows="6" required></textarea></div><div class="full"><button class="button" type="submit">Send enquiry</button><p class="form-note" aria-live="polite" data-form-note></p></div></form></section>`;
  return shell({ route, active: "contact", title: "Contact Virsapur", description: "Contact Virsapur about heritage programmes, research projects and collaborations.", main, socialImage: "assets/temple-shadow.jpg" });
}

function draftCollectionPage(route, record) {
  return shell({ route, active: "programmes", title: record.seo.title, description: record.seo.description, status: record.status, main: `${pageHero(route, { eyebrow: "Virsapur", title: record.title, intro: record.summary, compact: true })}<section class="draft-direction section"><a class="button" href="${hrefFor(route, "/programmes")}">Explore published programmes</a></section>` });
}

function draftProjectPage(item) {
  const route = `/projects/${item.slug}`;
  const crumb = breadcrumbs(route, [{ label: "Home", path: "/" }, { label: "Programmes", path: "/programmes" }, { label: item.title }]);
  return shell({ route, active: "programmes", title: item.seo.title, description: item.seo.description, status: item.status, socialImage: item.featuredImage, schema: [crumb.schema], main: `${crumb.html}${pageHero(route, { eyebrow: "Project record", title: item.title, intro: item.summary, image: item.featuredImage.src, alt: item.featuredImage.alt })}<section class="draft-direction section"><a class="button" href="${hrefFor(route, "/contact")}">Discuss a heritage project</a></section>` });
}

function draftStoryPage(item) {
  const route = `/archives/${item.slug}`;
  const crumb = breadcrumbs(route, [{ label: "Home", path: "/" }, { label: "Archives", path: "/archives" }, { label: item.title }]);
  return shell({ route, active: "archives", title: item.seo.title, description: item.seo.description, status: item.status, socialImage: item.featuredImage, schema: [crumb.schema], main: `${crumb.html}<article class="story-record"><header><p class="overline">${esc(item.category)}${item.location ? ` · ${esc(item.location)}` : ""}</p><h1>${esc(item.title)}</h1></header>${picture(route, item.featuredImage, { className: "story-image", loading: "eager", fetchpriority: "high", sizes: "100vw" })}<div><a href="${hrefFor(route, "/heritage-map")}">Explore the Heritage Map →</a></div></article>` });
}

function redirectPage(route, target, label) {
  const href = hrefFor(route, target);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(label)} | Virsapur</title><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="${canonicalFor(target)}"><meta http-equiv="refresh" content="0;url=${href}"><script>location.replace(${JSON.stringify(href)})</script></head><body><p><a href="${href}">Continue to ${esc(label)}</a></p></body></html>`;
}

function notFoundPage() {
  const route = "/404";
  const main = `<section class="not-found"><p class="overline">404 · Page not found</p><h1>This path doesn’t lead to a Virsapur page.</h1><p>Choose a destination below to continue exploring.</p><nav><a href="${hrefFor(route, "/")}">Home</a><a href="${hrefFor(route, "/programmes")}">Programmes</a><a href="${hrefFor(route, "/heritage-map")}">Heritage Map</a><a href="${hrefFor(route, "/archives")}">Archives</a><a href="${hrefFor(route, "/contact")}">Contact</a></nav></section>`;
  return shell({ route, active: "", title: "Page not found | Virsapur", description: "The requested Virsapur page could not be found.", status: "draft", main });
}

async function writeRoute(route, html, { status = "published", listed = true, sitemap = status === "published", type = "page", redirectTo = null } = {}) {
  const path = route === "/" ? join(outputRoot, "index.html") : join(outputRoot, route.slice(1), "index.html");
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, html, "utf8");
  routeManifest.push({ route, status, listed, indexable: status === "published", sitemap, type, redirectTo });
}

await writeRoute("/", homePage());
await writeRoute("/home", redirectPage("/home", "/", "Virsapur home"), { status: "archived", listed: false, sitemap: false, type: "redirect", redirectTo: "/" });
await writeRoute("/why-virsapur", aboutPage());
await writeRoute("/programmes", programmesPage());
await writeRoute("/heritage-map", heritageMapPage());
await writeRoute("/archives", archivesPage());
await writeRoute("/contact", contactPage());
for (const item of publishedProgrammes) {
  await writeRoute(`/service/${item.slug}`, programmePage(item), { type: "programme" });
  await writeRoute(`/service/${item.legacySlug}`, redirectPage(`/service/${item.legacySlug}`, `/service/${item.slug}`, item.title), { status: "archived", listed: false, sitemap: false, type: "redirect", redirectTo: `/service/${item.slug}` });
}
await writeRoute("/trails", draftCollectionPage("/trails", trailsPage), { status: trailsPage.status, listed: false, sitemap: false });
await writeRoute("/workshops", draftCollectionPage("/workshops", workshopsPage), { status: workshopsPage.status, listed: false, sitemap: false });
await writeRoute("/courses", draftCollectionPage("/courses", coursesPage), { status: coursesPage.status, listed: false, sitemap: false });
await writeRoute("/projects", draftCollectionPage("/projects", { status: "draft", title: "Projects", summary: "Research, documentation and preservation work led with care for place and context.", seo: { title: "Projects | Virsapur", description: "Virsapur heritage project records." } }), { status: "draft", listed: false, sitemap: false });
for (const item of projects) await writeRoute(`/projects/${item.slug}`, draftProjectPage(item), { status: item.status, listed: false, sitemap: false, type: "project" });
for (const item of stories) await writeRoute(`/archives/${item.slug}`, draftStoryPage(item), { status: item.status, listed: false, sitemap: false, type: "story" });
await writeRoute("/404", notFoundPage(), { status: "archived", listed: false, sitemap: false, type: "utility" });

const sitemapRoutes = routeManifest.filter(item => item.sitemap && item.indexable).map(item => item.route);
await writeFile(join(outputRoot, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapRoutes.map(route => `<url><loc>${canonicalFor(route)}</loc></url>`).join("")}</urlset>\n`, "utf8");
await writeFile(join(outputRoot, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`, "utf8");
await writeFile(join(outputRoot, "route-manifest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), siteOrigin, routes: routeManifest }, null, 2) + "\n", "utf8");
await writeFile(join(outputRoot, "404.html"), notFoundPage().replaceAll("../", ""), "utf8");

await mkdir(join(outputRoot, "assets", "maps"), { recursive: true });
await mkdir(join(outputRoot, "components"), { recursive: true });
await mkdir(join(outputRoot, "data"), { recursive: true });
await cp(join(root, "styles.css"), join(outputRoot, "styles.css"));
await cp(join(root, "app.js"), join(outputRoot, "app.js"));
await cp(join(root, "assets", "optimized"), join(outputRoot, "assets", "optimized"), { recursive: true });
await cp(join(root, "assets", "maps", "pakistan-admin-1.js"), join(outputRoot, "assets", "maps", "pakistan-admin-1.js"));
await cp(join(root, "assets", "maps", "runtime"), join(outputRoot, "assets", "maps", "runtime"), { recursive: true });
await cp(join(root, "components", "heritage-map.js"), join(outputRoot, "components", "heritage-map.js"));
for (const file of ["administrative-snapshot.js", "regions.js", "districts.js"]) await cp(join(root, "data", file), join(outputRoot, "data", file));

await writeFile(join(root, "vercel.json"), JSON.stringify({ buildCommand: "npm run build", outputDirectory: "dist", cleanUrls: true, trailingSlash: false, redirects: [{ source: "/home", destination: "/", permanent: true }, ...publishedProgrammes.map(item => ({ source: `/service/${item.legacySlug}`, destination: `/service/${item.slug}`, permanent: true }))] }, null, 2) + "\n", "utf8");
console.log(`Built ${routeManifest.length} routes (${sitemapRoutes.length} indexable) for ${siteOrigin}.`);
*/
