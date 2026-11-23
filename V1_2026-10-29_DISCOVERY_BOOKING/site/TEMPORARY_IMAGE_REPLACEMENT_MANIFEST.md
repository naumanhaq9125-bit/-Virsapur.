# Virsapur Temporary Image Replacement Manifest

**Pass:** Virsapur Public-Site Finesse & Temporary Photography Pass  
**Prepared:** 4 September 2026  
**Status:** Development-only visual placeholders. Replace before public launch.

## Replacement policy

- All 15 photographs are original AI-generated development placeholders created with OpenAI ImageGen and stored locally in `assets/temporary/`.
- They are not documentary evidence of a named site, object, event, person, or completed Virsapur project. Captions and alt text therefore remain generic and do not claim a false identity.
- Existing canonical content records, SEO fields, schemas, routes, publication states, IDs, and source image references remain unchanged.
- A separate visual-only lookup file, `content/data/temporary-image-overrides.json`, applies these replacements. Final licensed photography can replace them one-for-one without a content migration.
- Responsive 640px and up-to-1280px WebP derivatives are stored in `assets/optimized/`. Each placement carries an explicit focal point.
- The real founder photographs were retained; generic people were not substituted for identified individuals.

## Temporary asset register

| Temporary asset | Intended treatment | Focal X/Y | Primary use |
|---|---|---:|---|
| `temp-hero-blue-hour.png` | Cinematic 16:9 | 69/45 | Homepage hero |
| `temp-final-cta-golden-hour.png` | Cinematic 16:9 | 66/48 | Homepage closing invitation |
| `temp-programme-heritage-tours.png` | Documentary 4:3 | 63/47 | Heritage Tours and related events |
| `temp-programme-workshops.png` | Editorial portrait 4:5 | 51/48 | Workshops, learning projects and related events |
| `temp-programme-research-restoration.png` | Documentary 4:3 | 55/51 | Research & Restoration and related events |
| `temp-programme-cultural-events.png` | Documentary 4:3 | 54/48 | Cultural Events & Collaborations |
| `temp-archive-archaeology.png` | Archive landscape 4:3 | 63/48 | Archaeology and water-infrastructure stories |
| `temp-archive-object.png` | Museum portrait 4:5 | 50/48 | Object-led stories |
| `temp-archive-interior.png` | Architectural portrait 4:5 | 58/43 | Historic interiors and About support |
| `temp-archive-street.png` | Archive landscape 4:3 | 68/45 | Historic streets and built-heritage stories |
| `temp-project-documentation.png` | Institutional documentary 4:3 | 55/50 | Documentation projects and Our Work opening |
| `temp-project-preservation.png` | Institutional architecture 4:3 | 39/48 | Preservation projects and Our Work method |
| `temp-event-heritage-walk.png` | Documentary portrait 4:5 | 51/48 | What’s On heritage-walk occurrence |
| `temp-event-architecture-workshop.png` | Workshop-table portrait 4:5 | 50/52 | What’s On architecture-workshop occurrence |
| `temp-event-research-open-studio.png` | Research-desk portrait 4:5 | 50/48 | What’s On research open-studio occurrence |

## Placement replacements

