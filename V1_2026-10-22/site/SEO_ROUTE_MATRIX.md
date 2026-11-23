# SEO Route Matrix

Canonical URLs are generated from `SITE_ORIGIN`. The current fallback is `https://virsapur-frontend.vercel.app`; it must be confirmed or replaced before launch.

| Route family | State | Robots | Sitemap | Structured data |
|---|---|---|---|---|
| `/` | Published | index, follow | Yes | WebPage, WebSite, Organization |
| `/why-virsapur` | Published | index, follow | Yes | WebPage |
| `/programmes` | Published | index, follow | Yes | WebPage |
| Four `/service/{slug}` routes | Published | index, follow | Yes | WebPage, BreadcrumbList |
| `/heritage-map` | Published | index, follow | Yes | WebPage, CollectionPage |
| `/archives` | Published | index, follow | Yes | WebPage |
| `/archives/all` | Published | index, follow | Yes | WebPage |
| Dynamic `/archives/category/{slug}` routes | Published category | index, follow | Yes | WebPage, CollectionPage, BreadcrumbList |
| `/contact` | Published | index, follow | Yes | WebPage |
| `/home` and four legacy service paths | Redirect | noindex | No | None |
| Trails/workshops/courses/projects collections | Draft | noindex, nofollow | No | WebPage |
| Project and story detail records | Record status | Published records only | Published records only | WebPage/Article, BreadcrumbList |
| 404 | Utility | noindex, nofollow | No | WebPage |

Each non-redirect route receives a unique title/description, one H1, canonical URL, page-specific social image where available, Open Graph image dimensions/alt, Twitter card metadata and valid JSON-LD. Draft content is not eligible for public listings or the sitemap.
