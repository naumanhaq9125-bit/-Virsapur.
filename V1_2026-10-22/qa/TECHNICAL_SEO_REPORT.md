# Technical SEO and discovery QA

**NOT DEPLOYED.** Candidate crawl: PASS. 636 routes, 637 HTML documents, 630 indexable routes and 630 sitemap URLs. 632 JSON-LD blocks parsed; 19192 local references checked; 1398 image elements checked. Errors: 0; warnings: 0; orphans: 0.

Preview crawl: PASS (1074 routes; 0 errors).

Checks include titles, descriptions, duplicate titles/canonicals, canonical origin/route matching, robots, split sitemap membership, JSON-LD parse, one H1, image dimensions/alt, hotlinks, local href/src/srcset, anchors, incoming HTML links and redirect targets/chains. External historical source availability is not the same test as the local link crawl.

The candidate has localhost canonicals intentionally. Before authorized hosting, set CANDIDATE_SITE_ORIGIN to the real HTTPS domain, rebuild and re-run QA. Preview is noindex; the local server also sends noindex/no-follow safety headers. Never deploy the local server as a public host.

Archive pages use a body-free index, URL-backed filters and 12-record pagination. Full article text is loaded on its own route, not embedded in the discovery index. Search is paginated. Separate article/heritage/tour/other sitemap families avoid a fragile hand-maintained list. Structured data does not invent customer ratings, prices, authors or event dates.
