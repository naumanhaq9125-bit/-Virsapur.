# Heritage Atlas — Current Research Manifest

Local source and Preview only. Research retrieved 17 October 2026; review completed 18 October 2026 (Asia/Karachi). No Production build, publish or deployment.

Current inventory: **221** unique Places (6 World Heritage, 215 other tangible Heritage Places), 240 components, 126 mapped districts. 181 district reviews, 55 currently unmapped; 90 have logged non-duplicate source/geography issues.

| Region | Researched | New Places | Final Places* | Districts before → after | Unresolved candidates |
|---|---:|---:|---:|---:|---:|
| Punjab | 41 | 48 | 62 | 8 → 37 | 16 |
| Sindh | 30 | 37 | 49 | 9 → 26 | 20 |
| Khyber Pakhtunkhwa | 41 | 23 | 35 | 6 → 25 | 24 |
| Balochistan | 44 | 12 | 22 | 7 → 15 | 27 |
| Gilgit-Baltistan | 14 | 13 | 24 | 5 → 14 | 9 |
| Azad Jammu and Kashmir | 10 | 9 | 19 | 6 → 8 | 8 |
| Islamabad Capital Territory | 1 | 3 | 13 | 1 → 1 | 6 |

*Regional Place counts legitimately overlap for retained cross-region records. National unique total: 221. District totals count all Places, including UNESCO; the September manifest counted Major Heritage districts only.

All 181 configured district IDs were screened against complete regional federal catalogues, current/legacy administrative labels and protected point-in-polygon assignments, with focused provincial/institutional follow-up. This is bounded desk research, not an exhaustive inventory or field verification. Raw catalogue candidate sets are discovery evidence, not accepted records. Federal and provincial archaeology inventories were preferred; UNESCO designation evidence, conservation bodies, university surveys and official tourism sources were used where relevant. Secondary travel lists are leads only. Exact published site points were retained; malformed, coarse, conflicting and missing coordinates were withheld rather than geocoded or moved. Source district labels do not control display geography. Kargah uses an explicitly documented GB government coordinate in place of a conflicting DOAM point. No new images were ingested.

Current per-record sources and coordinate evidence: heritage-atlas-research-manifest.json (records). Current district/source/rejection registers and final report: qa-artifacts/v1-finalization/heritage-research/. Historical September evidence below is retained verbatim and is not the current count. The complete prior JSON is preserved in the JSON manifest's history array.

## Historical snapshot — 23 September 2026

# Heritage Atlas — Research Manifest

Source + local Preview only. Verification refers to checking an institutional catalogue, not a field survey. Published precision is preserved; no district-centroid geocoding or coordinate relocation.

## National coverage

76 unique properties: 6 inscribed World Heritage and 70 Major Heritage. Regional totals overlap legitimately: Taxila in Punjab/KP, Pharwala and Sultan Muqarrab Khan’s Tomb in Punjab/Islamabad. District coverage below counts Major Heritage, not merely UNESCO.

| Region | UNESCO | Major Heritage | Total | Districts | Categories | Missing images |
|---|---:|---:|---:|---:|---:|---:|
| punjab | 3 | 11 | 14 | 7 | 5 | 2 |
| sindh | 2 | 10 | 12 | 8 | 5 | 0 |
| khyber-pakhtunkhwa | 2 | 10 | 12 | 6 | 5 | 1 |
| balochistan | 0 | 10 | 10 | 7 | 3 | 3 |
| gilgit-baltistan | 0 | 11 | 11 | 5 | 4 | 5 |
| azad-kashmir | 0 | 10 | 10 | 6 | 4 | 0 |
| islamabad | 0 | 10 | 10 | 1 | 5 | 0 |

## Research method and limitations

DOAM public site catalogues supply exact published coordinates and site descriptions. Their cited sources include federal/provincial protected-site inventories, Quaid-i-Azam University surveys, archaeological publications, and regional conservation records. UNESCO inscription dossiers are retained for the six World Heritage properties; UNESCO Tentative List entries distinguish proposed properties from actual inscriptions. Bazira uses the UNESCO published DMS coordinate converted arithmetically. The original nine records retain all coordinates. Legal-status strings are attributed catalogue statements, not a fresh legal review.

The 67 additions comprise 66 DOAM records plus Bazira. Selection balances archaeology, sacred places, forts, funerary heritage, historic urban sites and cultural landscapes. Every region meets the 10–12 target with at least four represented districts, except one-district Islamabad. Eight conflicting/incomplete candidates were withheld.

## Deferred candidates