| Placement / record | Previous visible source | Temporary visible source | Final displayed orientation |
|---|---|---|---|
| Homepage hero | `assets/hero-badshahi.jpg` | `temp-hero-blue-hour.png` | Full-bleed 16:9 cinematic |
| Homepage final CTA | `assets/temple_shadow.jpg` | `temp-final-cta-golden-hour.png` | Full-bleed 16:9 cinematic |
| Homepage About primary | `assets/fresco_room.jpg` | `temp-archive-interior.png` | Tall 4:5 editorial |
| Homepage About support | `assets/temple_distant.jpg` | `temp-archive-archaeology.png` | Supporting 3:4 crop |
| Why Virsapur hero | `assets/fresco_room.jpg` | `temp-archive-interior.png` | Tall editorial crop |
| Why Virsapur approach images | `assets/temple_distant.jpg`, `assets/archive-wells.jpg` | `temp-archive-interior.png`, `temp-archive-archaeology.png` | Asymmetric portrait + support |
| Our Work opening | `assets/project-1.png` | `temp-project-documentation.png` | Large 4:3 landscape |
| Our Work method | `assets/temple_angle.jpg` | `temp-project-preservation.png` | Tall documentary crop |
| Heritage Tours | `assets/archive-katas.jpg` | `temp-programme-heritage-tours.png` | 4:3 panel / large detail crop |
| Cultural & Educational Workshops | `assets/fresco_strip.jpg` | `temp-programme-workshops.png` | 4:5 portrait |
| Research & Restoration Projects | `assets/archive-wells.jpg` | `temp-programme-research-restoration.png` | 4:3 documentary |
| Cultural Events & Collaborations | `assets/archive-gurdwara.jpg` | `temp-programme-cultural-events.png` | 4:3 documentary |
| Wells of Mohenjodaro, Mohenjo Daro Architecture, Great Bath | low-resolution archaeology images | `temp-archive-archaeology.png` | 4:3 archive landscape |
| Mohenjo Daro Residential Lanes | `assets/archive-lanes.jpg` | `temp-archive-street.png` | 4:3 archive landscape |
| Priest-King | `assets/archive-priest-king.jpg` | `temp-archive-object.png` | 4:5 museum portrait |
| Tomb of Anarkali | `assets/archive-anarkali.jpg` | `temp-archive-interior.png` | 4:5 architectural portrait |
| Gurdwara Lahura Sahib, Shaheed Ganj | `assets/archive-gurdwara.jpg` | `temp-archive-street.png` | 4:3 archive landscape |
| Katas Raj | `assets/archive-katas.jpg` | `temp-project-preservation.png` | 4:3 architectural landscape |
| Walled City Revitalization Initiative | `assets/project-1.png` | `temp-project-preservation.png` | 4:3 project landscape |
| Heritage documentation & public engagement | `assets/project-2.png` | `temp-project-documentation.png` | 4:3 project landscape |
| Demo stories and projects | assorted working archive images | matching image family above | Controlled 4:5 / 4:3 system |
| Demo heritage walk | programme photograph | `temp-event-heritage-walk.png` | 4:5 event aperture |
| Demo architecture workshop | programme photograph | `temp-event-architecture-workshop.png` | 4:5 event aperture |
| Demo research open studio | programme photograph | `temp-event-research-open-studio.png` | 4:5 event aperture |

The Satgraha Temples, Havan Kund, and Khewra Salt Mines story photographs were retained because their tall source material already supports the approved editorial proportion system.

## Final photography briefs / prompt set

These are the approved replacement directions for either a photographer or a future image-generation iteration:

1. **Hero:** blue-hour monumental Pakistani architecture, subject weighted right, calm negative space left, no travel-poster saturation.
2. **Closing invitation:** heritage landscape at warm golden hour, strong sense of place, subject right of centre, generous copy-safe space.
3. **Heritage Tours:** lived historic street and gateway, small figures only for scale, soft morning light, no commercial signage.
4. **Workshops:** close, tactile portrait of artisan hands and material practice; craft is the subject, not a staged personality portrait.
5. **Research & Restoration:** credible conservation handling, measuring and documentation; natural light and materially accurate surfaces.
6. **Cultural Events:** intimate courtyard gathering with respectful distance, layered audience and architecture, no festival cliché.
7. **Archaeology:** elevated view of excavated brick fabric and water infrastructure, geometric clarity, no speculative reconstruction.
8. **Object:** one historically plausible object in restrained museum light, clean background, no label or false attribution.
9. **Interior:** aged lime plaster, fresco and timber doorway, quiet raking daylight, portrait composition with crop-safe thresholds.
10. **Historic street:** layered masonry and timber balconies, restrained human scale, overcast natural light, no branded storefronts.
11. **Documentation project:** small field team recording architecture with camera, notes and survey equipment; faces secondary.
12. **Preservation project:** dignified restored civic façade, balanced late-afternoon light, architectural detail without postcard treatment.
13. **Heritage-walk occurrence:** small group moving through a plausible historic Pakistani lane, architecture primary, people seen from behind, calm late-afternoon light.
14. **Architecture-workshop occurrence:** participants’ hands studying measured drawings and material samples, tactile paper detail, soft studio daylight, no legible text.
15. **Research open-studio occurrence:** researchers comparing field photographs and measured drawings at an archive table, quiet asymmetry, no legible documents or screens.

## High-priority final photography still needed

- Verified photographs of the exact heritage places named in Archive stories.
- Documentary coverage of real Virsapur tours, workshops, cultural events and conservation work.
- A matched, high-resolution founder portrait session with consistent light, background and crop safety.
- Final hero and closing photographs with confirmed location, credit, consent and usage rights.

## Heritage Map boundary

No Heritage Map implementation, data, SVG, runtime, interaction, layout, typography, spacing, hover, animation or presentation file was modified in this pass.
