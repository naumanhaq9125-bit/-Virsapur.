# KP, GB and AJK — Phase C research handoff

Date: 22 October 2026, Asia/Karachi. Research baseline: 221 existing canonical heritage Places.

## Cleared proposals

| Region | Fresh public catalogue rows | Screened candidate rows | New proposed Places | District configurations recorded | Districts with new proposals |
| --- | ---: | ---: | ---: | ---: | ---: |
| Khyber Pakhtunkhwa | 1,556 | 270 | 87 | 41 | 22 |
| Gilgit-Baltistan | 373 | 207 | 59 | 14 | 14 |
| Azad Kashmir | 91 | 91 | 28 | 10 | 7 |
| Total | 2,020 | 568 | 174 | 65 | 43 |

These are research proposals, not published records. All are `mapDisplay: listed`, `featured: false`, `image: null`, `placeholderImage: true`. Nothing in the application, canonical content, build outputs, Studio, routes or protected geometry was changed.

Each region's `research.json` contains the proposed records, district-by-district research status, source URLs, supplemental institutional searches, unresolved candidates and known existing-record rejections. `raw-evidence.json` retains source identity, original decimal/DMS coordinates, publication title and a short excerpt. `catalogue.json` is the fresh complete public catalogue response. `quality-screen.json` records machine-screen outcomes without pretending every raw row received equally deep editorial review.

## Quality controls

- The public federal catalogue was fetched through its normal read-only public province filter on 22 October. Individual detail URLs were preserved as citations; several direct detail-page retrievals returned server/cache errors even though the public catalogue response was available.
- Every proposed source point is unchanged. Missing/invalid points, invalid DMS, whole-minute-only pairs, exact catalogue coordinate collisions and conflicts with protected geography were withheld.
- Decimal coordinates were independently compared with the source DMS values. Final validation reports zero mismatches or invalid proposals.
- Existing IDs, source URLs, names and component names were checked. Proposed points within 20 metres of an existing Place were withheld for reconciliation.
- Final cross-proposal identity/proximity review merged the adjacent Mian Muhammad Umar mosque and tomb into one two-component Place, rather than inflating the count. Each component preserves its own source coordinate and URL.
- No proposed Place pair remains within 50 metres. The merged mosque/tomb's distinct component points are intentionally approximately 47 metres apart.
- Taxila components, Gor Khatri's temple, Khaplu Palace variants, Amburiq variants, Kharpocho variants and Thagas ensemble variants were not duplicated.
- No UNESCO designation was inferred from a conservation award or from proximity to a World Heritage site. No image rights were assumed and no new pictures were added.
- Descriptions are conservative original summaries. Historical catalogue preservation/access observations were not converted into present-day visiting advice.

## Significant holds

- Swat: Gumbatuna, Amluk Dara and several other famous monuments have coarse whole-minute catalogue points. Shingardar has invalid DMS. These were not silently corrected.
- White Palace/Marghazar: precise-looking coordinates are near Saidu Sharif and conflict with the catalogue's location narrative. Withheld.
- Shna-Shah and Andan Dherai: description/location contradictions need independent precise points.
- Shatial: historical region/district labelling and the protected Upper Kohistan context need independent reconciliation. No geometry or coordinate change proposed.
- GB: Altit/Gulmit reused coordinates, conflicting Keris and Gupis Fort points, duplicated mosque coordinates and several copied location narratives remain unresolved.
- AJK: Sharda megali​​th/cup-mark coordinates reused in Poonch; Muzaffarabad temple points located in Abbottabad; the submerged Old Mirpur temple point overlaps Ramkot Fort; Bihal baoli/inscription points conflict. None were admitted.
- Teri Temple, Gulistan Fort and Darbar Haji Pir are institutionally attested leads without a cleared precise site point. They remain unresolved.
- Hazara University's surveys establish research activity in Batagram, Tor Ghar and the Kohistan districts; their project page does not provide new exact heritage-site coordinates. District/city centroids were never substituted.
- Historical, retired and withheld district configurations remain untouched. No new proposal was forced merely to fill a district.

## Ingestion notes

Use `accepted` only, not the raw inventory. The `status: published` field describes the proposed eventual record state; it does not mean this agent published anything. Parent implementation controls publication and validation.

`researchSpatialContext` is research metadata, not a request to extend the canonical schema. Strip it if canonical ingestion requires existing-schema fields only. Protected spatial derivation should run through the application's existing pipeline.

Source IDs and `sortOrder` values are stable and append-only (`30000 + DOAM ID`). For the merged mosque/tomb, the primary Place is `major-doam-4431`; DOAM 4435 exists only as its second component.

Final validation: `kp/validation.json`. Reproduction scripts are confined to this research folder and never invoke a build.
