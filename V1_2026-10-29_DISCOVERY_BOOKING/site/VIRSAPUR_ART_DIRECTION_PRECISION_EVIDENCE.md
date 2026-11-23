# Virsapur Art Direction & Precision Pass — Evidence

## Panel refinement

- Editorial panels retain the approved white surface, 1 px ink boundary, 12 px radius, and no resting shadow.
- Hover is limited to a 2 px lift, a 1.026 image scale, a slightly firmer boundary, a restrained shadow, the short terracotta edge cue, and arrow movement. Titles remain Museum Ink.
- Image/body divider lines were removed where the image edge already provides separation.
- Programme collections render four across at 1280 px and above, two across from tablet through 1279 px, and one across on mobile.
- What’s On cards now lead with a day/month lockup and a quieter time/location line.
- Archive controls use consistent field heights, labels, boundaries, and a deliberately subordinate reset action. Filter logic is unchanged.

## Photography

- Panels select one of four controlled image treatments from the source asset’s intrinsic dimensions: portrait, landscape, panoramic, or square.
- Existing focal metadata remains the source of `object-position`; no content records or source images were changed.
- Replacement priorities are documented in [VIRSAPUR_IMAGE_ART_DIRECTION_REPORT.md](./VIRSAPUR_IMAGE_ART_DIRECTION_REPORT.md).

## Heritage Map

- The map shell now has a 3 px edge, no drop shadow, a shallower toolbar, and a larger visual relationship to its containing section.
- Region hover no longer transforms polygon geometry. It uses stroke, brightness, and restrained sibling dimming only.
- Country-to-region choreography is an opacity crossfade, with map context retained inside the stage and methodology left subordinate.
- Verified interaction: Punjab drilldown updated the URL to `#map/punjab`; region and district identifiers/data were not changed.

## Hierarchy

- Homepage sequence is now Hero → Quick discovery → Heritage Map → What’s On → Experiences → Stories → Projects → Themes → Mission → About → Collaborators → Final invitation.
- Founders are presented as a paired, side-by-side portrait composition on desktop and stack on mobile; alternating/zigzag placement was removed.
- Collaborators sit on an open white field with horizontal framing and no cell boxes, lift, shadow, or scale effect.

## Motion

- Motion is limited to the hero/final photographic drift, panel collections, key page photography, and map transitions.
- Ordinary prose, mission content, filters, utilities, collaborators, and footer are excluded from reveal choreography.
- Panel reveal is 12 px over 640 ms with 60 ms sibling stagger.
- Sequential captures document hero timing at 0/800 ms and map timing at country/140/660 ms.
- The reduced-motion branch forces reveal content visible and disables panel, image, map, label, summary, collaborator, and ambient movement. The current browser harness cannot emulate the operating-system preference, so this was verified by explicit source assertions rather than a media-emulated screenshot.

## CSS

- One canonical programme-grid definition remains in `src/platform.css`.
- Removed proven-unused selectors for the superseded experience grid/card, current grid, story grid/card, and project preview grid systems.
- The fixed masthead no longer changes its physical height on scroll; only its shadow and the logo’s internal scale change.
- No new fonts, palette values, gradients, decorative elements, or animation libraries were introduced.

## Protected systems

- Studio, Preview/Sandbox, Local Production, Publish to Local Production, schemas, record IDs, publication states, routes, redirects, SEO architecture, filters, programme/project behavior, Heritage Map geography/data/IDs/drilldown, mock payments, authentication/security, and dormant hosted CMS code were not altered.
- Production security QA passed all checks, including demo exclusion, secret scanning, public allowlist, private media policy, owner-only publishing, and disabled hosted endpoints.

## QA

- Baseline: 32 screenshots retained in `qa-screenshots/art-direction-precision/baseline`.
- After: 35 full-page responsive screenshots plus the clean production homepage in `qa-screenshots/art-direction-precision/after`.
- Viewports: 1440 × 900, 1280 × 800, 1920 × 1080, 430 × 932, and 375 × 812.
- Pages: Homepage, Heritage Map, Archives, Programmes, What’s On, Projects, and Why Virsapur (including Founders and Collaborators).
- Hover: Story, Programme, Event, Project, Map region, Collaborator, and Theme link.
- Functional browser checks: Archive keyword filter returned 1 result; What’s On location filter returned 2 results; Punjab map drilldown completed.
- Demo QA: 43 HTML files / 42 routes, 0 errors, 0 warnings.
- Production QA: 19 HTML files / 18 routes / 12 indexable routes, 0 errors, 0 warnings.
- Published to Local Production at `http://127.0.0.1:4173/production/`; browser verification found no DEV or DEMO markers.