- **Altit Fort** — DOAM coordinate derives to Nagar, conflicting with its Hunza attribution and the known fort setting. Do not relocate or publish this candidate without independent institutional coordinate evidence. [DOAM record](https://doam.gov.pk/public/sites/7805)
- **Shiger Rock Art** — Published coordinate lands near Khaplu in Ghanche rather than the Shigar landscape described in the catalogue. [DOAM record](https://doam.gov.pk/public/sites/7827)
- **Pirak** — Published coordinate derives to Washuk rather than the Sibi/Kachi archaeological landscape. Source discrepancy requires resolution. [DOAM record](https://doam.gov.pk/public/sites/9050)
- **Amri** — Published coordinate derives to Thatta rather than Jamshoro; withheld pending a corroborating institutional coordinate. [DOAM record](https://doam.gov.pk/public/sites/5154)
- **Ranigat** — Catalogue coordinate resolves to Mardan rather than Buner and the Tentative List page does not supply numeric coordinates. Withheld pending a stronger coordinate source. [DOAM record](https://doam.gov.pk/public/sites/2370)
- **Attock Fort** — Official point has no ADM2 match in the protected geometry. Retained in research only; no guessed boundary assignment or relocated marker. [DOAM record](https://doam.gov.pk/public/sites/7761)
- **Ban Faqiran Mosque** — No ADM2 match for the source coordinate. Do not confuse it with the separately verified stupa. [DOAM record](https://doam.gov.pk/public/sites/6314)
- **Tumair Rock Shelter** — Coordinate and the source's east-of-Barakahu description conflict. Not selected. [DOAM record](https://doam.gov.pk/public/sites/6318)

## Taxila and spatial diagnostics

One property, 18 components. Rawalpindi has 12 scoped components; Haripur has 6, including two shared components. Saraikala remains missing-at-source; Jandial retains its published coordinate but has no current ADM2 match. Shared matches are retained and documented, not treated as errors.

## Record register

### Archaeological Ruins at Moenjodaro — unesco-138

- Short title: Moenjodaro
- Regions: sindh; derived districts: sindh-larkana
- Category: Archaeological Site; designation: UNESCO World Heritage
- Selection: Retained official UNESCO or approved curated property; original coordinates unchanged.
- Authority: UNESCO World Heritage Centre; [source](https://whc.unesco.org/en/list/138/); verified 2026-09-05
- Source publication: See institutional record
- Legal status: Not independently established. 
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Archaeological Ruins at Moenjodaro | 27.3291667 | 68.1388889 | verified-unesco · [source](https://whc.unesco.org/en/list/138/) | sindh-larkana |

- Archaeological Ruins at Moenjodaro: Existing published UNESCO coordinate retained without relocation.

### Taxila — unesco-139

- Short title: Taxila
- Regions: khyber-pakhtunkhwa, punjab; derived districts: khyber-pakhtunkhwa-haripur, punjab-rawalpindi
- Category: Archaeological Site; designation: UNESCO World Heritage
- Selection: Retained official UNESCO or approved curated property; original coordinates unchanged.
- Authority: UNESCO World Heritage Centre; [source](https://whc.unesco.org/en/list/139/); verified 2026-09-05
- Source publication: See institutional record
- Legal status: Not independently established. 
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Khanpur Cave | 33.7992 | 72.9092944 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | khyber-pakhtunkhwa-haripur |
| Saraikala, prehistoric mound | Missing | Missing | missing-at-source · [source](https://whc.unesco.org/en/list/139/maps/) | Unassigned |
| Bhir Mound | 33.7439444 | 72.8193306 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | punjab-rawalpindi |
| Sirkap (fortified city) | 33.7534028 | 72.8298778 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | punjab-rawalpindi |
| Sirsukh (fortified ruined city) | 33.7722556 | 72.8497389 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | khyber-pakhtunkhwa-haripur |
| Dharmarajika stupa and monastery | 33.7446694 | 72.8426667 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | punjab-rawalpindi |
| Khader Mohra (Akhuri) | 33.7608056 | 72.8607222 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | punjab-rawalpindi |
| Kalawan group of buildings | 33.7462917 | 72.8397528 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | punjab-rawalpindi |
| Giri complex of monuments | 33.7290889 | 72.883325 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | punjab-rawalpindi |
| Kunala stupa and monastery | 33.7505528 | 72.8314444 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | punjab-rawalpindi |
| Jandial complex | 33.7644556 | 72.8289139 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | Unassigned |
| Lalchak and Badalpur Buddhist stuppa | 33.7818028 | 72.8680194 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | khyber-pakhtunkhwa-haripur |
| Mohra Moradu stupa and monastery | 33.7610972 | 72.8610528 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | punjab-rawalpindi |
| Pippala stupa and monastery | 33.7659222 | 72.8666861 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | punjab-rawalpindi, khyber-pakhtunkhwa-haripur |
| Jaulian stupa and monastery | 33.7650417 | 72.8753111 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | punjab-rawalpindi, khyber-pakhtunkhwa-haripur |
| Lalchak mounds | 33.77445 | 72.8494694 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | khyber-pakhtunkhwa-haripur |
| Buddhist remains around Bhallar stupa | 33.8134972 | 72.8253583 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | punjab-rawalpindi |
| Giri Mosque and tombs | 33.7277694 | 72.8805222 | verified-unesco · [source](https://whc.unesco.org/en/list/139/maps/) | punjab-rawalpindi |

- Khanpur Cave: Existing published UNESCO coordinate retained without relocation.
- Saraikala, prehistoric mound: UNESCO geographical data currently provides no coordinate.
- Bhir Mound: Existing published UNESCO coordinate retained without relocation.
- Sirkap (fortified city): Existing published UNESCO coordinate retained without relocation.
- Sirsukh (fortified ruined city): Existing published UNESCO coordinate retained without relocation.
- Dharmarajika stupa and monastery: Existing published UNESCO coordinate retained without relocation.
- Khader Mohra (Akhuri): Existing published UNESCO coordinate retained without relocation.
- Kalawan group of buildings: Existing published UNESCO coordinate retained without relocation.
- Giri complex of monuments: Existing published UNESCO coordinate retained without relocation.
- Kunala stupa and monastery: Existing published UNESCO coordinate retained without relocation.
- Jandial complex: Existing published UNESCO coordinate retained without relocation.
- Lalchak and Badalpur Buddhist stuppa: Existing published UNESCO coordinate retained without relocation.
- Mohra Moradu stupa and monastery: Existing published UNESCO coordinate retained without relocation.
- Pippala stupa and monastery: Existing published UNESCO coordinate retained without relocation.
- Jaulian stupa and monastery: Existing published UNESCO coordinate retained without relocation.
- Lalchak mounds: Existing published UNESCO coordinate retained without relocation.
- Buddhist remains around Bhallar stupa: Existing published UNESCO coordinate retained without relocation.
- Giri Mosque and tombs: Existing published UNESCO coordinate retained without relocation.

### Buddhist Ruins of Takht-i-Bahi and Neighbouring City Remains at Sahr-i-Bahlol — unesco-140

- Short title: Takht-i-Bahi & Sahr-i-Bahlol
- Regions: khyber-pakhtunkhwa; derived districts: khyber-pakhtunkhwa-mardan
- Category: Archaeological Site; designation: UNESCO World Heritage
- Selection: Retained official UNESCO or approved curated property; original coordinates unchanged.
- Authority: UNESCO World Heritage Centre; [source](https://whc.unesco.org/en/list/140/); verified 2026-09-05
- Source publication: See institutional record
- Legal status: Not independently established. 
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Takht-i-Bahi | 34.2861111 | 71.9472222 | verified-unesco · [source](https://whc.unesco.org/en/list/140/maps/) | khyber-pakhtunkhwa-mardan |
| Sahr-i-Bahlol | 34.2555556 | 71.9505556 | verified-unesco · [source](https://whc.unesco.org/en/list/140/maps/) | khyber-pakhtunkhwa-mardan |

- Takht-i-Bahi: Existing published UNESCO coordinate retained without relocation.
- Sahr-i-Bahlol: Existing published UNESCO coordinate retained without relocation.

### Fort and Shalamar Gardens in Lahore — unesco-171

- Short title: Fort & Shalamar Gardens
- Regions: punjab; derived districts: punjab-lahore
- Category: Historic Monument; designation: UNESCO World Heritage
- Selection: Retained official UNESCO or approved curated property; original coordinates unchanged.
- Authority: UNESCO World Heritage Centre; [source](https://whc.unesco.org/en/list/171/); verified 2026-09-05
- Source publication: See institutional record
- Legal status: Not independently established. 
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Lahore Fort | 31.5883833 | 74.3154028 | verified-unesco · [source](https://whc.unesco.org/en/list/171/maps/) | punjab-lahore |
| Shalamar Gardens | 31.5871417 | 74.3821278 | verified-unesco · [source](https://whc.unesco.org/en/list/171/maps/) | punjab-lahore |

- Lahore Fort: Existing published UNESCO coordinate retained without relocation.
- Shalamar Gardens: Existing published UNESCO coordinate retained without relocation.

### Historical Monuments at Makli, Thatta — unesco-143

- Short title: Makli, Thatta
- Regions: sindh; derived districts: sindh-thatta
- Category: Tomb / Funerary Heritage; designation: UNESCO World Heritage
- Selection: Retained official UNESCO or approved curated property; original coordinates unchanged.
- Authority: UNESCO World Heritage Centre; [source](https://whc.unesco.org/en/list/143/); verified 2026-09-05
- Source publication: See institutional record
- Legal status: Not independently established. 
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Historical Monuments at Makli, Thatta | 24.7666667 | 67.9 | verified-unesco · [source](https://whc.unesco.org/en/list/143/) | sindh-thatta |

- Historical Monuments at Makli, Thatta: Existing published UNESCO coordinate retained without relocation.

### Rohtas Fort — unesco-586

- Short title: Rohtas Fort
- Regions: punjab; derived districts: punjab-jhelum
- Category: Fortification; designation: UNESCO World Heritage
- Selection: Retained official UNESCO or approved curated property; original coordinates unchanged.
- Authority: UNESCO World Heritage Centre; [source](https://whc.unesco.org/en/list/586/); verified 2026-09-05
- Source publication: See institutional record
- Legal status: Not independently established. 
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Rohtas Fort | 32.9625 | 73.5888889 | verified-unesco · [source](https://whc.unesco.org/en/list/586/) | punjab-jhelum |

- Rohtas Fort: Existing published UNESCO coordinate retained without relocation.

### Baltit Fort — curated-baltit

- Short title: Baltit Fort
- Regions: gilgit-baltistan; derived districts: gilgit-baltistan-hunza
- Category: Fortification; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Retained from the approved Atlas inventory.
- Authority: UNESCO World Heritage Centre — Tentative List; [source](https://whc.unesco.org/en/tentativelists/1882/); verified 2026-09-22
- Source publication: See institutional record
- Legal status: Not independently established. 
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Baltit Fort | 36.3333333 | 74.65 | verified-source · [source](https://whc.unesco.org/en/tentativelists/1882/) | gilgit-baltistan-hunza |

- Baltit Fort: Coordinate published in Pakistan's Tentative List submission, rounded to the nearest arc minute.

### Archaeological Site of Mehrgarh — curated-mehrgarh

- Short title: Mehrgarh
- Regions: balochistan; derived districts: balochistan-kachhi
- Category: Archaeological Site; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Retained from the approved Atlas inventory.
- Authority: UNESCO World Heritage Centre — Tentative List; [source](https://whc.unesco.org/en/tentativelists/1876/); verified 2026-09-22
- Source publication: See institutional record
- Legal status: Not independently established. 
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Mehrgarh | 29.2125 | 67.6708333 | verified-source · [source](https://whc.unesco.org/en/tentativelists/1876/) | balochistan-kachhi |

- Mehrgarh: Coordinate from Pakistan's Tentative List submission: 29°12′45″N, 67°40′15″E.

### Archaeological Site of Rehman Dheri — curated-rehman-dheri

- Short title: Rehman Dheri
- Regions: khyber-pakhtunkhwa; derived districts: khyber-pakhtunkhwa-d-i-khan
- Category: Archaeological Site; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Retained from the approved Atlas inventory.
- Authority: Khyber Pakhtunkhwa Integrated Tourism Development Project; [source](https://old.kptourism.com/uploads/images/kite/1706169526668-clean-version-of-esmp-for-rehman-dheri-site-di-khan---25-jan-2024.pdf); verified 2026-09-22
- Source publication: See institutional record
- Legal status: Not independently established. 
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Rehman Dheri | 31.9458694 | 70.8850889 | verified-source · [source](https://old.kptourism.com/uploads/images/kite/1706169526668-clean-version-of-esmp-for-rehman-dheri-site-di-khan---25-jan-2024.pdf) | khyber-pakhtunkhwa-d-i-khan |

- Rehman Dheri: GPS coordinates, Table I, official January 2024 site ESMP: 31°56′45.13″N, 70°53′6.32″E.

### Badshahi Mosque — major-doam-6467

- Short title: Badshahi Mosque
- Regions: punjab; derived districts: punjab-lahore
- Category: Sacred Heritage; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Major Mughal sacred architecture; distinct from the inscribed Fort and Shalamar property.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6467); verified 2026-09-23
- Source publication: Archaeological Sites and Historical Monuments Protected Under the Antiquities Act, 1975
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Badshahi Mosque | 31.588055556 | 74.31 | verified-official · [source](https://doam.gov.pk/public/sites/6467) | punjab-lahore |

- Badshahi Mosque: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Wazir Khan Mosque — major-doam-6466

- Short title: Wazir Khan Mosque
- Regions: punjab; derived districts: punjab-lahore
- Category: Sacred Heritage; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Decorative arts and living sacred heritage in the historic city.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6466); verified 2026-09-23
- Source publication: Archaeological Sites and Historical Monuments Protected Under the Antiquities Act, 1975
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: missing; neutral placeholder

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Wazir Khan Mosque | 31.583055556 | 74.323333333 | verified-official · [source](https://doam.gov.pk/public/sites/6466) | punjab-lahore |

- Wazir Khan Mosque: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Jahangir's Tomb — major-doam-6479

- Short title: Jahangir's Tomb
- Regions: punjab; derived districts: punjab-lahore
- Category: Tomb / Funerary Heritage; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Royal funerary architecture beyond Lahore's walled city.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6479); verified 2026-09-23
- Source publication: Archaeological Sites and Historical Monuments Protected Under the Antiquities Act, 1975
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Jahangir's Tomb | 31.6225 | 74.3032 | verified-official · [source](https://doam.gov.pk/public/sites/6479) | punjab-lahore |

- Jahangir's Tomb: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Harappa — major-doam-6579

- Short title: Harappa
- Regions: punjab; derived districts: punjab-sahiwal
- Category: Archaeological Site; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: A foundational Indus archaeological landscape outside the provincial capital.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6579); verified 2026-09-23
- Source publication: Archaeological Sites and Historical Monuments Protected Under the Antiquities Act, 1975
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: missing; neutral placeholder

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Harappa | 30.626363333 | 72.866035111 | verified-official · [source](https://doam.gov.pk/public/sites/6579) | punjab-sahiwal |

- Harappa: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Katas Raj Temples — major-doam-6750

- Short title: Katas Raj Temples
- Regions: punjab; derived districts: punjab-chakwal
- Category: Sacred Heritage; designation: Major heritage site
- Selection: Hindu sacred heritage and architectural diversity in Chakwal.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6750); verified 2026-09-23
- Source publication: District Gazetteer Jhelum
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Katas Raj Temples | 32.72399525 | 72.951690639 | verified-official · [source](https://doam.gov.pk/public/sites/6750) | punjab-chakwal |

- Katas Raj Temples: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Derawar Fort — major-doam-6959

- Short title: Derawar Fort
- Regions: punjab; derived districts: punjab-bahawalpur
- Category: Fortification; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Desert fortification and a geographically distinct southern context.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6959); verified 2026-09-23
- Source publication: Forts in Cholistan
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Derawar Fort | 28.767777778 | 71.333888889 | verified-official · [source](https://doam.gov.pk/public/sites/6959) | punjab-bahawalpur |

- Derawar Fort: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Hiran Minar — major-doam-6423

- Short title: Hiran Minar
- Regions: punjab; derived districts: punjab-sheikhupura
- Category: Historic Monument; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Water architecture and Mughal landscape design in Sheikhupura.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6423); verified 2026-09-23
- Source publication: Archaeological Sites and Historical Monuments Protected Under the Antiquities Act, 1975
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Hiran Minar | 31.743055556 | 73.955194444 | verified-official · [source](https://doam.gov.pk/public/sites/6423) | punjab-sheikhupura |

- Hiran Minar: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Shah Rukn-e-Alam — major-doam-6431

- Short title: Shah Rukn-e-Alam
- Regions: punjab; derived districts: punjab-multan
- Category: Tomb / Funerary Heritage; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: A defining southern Punjabi funerary monument and sacred destination.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6431); verified 2026-09-23
- Source publication: Archaeological Sites and Historical Monuments Protected Under the Antiquities Act, 1975
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Shah Rukn-e-Alam | 30.199172028 | 71.471645528 | verified-official · [source](https://doam.gov.pk/public/sites/6431) | punjab-multan |

- Shah Rukn-e-Alam: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Bibi Jawindi's Tomb — major-doam-6552

- Short title: Bibi Jawindi's Tomb
- Regions: punjab; derived districts: punjab-bahawalpur
- Category: Tomb / Funerary Heritage; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Uch Sharif's distinctive brick-and-tile tomb tradition.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6552); verified 2026-09-23
- Source publication: Archaeological Sites and Historical Monuments Protected Under the Antiquities Act, 1975
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Bibi Jawindi's Tomb | 29.24086 | 71.05244 | verified-official · [source](https://doam.gov.pk/public/sites/6552) | punjab-bahawalpur |

- Bibi Jawindi's Tomb: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Kot Diji Fort — major-doam-5206

- Short title: Kot Diji Fort
- Regions: sindh; derived districts: sindh-khairpur
- Category: Fortification; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: A major Khairpur fort, separate from prehistoric settlement remains.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/5206); verified 2026-09-23
- Source publication: Inventory of Cultural Property in the Province of Sindh, Pakistan, 2015
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Kot Diji Fort | 27.344722222 | 68.706216667 | verified-official · [source](https://doam.gov.pk/public/sites/5206) | sindh-khairpur |

- Kot Diji Fort: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Ranikot Fort — major-doam-5168

- Short title: Ranikot Fort
- Regions: sindh; derived districts: sindh-jamshoro
- Category: Fortification; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Large-scale defensive landscape in Jamshoro.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/5168); verified 2026-09-23
- Source publication: Inventory of Cultural Property in the Province of Sindh, Pakistan, 2015
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Ranikot Fort | 25.896388889 | 67.9025 | verified-official · [source](https://doam.gov.pk/public/sites/5168) | sindh-jamshoro |

- Ranikot Fort: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Naukot Fort — major-doam-5504

- Short title: Naukot Fort
- Regions: sindh; derived districts: sindh-tharparkar
- Category: Fortification; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Thar's fort-building tradition and regional gateway.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/5504); verified 2026-09-23
- Source publication: Inventory of Cultural Property in the Province of Sindh, Pakistan, 2015
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Naukot Fort | 24.844722222 | 69.450102778 | verified-official · [source](https://doam.gov.pk/public/sites/5504) | sindh-tharparkar |

- Naukot Fort: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Umerkot Fort — major-doam-5509

- Short title: Umerkot Fort
- Regions: sindh; derived districts: sindh-umer-kot
- Category: Fortification; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Eastern Sindh's major urban fort.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/5509); verified 2026-09-23
- Source publication: Inventory of Cultural Property in the Province of Sindh, Pakistan, 2015
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Umerkot Fort | 25.363675 | 69.73395 | verified-official · [source](https://doam.gov.pk/public/sites/5509) | sindh-umer-kot |

- Umerkot Fort: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Chaukhandi Tombs — major-doam-5815

- Short title: Chaukhandi Tombs
- Regions: sindh; derived districts: sindh-malir-karachi
- Category: Tomb / Funerary Heritage; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: A major regional stone-carving and burial tradition.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/5815); verified 2026-09-23
- Source publication: Inventory of Cultural Property in the Province of Sindh, Pakistan, 2015
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Chaukhandi Tombs | 24.863908333 | 67.271366667 | verified-official · [source](https://doam.gov.pk/public/sites/5815) | sindh-malir-karachi |

- Chaukhandi Tombs: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Banbhore — major-doam-5512

- Short title: Banbhore
- Regions: sindh; derived districts: sindh-thatta
- Category: Archaeological Site; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Coastal urban archaeology and Indian Ocean connections.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/5512); verified 2026-09-23
- Source publication: Inventory of Cultural Property in the Province of Sindh, Pakistan, 2015
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Banbhore | 24.752286111 | 67.522658333 | verified-official · [source](https://doam.gov.pk/public/sites/5512) | sindh-thatta |

- Banbhore: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Shah Jahan Mosque — major-doam-5625

- Short title: Shah Jahan Mosque
- Regions: sindh; derived districts: sindh-thatta
- Category: Sacred Heritage; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: A major example of Sindh's tilework and sacred architecture.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/5625); verified 2026-09-23
- Source publication: Inventory of Cultural Property in the Province of Sindh, Pakistan, 2015
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Shah Jahan Mosque | 24.746963889 | 67.927869444 | verified-official · [source](https://doam.gov.pk/public/sites/5625) | sindh-thatta |

- Shah Jahan Mosque: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Gori Temple — major-doam-5499

- Short title: Gori Temple
- Regions: sindh; derived districts: sindh-tharparkar
- Category: Sacred Heritage; designation: Major heritage site
- Selection: Jain architectural heritage in the desert region.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/5499); verified 2026-09-23
- Source publication: Inventory of Cultural Property in the Province of Sindh, Pakistan, 2015
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Gori Temple | 24.638172222 | 70.617844444 | verified-official · [source](https://doam.gov.pk/public/sites/5499) | sindh-tharparkar |

- Gori Temple: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Mohatta Palace — major-doam-6036

- Short title: Mohatta Palace
- Regions: sindh; derived districts: sindh-south-karachi
- Category: Historic Monument; designation: Major heritage site
- Selection: Twentieth-century urban heritage and coastal-city representation.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6036); verified 2026-09-23
- Source publication: Inventory of Cultural Property in the Province of Sindh, Pakistan, 2015
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Mohatta Palace | 24.814272222 | 67.03265 | verified-official · [source](https://doam.gov.pk/public/sites/6036) | sindh-south-karachi |

- Mohatta Palace: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Shah Abdul Latif Bhittai — major-doam-10375

- Short title: Shah Abdul Latif Bhittai
- Regions: sindh; derived districts: sindh-matiari
- Category: Sacred Heritage; designation: Major heritage site
- Selection: Living sacred and literary heritage in Matiari.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/10375); verified 2026-09-23
- Source publication: Miscellaneous
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Shah Abdul Latif Bhittai | 25.806005556 | 68.491522222 | verified-official · [source](https://doam.gov.pk/public/sites/10375) | sindh-matiari |

- Shah Abdul Latif Bhittai: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Mansehra Rock Edicts — major-doam-136

- Short title: Mansehra Rock Edicts
- Regions: khyber-pakhtunkhwa; derived districts: khyber-pakhtunkhwa-mansehra
- Category: Historic Monument; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Epigraphic heritage and the historical routes of Hazara.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/136); verified 2026-09-23
- Source publication: Mapping of the Cultural Assets in Khyber Pakhtunkhwa and the Punjab
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Mansehra Rock Edicts | 34.3405 | 73.2002 | verified-official · [source](https://doam.gov.pk/public/sites/136) | khyber-pakhtunkhwa-mansehra |

- Mansehra Rock Edicts: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Bhamala Buddhist Complex — major-doam-823

- Short title: Bhamala Buddhist Complex
- Regions: khyber-pakhtunkhwa; derived districts: khyber-pakhtunkhwa-haripur
- Category: Archaeological Site; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: A major Haripur Buddhist site outside Taxila's inscribed component inventory.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/823); verified 2026-09-23
- Source publication: Archaeological Survey in Hazara Division, District Haripur (Campaign 2007-08)
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Bhamala Buddhist Complex | 33.832813889 | 72.975880556 | verified-official · [source](https://doam.gov.pk/public/sites/823) | khyber-pakhtunkhwa-haripur |

- Bhamala Buddhist Complex: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Butkara I — major-doam-3304

- Short title: Butkara I
- Regions: khyber-pakhtunkhwa; derived districts: khyber-pakhtunkhwa-swat
- Category: Archaeological Site; designation: Major heritage site
- Selection: Excavated Buddhist architecture and Swat's archaeological sequence.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/3304); verified 2026-09-23
- Source publication: Buddhist Shrines in Swat
- Legal status: Protected by The Khyber Pakhtunkhwa Antiquities Act, 2016. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Butkara I | 34.76573 | 72.36793 | verified-official · [source](https://doam.gov.pk/public/sites/3304) | khyber-pakhtunkhwa-swat |

- Butkara I: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Mahabat Khan Mosque — major-doam-4399

- Short title: Mahabat Khan Mosque
- Regions: khyber-pakhtunkhwa; derived districts: khyber-pakhtunkhwa-peshawar
- Category: Sacred Heritage; designation: Major heritage site
- Selection: Living Mughal sacred architecture in Peshawar.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/4399); verified 2026-09-23
- Source publication: Preliminary Report on Survey of Heritage Sites and Monuments along the Grand Trunk Road from Peshawar to Lahore
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Mahabat Khan Mosque | 34.01 | 71.5734 | verified-official · [source](https://doam.gov.pk/public/sites/4399) | khyber-pakhtunkhwa-peshawar |

- Mahabat Khan Mosque: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Gor Khatri — major-doam-1810

- Short title: Gor Khatri
- Regions: khyber-pakhtunkhwa; derived districts: khyber-pakhtunkhwa-peshawar
- Category: Historic Urban Heritage; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Layered urban heritage, rather than a single-period monument.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/1810); verified 2026-09-23
- Source publication: Archaeological Sites and Historical Monuments Protected Under the Antiquities Act, 1975
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Gor Khatri | 34.016666667 | 71.583333333 | verified-official · [source](https://doam.gov.pk/public/sites/1810) | khyber-pakhtunkhwa-peshawar |

- Gor Khatri: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Sethi House — major-doam-3485

- Short title: Sethi House
- Regions: khyber-pakhtunkhwa; derived districts: khyber-pakhtunkhwa-peshawar
- Category: Historic Urban Heritage; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Domestic architecture and Central Asian trade connections.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/3485); verified 2026-09-23
- Source publication: Preliminary Report on Survey of Heritage Sites and Monuments along the Grand Trunk Road from Peshawar to Lahore
- Legal status: Protected by The Khyber Pakhtunkhwa Antiquities Act, 2016. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Sethi House | 34.009279 | 71.578585 | verified-official · [source](https://doam.gov.pk/public/sites/3485) | khyber-pakhtunkhwa-peshawar |

- Sethi House: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Shahbazgarhi Rock Edicts — major-doam-4621

- Short title: Shahbazgarhi Rock Edicts
- Regions: khyber-pakhtunkhwa; derived districts: khyber-pakhtunkhwa-mardan
- Category: Historic Monument; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Major epigraphic monument in the Mardan landscape.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/4621); verified 2026-09-23
- Source publication: Archaeological Survey of District Mardan in the North-West Frontier Province of Pakistan
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Shahbazgarhi Rock Edicts | 34.224194444 | 72.16525 | verified-official · [source](https://doam.gov.pk/public/sites/4621) | khyber-pakhtunkhwa-mardan |

- Shahbazgarhi Rock Edicts: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Bala Hisar Fort — major-doam-4607

- Short title: Bala Hisar Fort
- Regions: khyber-pakhtunkhwa; derived districts: khyber-pakhtunkhwa-peshawar
- Category: Fortification; designation: Major heritage site
- Selection: Defensive architecture complements the regional Buddhist and sacred inventory.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/4607); verified 2026-09-23
- Source publication: Peshawar: Historic City of the Frontier
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Bala Hisar Fort | 34.012991222 | 71.569916139 | verified-official · [source](https://doam.gov.pk/public/sites/4607) | khyber-pakhtunkhwa-peshawar |

- Bala Hisar Fort: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Damb Sadaat — major-doam-8773

- Short title: Damb Sadaat
- Regions: balochistan; derived districts: balochistan-quetta
- Category: Archaeological Site; designation: Major heritage site
- Selection: A significant excavated sequence in the Quetta valley.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/8773); verified 2026-09-23
- Source publication: The Indus Age - The Beginnings
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Damb Sadaat | 30.05 | 66.95 | verified-official · [source](https://doam.gov.pk/public/sites/8773) | balochistan-quetta |

- Damb Sadaat: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Killi Gul Mohammad — major-doam-8867

- Short title: Killi Gul Mohammad
- Regions: balochistan; derived districts: balochistan-quetta
- Category: Archaeological Site; designation: Major heritage site
- Selection: Foundational evidence for early village life in Balochistan.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/8867); verified 2026-09-23
- Source publication: The Indus Age - The Beginnings
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: missing; neutral placeholder

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Killi Gul Mohammad | 30.283333333 | 66.966666667 | verified-official · [source](https://doam.gov.pk/public/sites/8867) | balochistan-quetta |

- Killi Gul Mohammad: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Nausharo — major-doam-8927

- Short title: Nausharo
- Regions: balochistan; derived districts: balochistan-kachhi
- Category: Archaeological Site; designation: Major heritage site
- Selection: A major settlement sequence complementing, not duplicating, Mehrgarh.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/8927); verified 2026-09-23
- Source publication: The Indus Age - The Beginnings
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Nausharo | 29.35881055 | 67.59639404 | verified-official · [source](https://doam.gov.pk/public/sites/8927) | balochistan-kachhi |

- Nausharo: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Nindowari — major-doam-8933

- Short title: Nindowari
- Regions: balochistan; derived districts: balochistan-khuzdar
- Category: Archaeological Site; designation: Major heritage site
- Selection: Kulli archaeology and southern interior geographic spread.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/8933); verified 2026-09-23
- Source publication: The Indus Age - The Beginnings
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Nindowari | 26.95 | 66.066666667 | verified-official · [source](https://doam.gov.pk/public/sites/8933) | balochistan-khuzdar |

- Nindowari: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Spina Ghundai — major-doam-9012

- Short title: Spina Ghundai
- Regions: balochistan; derived districts: balochistan-chaman
- Category: Archaeological Site; designation: Major heritage site
- Selection: Northern settlement archaeology documented in the institutional catalogue.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/9012); verified 2026-09-23
- Source publication: The Indus Age - The Beginnings
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: missing; neutral placeholder

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Spina Ghundai | 30.95 | 66.666666667 | verified-official · [source](https://doam.gov.pk/public/sites/9012) | balochistan-chaman |

- Spina Ghundai: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Sutkagen-Dor — major-doam-8639

- Short title: Sutkagen-Dor
- Regions: balochistan; derived districts: balochistan-gwadar
- Category: Archaeological Site; designation: Major heritage site
- Selection: Western Indus archaeology and the Makran landscape.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/8639); verified 2026-09-23
- Source publication: Cartography of Ancient Settlements in Central Southern Pakistani Makran: New Data
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: missing; neutral placeholder

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Sutkagen-Dor | 25.516666667 | 61.966666667 | verified-official · [source](https://doam.gov.pk/public/sites/8639) | balochistan-gwadar |

- Sutkagen-Dor: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Ziarat Residency — major-doam-9686

- Short title: Ziarat Residency
- Regions: balochistan; derived districts: balochistan-ziarat
- Category: Historic Monument; designation: Major heritage site
- Selection: National commemorative heritage and a distinct upland architectural context.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/9686); verified 2026-09-23
- Source publication: Archaeological Sites and Historical Monuments Protected Under the Antiquities Act, 1975
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Ziarat Residency | 30.378975 | 67.726077917 | verified-official · [source](https://doam.gov.pk/public/sites/9686) | balochistan-ziarat |

- Ziarat Residency: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Babra Tombs — major-doam-9678

- Short title: Babra Tombs
- Regions: balochistan; derived districts: balochistan-lasbela
- Category: Tomb / Funerary Heritage; designation: Major heritage site
- Selection: Lasbela's regional funerary craft and ruling history.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/9678); verified 2026-09-23
- Source publication: Archaeological Sites and Historical Monuments Protected Under the Antiquities Act, 1975
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Babra Tombs | 26.270630028 | 66.314785861 | verified-official · [source](https://doam.gov.pk/public/sites/9678) | balochistan-lasbela |

- Babra Tombs: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Hinidan Tombs — major-doam-9683

- Short title: Hinidan Tombs
- Regions: balochistan; derived districts: balochistan-lasbela
- Category: Tomb / Funerary Heritage; designation: Major heritage site
- Selection: Cross-regional stone-carving traditions in southern Balochistan.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/9683); verified 2026-09-23
- Source publication: Archaeological Sites and Historical Monuments Protected Under the Antiquities Act, 1975
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Hinidan Tombs | 25.028845821 | 66.887606018 | verified-official · [source](https://doam.gov.pk/public/sites/9683) | balochistan-lasbela |

- Hinidan Tombs: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Shigar Fort Palace — major-doam-7998

- Short title: Shigar Fort Palace
- Regions: gilgit-baltistan; derived districts: gilgit-baltistan-shigar
- Category: Fortification; designation: Major heritage site
- Selection: Mountain fort-palace architecture and historic conservation value.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/7998); verified 2026-09-23
- Source publication: Built Heritage of Gilgit Baltistan by Baltistan Culture and Development Foundation
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: missing; neutral placeholder

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Shigar Fort Palace | 35.422980209 | 75.742294524 | verified-official · [source](https://doam.gov.pk/public/sites/7998) | gilgit-baltistan-shigar |

- Shigar Fort Palace: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Khaplu Fort Palace — major-doam-7974

- Short title: Khaplu Fort Palace
- Regions: gilgit-baltistan; derived districts: gilgit-baltistan-ghanche
- Category: Fortification; designation: Major heritage site
- Selection: A major Balti palace, distinct from sacred and archaeological sites.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/7974); verified 2026-09-23
- Source publication: Tourism, Sports, Culture, Archaeology & Museum Department Gilgit-Baltistan
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Khaplu Fort Palace | 35.15215 | 76.335442 | verified-official · [source](https://doam.gov.pk/public/sites/7974) | gilgit-baltistan-ghanche |

- Khaplu Fort Palace: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Chaqchan Mosque — major-doam-7969

- Short title: Chaqchan Mosque
- Regions: gilgit-baltistan; derived districts: gilgit-baltistan-ghanche
- Category: Sacred Heritage; designation: Major heritage site
- Selection: A major example of Balti sacred architecture.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/7969); verified 2026-09-23
- Source publication: History of Northern Areas of Pakistan: Up to 2000 A.D.
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: missing; neutral placeholder

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Chaqchan Mosque | 35.155833333 | 76.330555556 | verified-official · [source](https://doam.gov.pk/public/sites/7969) | gilgit-baltistan-ghanche |

- Chaqchan Mosque: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Amburiq Mosque — major-doam-8229

- Short title: Amburiq Mosque
- Regions: gilgit-baltistan; derived districts: gilgit-baltistan-shigar
- Category: Sacred Heritage; designation: Major heritage site
- Selection: Historic craft and intimate sacred architecture.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/8229); verified 2026-09-23
- Source publication: Built Heritage of Gilgit Baltistan by Baltistan Culture and Development Foundation
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Amburiq Mosque | 35.407167 | 75.7355 | verified-official · [source](https://doam.gov.pk/public/sites/8229) | gilgit-baltistan-shigar |

- Amburiq Mosque: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Manthal Rock Buddha — major-doam-7705

- Short title: Manthal Rock Buddha
- Regions: gilgit-baltistan; derived districts: gilgit-baltistan-skardu
- Category: Archaeological Site; designation: Major heritage site
- Selection: A major surviving rock-art monument.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/7705); verified 2026-09-23
- Source publication: Pak-German Archaeological Mission to the Northern Areas of the Heidelberg Academy for the Humanities and Sciences
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Manthal Rock Buddha | 35.269617 | 75.633317 | verified-official · [source](https://doam.gov.pk/public/sites/7705) | gilgit-baltistan-skardu |

- Manthal Rock Buddha: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Kharpocho Fort — major-doam-7818

- Short title: Kharpocho Fort
- Regions: gilgit-baltistan; derived districts: gilgit-baltistan-skardu
- Category: Fortification; designation: Major heritage site
- Selection: Defensive heritage and a commanding valley setting.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/7818); verified 2026-09-23
- Source publication: Built Heritage of Gilgit Baltistan by Baltistan Culture and Development Foundation
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: missing; neutral placeholder

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Kharpocho Fort | 35.301817 | 75.643133 | verified-official · [source](https://doam.gov.pk/public/sites/7818) | gilgit-baltistan-skardu |

- Kharpocho Fort: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Hodar Rock Art — major-doam-8249

- Short title: Hodar Rock Art
- Regions: gilgit-baltistan; derived districts: gilgit-baltistan-diamir
- Category: Archaeological Site; designation: Major heritage site
- Selection: Upper Indus epigraphy and long-distance cultural contact.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/8249); verified 2026-09-23
- Source publication: Archaeological Survey of Gilgit-Baltistan by Baltistan Culture and Development Foundation
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Hodar Rock Art | 35.532264863 | 74.022001243 | verified-official · [source](https://doam.gov.pk/public/sites/8249) | gilgit-baltistan-diamir |

- Hodar Rock Art: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Thalpan Rock Art — major-doam-8278

- Short title: Thalpan Rock Art
- Regions: gilgit-baltistan; derived districts: gilgit-baltistan-diamir
- Category: Archaeological Site; designation: Major heritage site
- Selection: A major rock-art landscape with varied cultural traditions.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/8278); verified 2026-09-23
- Source publication: Archaeological Survey of Gilgit-Baltistan by Baltistan Culture and Development Foundation
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Thalpan Rock Art | 35.4205 | 74.1236 | verified-official · [source](https://doam.gov.pk/public/sites/8278) | gilgit-baltistan-diamir |

- Thalpan Rock Art: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Thagas Khanqah — major-doam-7966

- Short title: Thagas Khanqah
- Regions: gilgit-baltistan; derived districts: gilgit-baltistan-ghanche
- Category: Sacred Heritage; designation: Major heritage site
- Selection: Sacred architectural heritage beyond the principal towns.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/7966); verified 2026-09-23
- Source publication: History of Northern Areas of Pakistan: Up to 2000 A.D.
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: missing; neutral placeholder

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Thagas Khanqah | 35.216666667 | 76.463055556 | verified-official · [source](https://doam.gov.pk/public/sites/7966) | gilgit-baltistan-ghanche |

- Thagas Khanqah: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Khaplu Polo Ground — major-doam-7973

- Short title: Khaplu Polo Ground
- Regions: gilgit-baltistan; derived districts: gilgit-baltistan-ghanche
- Category: Cultural Landscape; designation: Major heritage site
- Selection: A cultural landscape broadening the inventory beyond buildings.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/7973); verified 2026-09-23
- Source publication: Tourism, Sports, Culture, Archaeology & Museum Department Gilgit-Baltistan
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: missing; neutral placeholder

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Khaplu Polo Ground | 35.149861 | 76.336873 | verified-official · [source](https://doam.gov.pk/public/sites/7973) | gilgit-baltistan-ghanche |

- Khaplu Polo Ground: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Red Fort, Muzaffarabad — major-doam-6663

- Short title: Red Fort, Muzaffarabad
- Regions: azad-kashmir; derived districts: azad-kashmir-muzaffarabad
- Category: Fortification; designation: Major heritage site
- Selection: A principal urban fort and historic defensive position.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6663); verified 2026-09-23
- Source publication: Threat to the Cultural Heritage of Pakistan Survey and Documentation of Tangible and Intangible Heritage of Azad Jammu & Kashmir and Gilgit-Baltistan
- Legal status: Protected by Azad Jammu & Kashmir Preservation and Protection of Antiquities Act, 1986. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Red Fort, Muzaffarabad | 34.38218939 | 73.464810036 | verified-official · [source](https://doam.gov.pk/public/sites/6663) | azad-kashmir-muzaffarabad |

- Red Fort, Muzaffarabad: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Sharda Temple — major-doam-6633

- Short title: Sharda Temple
- Regions: azad-kashmir; derived districts: azad-kashmir-neelum
- Category: Sacred Heritage; designation: Major heritage site
- Selection: A regionally important sacred and architectural monument.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6633); verified 2026-09-23
- Source publication: Threat to the Cultural Heritage of Pakistan Survey and Documentation of Tangible and Intangible Heritage of Azad Jammu & Kashmir and Gilgit-Baltistan
- Legal status: Protected by Azad Jammu & Kashmir Preservation and Protection of Antiquities Act, 1986. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Sharda Temple | 34.792222333 | 74.190225972 | verified-official · [source](https://doam.gov.pk/public/sites/6633) | azad-kashmir-neelum |

- Sharda Temple: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Sharda Fort — major-doam-6666

- Short title: Sharda Fort
- Regions: azad-kashmir; derived districts: azad-kashmir-neelum
- Category: Fortification; designation: Major heritage site
- Selection: Defensive history separate from the nearby temple.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6666); verified 2026-09-23
- Source publication: Threat to the Cultural Heritage of Pakistan Survey and Documentation of Tangible and Intangible Heritage of Azad Jammu & Kashmir and Gilgit-Baltistan
- Legal status: Protected by Azad Jammu & Kashmir Preservation and Protection of Antiquities Act, 1986. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Sharda Fort | 34.791643414 | 74.192578312 | verified-official · [source](https://doam.gov.pk/public/sites/6666) | azad-kashmir-neelum |

- Sharda Fort: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Baral Fort — major-doam-10365

- Short title: Baral Fort
- Regions: azad-kashmir; derived districts: azad-kashmir-sudhnoti
- Category: Fortification; designation: Major heritage site
- Selection: Geographic representation of Sudhnoti and its fort-building history.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/10365); verified 2026-09-23
- Source publication: Baral Fort
- Legal status: Protected by Azad Jammu & Kashmir Preservation and Protection of Antiquities Act, 1986. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Baral Fort | 33.63701 | 73.70379 | verified-official · [source](https://doam.gov.pk/public/sites/10365) | azad-kashmir-sudhnoti |

- Baral Fort: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Mangla Fort — major-doam-6675

- Short title: Mangla Fort
- Regions: azad-kashmir; derived districts: azad-kashmir-mirpur
- Category: Fortification; designation: Major heritage site
- Selection: River crossings and regional defensive architecture.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6675); verified 2026-09-23
- Source publication: Threat to the Cultural Heritage of Pakistan Survey and Documentation of Tangible and Intangible Heritage of Azad Jammu & Kashmir and Gilgit-Baltistan
- Legal status: Protected by Azad Jammu & Kashmir Preservation and Protection of Antiquities Act, 1986. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Mangla Fort | 33.13082 | 73.64115 | verified-official · [source](https://doam.gov.pk/public/sites/6675) | azad-kashmir-mirpur |

- Mangla Fort: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Ramkot Fort — major-doam-6676

- Short title: Ramkot Fort
- Regions: azad-kashmir; derived districts: azad-kashmir-mirpur
- Category: Fortification; designation: Major heritage site
- Selection: A major fort landscape with a transformed waterside setting.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6676); verified 2026-09-23
- Source publication: Threat to the Cultural Heritage of Pakistan Survey and Documentation of Tangible and Intangible Heritage of Azad Jammu & Kashmir and Gilgit-Baltistan
- Legal status: Protected by Azad Jammu & Kashmir Preservation and Protection of Antiquities Act, 1986. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Ramkot Fort | 33.223485 | 73.641752778 | verified-official · [source](https://doam.gov.pk/public/sites/6676) | azad-kashmir-mirpur |

- Ramkot Fort: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Baghsar Fort — major-doam-6665

- Short title: Baghsar Fort
- Regions: azad-kashmir; derived districts: azad-kashmir-bhimber
- Category: Fortification; designation: Major heritage site
- Selection: Bhimber's major defensive heritage.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6665); verified 2026-09-23
- Source publication: Threat to the Cultural Heritage of Pakistan Survey and Documentation of Tangible and Intangible Heritage of Azad Jammu & Kashmir and Gilgit-Baltistan
- Legal status: Protected by Azad Jammu & Kashmir Preservation and Protection of Antiquities Act, 1986. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Baghsar Fort | 33.0397 | 74.20669 | verified-official · [source](https://doam.gov.pk/public/sites/6665) | azad-kashmir-bhimber |

- Baghsar Fort: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Saadabad Caravan Sarai — major-doam-6680

- Short title: Saadabad Caravan Sarai
- Regions: azad-kashmir; derived districts: azad-kashmir-bhimber
- Category: Historic Urban Heritage; designation: Major heritage site
- Selection: Historic route architecture adds a different building type.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6680); verified 2026-09-23
- Source publication: Threat to the Cultural Heritage of Pakistan Survey and Documentation of Tangible and Intangible Heritage of Azad Jammu & Kashmir and Gilgit-Baltistan
- Legal status: Protected by Azad Jammu & Kashmir Preservation and Protection of Antiquities Act, 1986. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Saadabad Caravan Sarai | 33.073915889 | 74.164520194 | verified-official · [source](https://doam.gov.pk/public/sites/6680) | azad-kashmir-bhimber |

- Saadabad Caravan Sarai: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Ranbir Singh Baradari — major-doam-6710

- Short title: Ranbir Singh Baradari
- Regions: azad-kashmir; derived districts: azad-kashmir-muzaffarabad
- Category: Historic Monument; designation: Major heritage site
- Selection: Civic and commemorative architecture alongside the fort inventory.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6710); verified 2026-09-23
- Source publication: Threat to the Cultural Heritage of Pakistan Survey and Documentation of Tangible and Intangible Heritage of Azad Jammu & Kashmir and Gilgit-Baltistan
- Legal status: Protected by Azad Jammu & Kashmir Preservation and Protection of Antiquities Act, 1986. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Ranbir Singh Baradari | 34.355555556 | 73.462222222 | verified-official · [source](https://doam.gov.pk/public/sites/6710) | azad-kashmir-muzaffarabad |

- Ranbir Singh Baradari: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Matrani Temple — major-doam-6650

- Short title: Matrani Temple
- Regions: azad-kashmir; derived districts: azad-kashmir-kotli
- Category: Sacred Heritage; designation: Major heritage site
- Selection: Religious diversity and Kotli district representation.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6650); verified 2026-09-23
- Source publication: Threat to the Cultural Heritage of Pakistan Survey and Documentation of Tangible and Intangible Heritage of Azad Jammu & Kashmir and Gilgit-Baltistan
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Matrani Temple | 33.48 | 74.095 | verified-official · [source](https://doam.gov.pk/public/sites/6650) | azad-kashmir-kotli |

- Matrani Temple: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Rawat Fort — major-doam-6232

- Short title: Rawat Fort
- Regions: islamabad; derived districts: islamabad-islamabad
- Category: Fortification; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Historic travel infrastructure and Gakhar-period associations.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6232); verified 2026-09-23
- Source publication: Archaeological Sites and Historical Monuments Protected Under the Antiquities Act, 1975
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Rawat Fort | 33.4981 | 73.1942 | verified-official · [source](https://doam.gov.pk/public/sites/6232) | islamabad-islamabad |

- Rawat Fort: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Sultan Muqarrab Khan's Tomb — major-doam-6233

- Short title: Sultan Muqarrab Khan's Tomb
- Regions: punjab, islamabad; derived districts: punjab-rawalpindi, islamabad-islamabad
- Category: Tomb / Funerary Heritage; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Gakhar funerary heritage; retain all derived boundary contexts.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6233); verified 2026-09-23
- Source publication: Archaeological Remains and Monuments of Islamabad Capital Territory and District Rawalpindi
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Sultan Muqarrab Khan's Tomb | 33.61775 | 73.29508 | verified-official · [source](https://doam.gov.pk/public/sites/6233) | punjab-rawalpindi, islamabad-islamabad |

- Sultan Muqarrab Khan's Tomb: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Pharwala Fort — major-doam-6224

- Short title: Pharwala Fort
- Regions: punjab, islamabad; derived districts: punjab-rawalpindi, islamabad-islamabad
- Category: Fortification; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: A major regional fort; current overlapping boundary contexts are retained.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6224); verified 2026-09-23
- Source publication: Archaeological Sites and Historical Monuments Protected Under the Antiquities Act, 1975
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Pharwala Fort | 33.61944 | 73.29917 | verified-official · [source](https://doam.gov.pk/public/sites/6224) | punjab-rawalpindi, islamabad-islamabad |

- Pharwala Fort: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Shah Allah Ditta Caves — major-doam-6344

- Short title: Shah Allah Ditta Caves
- Regions: islamabad; derived districts: islamabad-islamabad
- Category: Archaeological Site; designation: Major heritage site
- Selection: Rock-shelter heritage and the capital's older settlement landscape.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6344); verified 2026-09-23
- Source publication: Pre-Historic Rock Shelters and Caves in Capital Territory Islamabad and District Rawalpindi
- Legal status: Protected by The Antiquity Act 1975 (As amended in 1992). As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Shah Allah Ditta Caves | 33.72205 | 72.91516 | verified-official · [source](https://doam.gov.pk/public/sites/6344) | islamabad-islamabad |

- Shah Allah Ditta Caves: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Ban Faqiran Stupa — major-doam-6315

- Short title: Ban Faqiran Stupa
- Regions: islamabad; derived districts: islamabad-islamabad
- Category: Archaeological Site; designation: Major heritage site
- Selection: A protected Buddhist archaeological site within the capital territory.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6315); verified 2026-09-23
- Source publication: Archaeological Remains of Islamabad Capital Territory and Rawalpindi District
- Legal status: Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Ban Faqiran Stupa | 33.722644428 | 72.89733369 | verified-official · [source](https://doam.gov.pk/public/sites/6315) | islamabad-islamabad |

- Ban Faqiran Stupa: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Golra Sharif Temple — major-doam-6311

- Short title: Golra Sharif Temple
- Regions: islamabad; derived districts: islamabad-islamabad
- Category: Sacred Heritage; designation: Major heritage site
- Selection: Religious diversity and surviving temple architecture.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6311); verified 2026-09-23
- Source publication: Archaeological Remains of Islamabad Capital Territory and Rawalpindi District
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Golra Sharif Temple | 33.691525133 | 72.97306458 | verified-official · [source](https://doam.gov.pk/public/sites/6311) | islamabad-islamabad |

- Golra Sharif Temple: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Saidpur Temple Complex — major-doam-6230

- Short title: Saidpur Temple Complex
- Regions: islamabad; derived districts: islamabad-islamabad
- Category: Sacred Heritage; designation: Major heritage site
- Selection: Historic settlement and sacred architecture in Saidpur.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6230); verified 2026-09-23
- Source publication: Archaeological Remains and Monuments of Islamabad Capital Territory and District Rawalpindi
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Saidpur Temple Complex | 33.728202605 | 73.05895528 | verified-official · [source](https://doam.gov.pk/public/sites/6230) | islamabad-islamabad |

- Saidpur Temple Complex: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Golra Railway Station — major-doam-6310

- Short title: Golra Railway Station
- Regions: islamabad; derived districts: islamabad-islamabad
- Category: Museum / Collection; designation: Major heritage site
- Selection: Transport heritage and a collection-based experience.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6310); verified 2026-09-23
- Source publication: Archaeological Remains of Islamabad Capital Territory and Rawalpindi District
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Golra Railway Station | 33.6706 | 72.9477 | verified-official · [source](https://doam.gov.pk/public/sites/6310) | islamabad-islamabad |

- Golra Railway Station: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Meher Ali Shah Shrine — major-doam-9182

- Short title: Meher Ali Shah Shrine
- Regions: islamabad; derived districts: islamabad-islamabad
- Category: Sacred Heritage; designation: Major heritage site
- Selection: Twentieth-century sacred architecture and living cultural continuity.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/9182); verified 2026-09-23
- Source publication: Mehre Muneer
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Meher Ali Shah Shrine | 33.691375 | 72.974347222 | verified-official · [source](https://doam.gov.pk/public/sites/9182) | islamabad-islamabad |

- Meher Ali Shah Shrine: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Bari Imam Shrine — major-doam-6347

- Short title: Bari Imam Shrine
- Regions: islamabad; derived districts: islamabad-islamabad
- Category: Sacred Heritage; designation: Major heritage site
- Selection: Living sacred heritage within Islamabad.
- Authority: Department of Archaeology & Museums, Government of Pakistan; [source](https://doam.gov.pk/public/sites/6347); verified 2026-09-23
- Source publication: Shrine of Hazrat Bari Imam (R.A): Study of Shrine in Cultural Context
- Legal status: Not Protected. As recorded in the cited DOAM catalogue; not an independent review of current legislation.
- Image: temporary local reference; reuse permission not established

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Bari Imam Shrine | 33.7454 | 73.1111 | verified-official · [source](https://doam.gov.pk/public/sites/6347) | islamabad-islamabad |

- Bari Imam Shrine: Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.

### Bazira-Barikot — major-bazira

- Short title: Bazira-Barikot
- Regions: khyber-pakhtunkhwa; derived districts: khyber-pakhtunkhwa-swat
- Category: Archaeological Site; designation: UNESCO Tentative List · Not inscribed on the World Heritage List
- Selection: Long-duration urban archaeology and Swat representation beyond Buddhist monastery sites.
- Authority: UNESCO World Heritage Centre — Tentative List; submitted by Pakistan; [source](https://whc.unesco.org/en/tentativelists/7034/); verified 2026-09-23
- Source publication: See institutional record
- Legal status: Not independently established. 
- Image: missing; neutral placeholder

| Component | Latitude | Longitude | Coordinate status / source | Derived contexts |
|---|---:|---:|---|---|
| Bazira-Barikot | 34.677794444 | 72.211661111 | verified-official · [source](https://whc.unesco.org/en/tentativelists/7034/) | khyber-pakhtunkhwa-swat |

- Bazira-Barikot: Published coordinate N34 40 40.06 E72 12 41.98 converted arithmetically from DMS; not geocoded.
