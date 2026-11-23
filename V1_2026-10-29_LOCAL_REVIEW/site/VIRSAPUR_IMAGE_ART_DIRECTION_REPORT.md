# Virsapur Image Art Direction Report

This report identifies records whose current source photography limits the intended editorial composition. The build now chooses a restrained panel ratio from each source image’s intrinsic orientation and continues to respect focal-point metadata. No source asset, record, ID, or content field was changed.

| Priority | Record | Current asset | Dimensions | Current limitation | Recommended replacement |
| --- | --- | ---: | ---: | --- | --- |
| High | Cultural & Educational Workshops | `assets/fresco_strip.jpg` | 1035 × 320 | Extremely panoramic decorative detail; it cannot carry a programme portrait without losing context. | Portrait 4:5 documentary photograph of a workshop in progress, with hands and participants visible and room for a calm upper crop. |
| High | Research & Restoration Projects | `assets/archive-wells.jpg` | 640 × 404 | Small landscape image and already reused by archive stories and a demo event. | Landscape 3:2 field-documentation photograph showing researchers, measured fabric, or conservation activity; minimum 1800 px wide. |
| High | Cultural Events & Collaborations | `assets/archive-gurdwara.jpg` | 639 × 426 | Small archival view, reused by multiple stories, and too generic for the programme promise. | Landscape 4:3 gathering or performance image with people, architecture, and a clear central subject. |
| High | Heritage Tours | `assets/archive-katas.jpg` | 640 × 379 | Low-resolution landscape source; a portrait crop removes the spatial character of the site. | Landscape 3:2 guided heritage encounter with a recognisable site and human scale; minimum 1800 px wide. |
| High | Virsapur founders | `assets/founder-ahmad.jpg`, `assets/founder-altamash.jpg` | 1600 × 1200; 787 × 591 | Both sources are landscape photographs, so the approved paired portrait treatment must crop heavily. | Coordinated portrait 4:5 photographs, matching light, camera distance, background restraint, and eye line. |
| High | Tomb of Anarkali | `assets/archive-anarkali.jpg` | 800 × 600 | Modest resolution and limited vertical breathing room around the architecture. | Landscape 4:3 exterior or interior architectural record with corrected verticals and space around the principal façade/detail. |
| High | Priest-King | `assets/archive-priest-king.jpg` | 590 × 388 | Small object image; surrounding context is too shallow for flexible responsive crops. | Portrait 4:5 object study on a quiet museum background, or a high-resolution 4:3 frame with generous negative space. |
| Medium | The wells of Mohenjodaro | `assets/archive-wells.jpg` | 640 × 404 | Source is small and also carries the research programme and demo-event imagery. | Landscape 4:3 archaeological detail with a clear well edge, masonry texture, and scale reference. |
| Medium | Mohenjo Daro Residential Lanes | `assets/archive-lanes.jpg` | 726 × 387 | Wide, shallow source constrains vertical editorial use and may flatten the spatial route. | Landscape 3:2 view down the lane with a strong vanishing point; retain full wall edges and walking surface. |
| Medium | Mohenjo Daro Architecture / Great Bath | `assets/archive-architecture.webp` | 1200 × 628 | The same broad architectural source supports two separate records, weakening distinction. | Two separate landscape 4:3 images: one establishing architectural view and one closer Great Bath study, each at least 1800 px wide. |
| Medium | Gurdwara Lahura Sahib / Shaheed Ganj | `assets/archive-gurdwara.jpg` | 639 × 426 | One low-resolution image is reused for distinct places. | Separate 4:3 architectural records for each site, with verified captions and unobstructed primary elevations. |
| Medium | Katas Raj | `assets/archive-katas.jpg` | 640 × 379 | Limited resolution and a wide crop leave little flexibility for responsive focal positioning. | Landscape 3:2 establishing image with temple cluster and terrain; optional portrait 4:5 supporting architectural detail. |
| Medium | Walled City Revitalization Initiative | `assets/project-1.png` | 1920 × 1080 | Strong resolution but conventional wide framing; currently reused as the Our Work opening image. | Keep for cinematic opening use; add a distinct 4:3 project record showing documentation or conservation work in context. |
| Medium | Heritage documentation & public engagement | `assets/project-2.png` | 1920 × 1080 | Strong resolution, but a dedicated human-scale documentation image would communicate the work more clearly. | Landscape 4:3 image of recording, interviewing, drawing, or public interpretation, with one obvious point of attention. |
| Low | Demo — Craft in practice / Learning resource prototype | `assets/fresco_strip.jpg` | 1035 × 320 | Decorative panorama is reused across unrelated demo records. | Keep as a wide supporting detail only; use a portrait 4:5 process image for craft and a 4:3 activity image for learning. |

## Acquisition and crop guidance

- Photograph architecture with corrected verticals and enough perimeter space to protect roofs, minarets, domes, entrances, and plinths across responsive crops.
- Commission portrait 4:5 / 3:4 imagery for people, objects, making, teaching, and close heritage encounters.
- Use landscape 4:3 / 3:2 for buildings, archaeological sites, groups, and project documentation.
- Reserve very wide images for genuine panoramas and secondary detail bands; do not use them as default card portraits.
- Record `focalX` and `focalY` for every new source asset after a desktop and mobile crop review.
- Prefer distinct assets per record. Reuse only when the repeated image is intentionally functioning as programme identity rather than evidence for a specific place.
