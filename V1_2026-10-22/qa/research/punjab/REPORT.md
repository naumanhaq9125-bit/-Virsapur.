# Punjab — deeper tangible-heritage research proposals

Research date: **22 October 2026, Asia/Karachi**. Proposals only; no application, canonical content, geometry, Studio, build or release files changed.

## Result

- **113 proposed new Places, 114 exact-source components**, across **37 configured Punjab districts**.
- **135 catalogue candidates individually reviewed**, plus eight district/institutional leads logged separately.
- **30 unresolved/withheld/component decisions** retained, including one gateway included within an accepted ensemble rather than duplicated as another Place.
- Full **2,185-record Punjab public catalogue** freshly retrieved and spatially/category screened. All **41 configured districts** have explicit research status.
- Every proposal is `mapDisplay: "listed"`, `featured: false`, `image: null`, `placeholderImage: true`. Publication status is a proposed value pending main-agent ingestion validation.
- Category mix: 29 historic monuments; 31 sacred places; 18 funerary places; 13 archaeological sites; 12 fortifications; six historic urban places; four museum/collection places.
- Existing baseline remains **221 Places / 240 components**. Its exact SHA-256 was unchanged after research: `004550339d98abc4a055e12489356c2c3276c82ce30d2b54f0a6dcd89a86c254`.

The new selection would extend Punjab from 62 to 175 distinct Places, subject to ingestion checks. Lodhran and Taunsa gain defensible proposals. Bhakkar and Faisalabad remain unmapped in this package because the authoritative sources consulted did not establish exact site coordinates. Their heritage value is not in question.

## Evidence and limits

The complete federal catalogue was fetched through its normal public session and public filtering endpoint. It is not a blind import: shortlisted descriptions were individually read, paraphrased and assessed for tangible significance, type diversity, identity and source limitations. The selection includes small surveyed sites where evidence adds a useful archaeological or architectural layer, not only nationally famous monuments.

All accepted points exactly match their cited DOAM record, including published decimal precision. DMS/decimal consistency, invalid seconds/minutes, whole/half-minute coordinate-pair precision, protected district geometry, existing source/ID/title/component/proximity duplication, and new-proposal proximity were checked. **No coordinate was guessed, geocoded, moved, averaged or replaced with a district/town centroid.** A source coordinate is not a new field survey; the catalogue draws on publications of varying ages. Current access, conservation condition and legal protection have not been independently field-verified.

The standalone pages for 115 draft source/component URLs were checked: **114 returned HTTP 200** with catalogue-matching titles (after HTML entity normalization); Kot Mahoi Wala Fort (6199) returned an HTTP 500 blocking page. Its full record remains available in the freshly retrieved official catalogue, so the proposal is retained with this availability limitation. The one checked Bewal URL was later withheld after an institutional coordinate contradiction. The final 114 accepted source/component URLs therefore comprise 113 successful detail pages and the one catalogue-supported/detail-page-blocked record.

The Punjab Directorate protected-list page returned 403 on direct access. The DOAM catalogue’s citations to it are retained as provenance; the report does not claim the provincial list was independently read. Live WCLA material corroborated the Shahi Hammam, Delhi Gate, Dina Nath well, Sunehri Mosque and Ranjit Singh samadhi. UNESCO tentative-list pages were read to avoid incorrect inscription or ensemble claims. District authority pages were checked for Bhakkar, Faisalabad and Mandi Bahauddin beyond the federal point catalogue.

## Important withheld records

- **Anarkali (6469):** repeats Dai Anga tomb’s exact coordinate, not its Secretariat location.
- **Darbar Mahal (10367):** decimal latitude 29.397222222 contradicts DMS latitude 39°23′50″. No assumed correction.
- **Bewal Temple (7055):** DOAM point conflicts by about 18 km with the Evacuee Trust Property Board’s official Bewal mandir geotag. The ETPB record establishes a useful lead, not permission to silently relocate or equate ambiguous records.
- **Burj / Red Sandstone Temple (6589, 6891):** matching dimensions/descriptions at contradictory locations about 10 km apart.
- **Sheikh Sadan / Kabirwala (10144):** named identity overlaps existing 6172 but coordinates disagree materially; no duplicate created.
- **Basti Zirakhwah mosque (10263):** Lodhran label but point near Layyah, with insufficient locality detail to resolve it.
- **Ali Muhammad / Wali Muhammad mosque (10272):** title and cited publication identify different mosque names.
- **Bhagan Wala temples (9767):** description expressly identifies Nandana, already proposed as 8267, but the point is about 66 km east. Duplicate and coordinate error withheld.
- **Wan Radha Ram Baoli (6004):** invalid 60-second DMS and whole-minute coordinate pair.
- **Maulapur temples, Nonar baoli, Chunian mound B, Mammun Wala mound:** insufficient coordinate precision.
- **Drohi Dagur (9506):** exact source point outside protected district polygons. Geometry remains untouched.
- **Sheranwala Baradari / Gujrat Fort:** proximity to existing records flagged for additional identity/precinct review; conservatively withheld.

The full decisions, original descriptions, publication citations and coordinate strings are in `research.json`; none of these are silently discarded.

## Ensemble and UNESCO safeguards

