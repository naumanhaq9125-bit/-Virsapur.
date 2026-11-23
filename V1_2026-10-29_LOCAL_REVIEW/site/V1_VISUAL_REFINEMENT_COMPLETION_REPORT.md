# Virsapur Homepage — Final V1 Visual Refinement Pass

## Removed

- Oversized 28–92px component and section radii.
- Global pill-shaped buttons and menu controls.
- Rounded discovery cards inside a rounded discovery shell.
- Arbitrary asymmetric programme-card corners.
- Rounded full-section containers on the hero, About section, final CTA and footer.
- The appended visual-softness override block and its conflicting tokens.
- Prominent floating-panel shadows from normal content cards.

## Refined

- Hero: restored as a square-edged, full photographic opening with the existing concise proposition and two-action hierarchy.
- Discovery: rebuilt as one lightly elevated 12–16px surface with four typographic pathways separated by restrained hairlines; individual options have no card radius.
- Heritage Map: retained unchanged functionally, with a 16px outer radius and restrained elevated shadow; the mobile introduction now stacks correctly.
- Experiences: retained the one-large-plus-three composition, standardized all cards at 16px, reduced hover lift and image scale, and added accurate semantic labels: Experience, Learn, Our work, and Events & collaboration.
- About: restored as a full-width Museum Ink interruption; the dominant photograph is square-edged while supporting images use a modest 12px radius.
- Final CTA: restored to a full-width photographic conclusion with controlled overlay and concise actions.
- Footer: restored to a grounded, full-width dark field with no decorative shoulders.
- Buttons: standardized at 8px with restrained colour shifts, 1px lift, visible focus states, and no pills outside compact map controls.
- Shadows: reduced to two shared levels and applied only where hierarchy benefits.
- Photography: kept in natural colour with no global desaturation; overlays remain limited to text-legibility contexts.

## Design system

- Radius scale: 3px (`xs`), 8px (`sm`), 12px (`md`), 16px (`lg`). Values above 24px are not used by the V1 refinement system.
- Shadow scale: subtle `0 2px 8px rgba(48,51,58,.08)` and elevated `0 10px 30px rgba(48,51,58,.14)`.
- Button rules: Terracotta primary, Slate/Ink or transparent secondary, 8px radius, high-contrast text, restrained hover movement, and animated text-action arrows.
- Surface rules: Parchment for the main page, Slate for the map, Museum Ink for institutional/footer fields, Sandstone for future warm secondary modules, Terracotta for primary emphasis.
- Typography rules: EB Garamond for the hero, major headings and quotation; Inter for navigation, labels, metadata, descriptions, map UI and actions.

## Screenshots

Homepage QA:

- `virsapur-v1-refined-1440x900.png`
- `virsapur-v1-refined-1280x800.png`
- `virsapur-v1-refined-768x1024.png`
- `virsapur-v1-refined-430x932.png`
- `virsapur-v1-refined-375x812.png`
- `virsapur-v1-refined-1440-full-page.png`

Regression QA:

- `virsapur-v1-regression-programmes-1280x800.png`
- `virsapur-v1-regression-heritage-map-1280x800.png`
- `virsapur-v1-regression-archives-1280x800.png`
- `virsapur-v1-regression-why-virsapur-1280x800.png`
- `virsapur-v1-regression-contact-1280x800.png`
- `virsapur-v1-regression-service-heritage-tours-1280x800.png`

## Regressions

- Heritage Map country-to-province navigation works; Balochistan correctly opened its district-selection view.
- Desktop and mobile navigation work, including the full-screen mobile menu.
- All five required viewport widths render without horizontal overflow.
- No new browser console errors or warnings were recorded.
- Programmes, Heritage Map, Archives, Why Virsapur, Contact and Heritage Tours remain functional and visually intact.
- The build contains 34 routes, 10 indexable routes, and passes automated QA with zero errors and zero warnings.
- SEO metadata, publication-state logic, conditional homepage modules, responsive images, accessibility structure, CMS-ready content data and map geometry remain intact.