- Existing **Taxila and all 18 components are unchanged**. No Taxila monastery or stupa is added as a duplicate Place.
- Existing Lahore Fort/Shalamar and Rohtas records are unchanged. Adjacent independent memorials, gates and the Choa Sahib gurdwara are not labelled World Heritage.
- Jahangir, Asif Khan and Akbari Sarai are not split into new records. Nur Jahan is a separate physical monument, not named in tentative entry 1279, and receives no inferred designation.
- Dai Anga tomb and the Gulabi Bagh gateway form **one proposed new Place with two independently sourced components**.
- Jamgarh, Mojgarh, Khairgarh and Bijnot are distinct physical forts expressly named in tentative entry 6108. Their proposals say **UNESCO Tentative List**, with a note identifying the shared group. They are not four additional inscribed properties. Existing Derawar/Marot/Mirgarh/Islamgarh classifications are not edited by this research task; the parent should review presentation of the shared tentative grouping before ingestion.

## District outcomes

Counts below are new proposed Places, not total district inventory. Full source/category/review details for every district are in `research.json`.

| District | New proposals | Outcome / constraint |
|---|---:|---|
| Attock | 5 | Water, roadside, funerary and sacred architecture |
| Bahawalnagar | 3 | Fortifications and Early Harappan mounds |
| Bahawalpur | 3 | Distinct forts and Al-Sadiq Mosque; Darbar Mahal held |
| Bhakkar | 0 | Official Mankera/temple leads; exact coordinates unavailable |
| Chakwal | 4 | Railway, temple and archaeological remains |
| Chiniot | 1 | Shah Burhan mausoleum |
| Dera Ghazi Khan | 1 | Ghazi Khan mausoleum |
| Faisalabad | 0 | Clock Tower, museum, Kaiseri/Gumti verified as leads; no exact source points |
| Gujranwala | 3 | Domestic, sacred and Jain commemorative architecture |
| Gujrat | 2 | Historic bath and Kharian stepped well |
| Hafizabad | 0 | Generic mosque record held; existing coverage retained |
| Jhang | 1 | Shah Sadiq Nehang shrine |
| Jhelum | 2 | Nandana and Choa Sahib, with serial-property checks |
| Kasur | 2 | Sarai and gurdwara; ambiguous/coarse points held |
| Khanewal | 1 | Archaeological material evidence; Sheikh Sadan conflict held |
| Khushab | 1 | Khura stepped well; conflicting Burj entries held |
| Lahore | 32 | Diverse civic, museum, sacred, funerary, domestic and archaeological inventory |
| Leiah | 3 | Funerary and surveyed Thal archaeology |
| Lodhran | 2 | Sultan Ayub shrine and Raj Bhir mound |
| Mandi Bahauddin | 0 | Official railway/gurdwara/cemetery leads; exact points unavailable |
| Mianwali | 4 | Bridge, bazaar, temple and archaeological structures |
| Multan | 5 | Tilework, civic clock tower, sacred architecture and town walls |
| Muzaffargarh | 1 | Mosque adjacent to, but distinct from, existing Tahir Khan tomb |
| Nankana Sahib | 1 | Brick domed memorial; historical source district retained as provenance |
| Narowal | 2 | Mosque and temple; coarse Nonar point held |
| Okara | 2 | Daud Bandagi shrine and Bakhshi Khana fort |
| Pakpattan | 2 | Historic towers |
| Rahim Yar Khan | 2 | Khairgarh and Ahmadpur Lamma forts |
| Rajanpur | 1 | Protected Hajipur temple |
| Rawalpindi | 5 | Road, gardens, forts and water architecture; Bewal held |
| Sahiwal | 2 | Mosque remains and Dharmdas samadhi |
| Sargodha | 1 | Bhera’s independently documented Jamia Mosque |
| Sheikhupura | 3 | Water/sacred ensemble, shrine and excavated settlement |
| Sialkot | 3 | Pasrur mosque/Eidgah and Kalaswala Sikh monument |
| Toba Tek Singh | 1 | Surveyed settlement mound |
| Vehari | 3 | Gurdwara, tomb and fort/mound archaeology |
| Kot Addu | 1 | Mahmood Kot fort, assigned by protected geometry |
| Murree | 1 | Terraced Christian cemetery |
| Talagang | 2 | Historic church and Lawa haveli |
| Taunsa | 3 | Khawaja Mahmood tomb, mud fort and Khalath archaeology |
| Wazirabad | 2 | Ranjit Singh residence and Nizamabad stepped well |

## Files and validation

- `research.json`: ingestion proposals plus all district statuses, decisions, raw evidence, source metadata and diagnostics.
- `catalogue.json`: fresh 2,185-record official source snapshot.
- `spatial-catalogue.json`: read-only spatial screening of that snapshot.
- `source-checks.json`: current detail-page HTTP status, title and response hashes.
- `compile-research.mjs`: reproducible proposal compiler, with manually authored summaries and explicit decisions; writes only within this research folder.
- `fetch-catalogue.mjs`, `inspect.mjs`, `review-candidates.mjs`, `check-source-pages.mjs`: bounded research/evidence helpers; none builds or edits canonical content.

Final read-only checks passed: 113 unique IDs and slugs, no current-record ID/slug collision, all required provenance/summary fields present, every new display/image flag correct, all accepted coordinates exactly equal to their source strings, no accepted DMS precision/consistency errors, all accepted components assigned within protected geography, and unchanged canonical file hash. Parent integration should additionally run its canonical schema, runtime, page-generation and list/marker QA before any publication.
