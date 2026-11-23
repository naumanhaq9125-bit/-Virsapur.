import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { prepareHeritageRecords } from "../src/heritage-spatial.mjs";

const root = new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const source = JSON.parse(await readFile(join(root, "content", "data", "heritage-places.json"), "utf8"));
const prepared = await prepareHeritageRecords(root, source);
const unesco = prepared.records.filter(record => record.designationType === "unesco-world-heritage");
const curated = prepared.records.filter(record => record.designationType !== "unesco-world-heritage");
const renderer = await readFile(join(root, "components", "heritage-map.js"), "utf8");
const checks = [];
const check = (name, passed, detail = {}) => checks.push({ name, passed: Boolean(passed), detail });
const expected = new Map([
  ["138", ["Archaeological Ruins at Moenjodaro", 1980]],
  ["139", ["Taxila", 1980]],
  ["140", ["Buddhist Ruins of Takht-i-Bahi and Neighbouring City Remains at Sahr-i-Bahlol", 1980]],
  ["171", ["Fort and Shalamar Gardens in Lahore", 1981]],
  ["143", ["Historical Monuments at Makli, Thatta", 1981]],
  ["586", ["Rohtas Fort", 1997]]
]);

check("Exactly six published UNESCO World Heritage properties", unesco.length === 6 && unesco.every(record => record.status === "published"));
check("Official titles, inscription years and dossier IDs", unesco.every(record => {
  const entry = expected.get(String(record.externalReference));
  return entry?.[0] === record.title && entry?.[1] === record.inscriptionYear;
}), { records: prepared.records.map(record => ({ title: record.title, year: record.inscriptionYear, dossier: record.externalReference })) });
check("Property IDs and component IDs are unique", new Set(prepared.records.map(record => record.id)).size === prepared.records.length && new Set(prepared.records.flatMap(record => record.components.map(component => component.id))).size === prepared.records.flatMap(record => record.components).length);
check("Every UNESCO record retains UNESCO provenance", unesco.every(record => record.sourceAuthority === "UNESCO World Heritage Centre" && /^https:\/\/whc\.unesco\.org\/en\/list\//.test(record.sourceUrl) && record.verifiedDate));
check("Curated additions retain provenance and do not claim inscription", curated.length >= 70 && curated.every(record => record.sourceUrl.startsWith("https://") && record.verifiedDate && !record.inscriptionYear && (record.designationType !== "unesco-tentative-list" || /not inscribed/i.test(record.designationName))));
check("Curated sites resolve to documented district contexts", curated.every(record => record.districtIds.length > 0));

const coordinateComponents = prepared.records.flatMap(record => record.components.map(component => ({ record, component }))).filter(item => item.component.latitude != null && item.component.longitude != null);
const missingComponents = prepared.records.flatMap(record => record.components.map(component => ({ record, component }))).filter(item => item.component.latitude == null || item.component.longitude == null);
check("All coordinate-bearing components fall inside Pakistan's geographic extent", coordinateComponents.every(({ component }) => component.latitude >= 23 && component.latitude <= 38 && component.longitude >= 60 && component.longitude <= 78));
check("Missing coordinates are explicit, never invented", missingComponents.length === 1 && missingComponents[0].component.id === "139-002" && missingComponents[0].component.coordinateStatus === "missing-at-source", { missing: missingComponents.map(({ component }) => component.id) });
check("Spatial assignments use point-in-polygon and retain failures", prepared.records.every(record => record.spatialAssignment?.method === "point-in-polygon") && prepared.failures.every(failure => failure.matches.length !== 1), { failures: prepared.failures });
check("All unambiguous coordinates have derived region and district IDs", coordinateComponents.every(({ component }) => component.assignmentStatus !== "spatially-derived" || Boolean(component.regionId && component.districtId)));

const taxila = prepared.records.find(record => record.id === "unesco-139");
check("Taxila is one property with eighteen components", Boolean(taxila) && taxila.components.length === 18);
check("Taxila keeps the single UNESCO-unlocated component explicit", taxila.components.filter(component => component.coordinateStatus === "missing-at-source").map(component => component.id).join() === "139-002");
check("Taxila mapped components span more than one region and district", taxila.provinceRegionIds.length > 1 && taxila.districtIds.length > 1, { regions: taxila.provinceRegionIds, districts: taxila.districtIds });
check("Renderer filters through all component contexts", /componentsInScope\(record\)/.test(renderer) && /component\.districtIds/.test(renderer) && /includes\(mapState\.districtId\)/.test(renderer));
const rawalpindi = taxila.components.filter(component => component.districtIds.includes("punjab-rawalpindi"));
const haripur = taxila.components.filter(component => component.districtIds.includes("khyber-pakhtunkhwa-haripur"));
check("Taxila appears in both district contexts with scoped components", rawalpindi.length === 12 && haripur.length === 6 && rawalpindi.some(component => component.name === "Bhir Mound") && !haripur.some(component => component.name === "Bhir Mound") && haripur.some(component => component.name === "Khanpur Cave"), { rawalpindi: rawalpindi.map(component => component.id), haripur: haripur.map(component => component.id) });
check("Overlapping Taxila components retain both contexts", ["139-014", "139-015"].every(id => taxila.components.find(component => component.id === id).districtIds.length === 2));
check("Valid multiple contexts are diagnostics, not assignment errors", prepared.overlaps.length === 4 && prepared.failures.every(item => item.matches.length === 0));
check("Unassigned Taxila component is not silently relocated", taxila.components.find(component => component.id === "139-011").districtIds.length === 0);
check("Desktop renderer has no maximumLabels slice", !/\.slice\(0,\s*display\.maximumLabels\)/.test(renderer));
check("Every desktop district label is emitted with an auditable district ID", /data-district-label/.test(renderer) && /data-district-id/.test(renderer) && /map-district-label-leader/.test(renderer));
check("Province and district markers and Taxila clustering are implemented", /if \(!heritageMarkersLayer \|\| mapState\.level === "country"\) return/.test(renderer) && /record\.id === "unesco-139"/.test(renderer) && /is-cluster-component/.test(renderer));
const protectedGeography = JSON.parse(await readFile(join(root, "qa-artifacts", "signature-atlas", "geography-baseline.json"), "utf8"));
const geometryChanges = [];
for (const [file, hash] of Object.entries(protectedGeography.hashes)) {
  const actual = createHash("sha256").update(await readFile(join(root, file))).digest("hex");
  if (actual !== hash) geometryChanges.push(file);
}
check("Protected geographic sources remain byte-identical", geometryChanges.length === 0, { changed: geometryChanges });

const provinceCounts = {};
for (const regionId of ["punjab", "sindh", "khyber-pakhtunkhwa", "balochistan", "gilgit-baltistan", "azad-kashmir", "islamabad"]) {
  const collection = JSON.parse(await readFile(join(root, "assets", "maps", "runtime", "districts", `${regionId}-admin-2.geojson`), "utf8"));
  provinceCounts[regionId] = collection.features.length;
}
check("All seven province/region district datasets are present", Object.keys(provinceCounts).length === 7 && Object.values(provinceCounts).every(Boolean), provinceCounts);
check("Protected Punjab district baseline remains 41", provinceCounts.punjab === 41);

// Evaluate the current inventory, not the historical completion-pass snapshot.
const coverage = Object.keys(provinceCounts).map(region => {
  const records = curated.filter(record => record.provinceRegionIds.includes(region));
  return {region,major:records.length,districts:[...new Set(records.flatMap(record => record.districtIds.filter(id => id.startsWith(region + "-"))))]};
});
check("All seven regions retain at least ten verified Major Heritage records", coverage.length === 7 && coverage.every(row => row.major >= 10), coverage);
check("Geographic spread across four or more districts, except Islamabad", coverage.every(row => row.districts.length >= (row.region === "islamabad" ? 1 : 4)));
check("Unique slugs and complete editorial provenance", new Set(source.map(r=>r.slug)).size === source.length && source.every(r=>r.title && r.shortTitle && r.summary && r.heritageCategory && r.designationType && r.sourceAuthority && r.sourceUrl && r.verifiedDate));
check("All coordinate-bearing components retain provenance", coordinateComponents.every(({component:c})=>c.coordinateSource && c.coordinateNote && c.coordinateStatus));
check("Every new Major Heritage coordinate is officially sourced", source.filter(r=>r.id.startsWith("major-")).every(r=>r.components.every(c=>c.coordinateStatus==="verified-official" && /^https:\/\//.test(c.coordinateSource))));
const absentImages=[];
for(const record of source.filter(r=>r.image)) { try {await readFile(join(root,record.image.replace(/^\//,"")));} catch {absentImages.push(record.id);} }
check("Local optimized photographs exist with honest provenance", !absentImages.length && source.filter(r=>r.image).every(r=>r.imageSourceUrl && r.imageCredit && r.imageLicense && r.imageTemporary===true),{absentImages});
const baselineRecords=JSON.parse(await readFile(join(root,"qa-artifacts/atlas-signature-completion/baseline/content__data__heritage-places.json"),"utf8"));
check("Original nine records retain every component coordinate", baselineRecords.every(before=>{const after=source.find(r=>r.id===before.id); return before.components.every(c=>{const found=after.components.find(n=>n.id===c.id);return found.latitude===c.latitude && found.longitude===c.longitude;});}));
check("ADM1 parent fill is explicitly disabled", renderer.includes('parentOutline.setAttribute("fill", "none")'));
check("District context is ADM2, province context ADM1", renderer.includes("'adm2'") && renderer.includes("'adm1'"));
check("Collapsed inventory has no pre-rendered image cards", renderer.includes('!drawer.hidden') && renderer.includes('drawerContent?.replaceChildren()'));
check("Single keyboard-accessible marker preview and discoverable rail handle", renderer.includes('renderMarkerPreview') && renderer.includes('atlas-rail-handle'));
const report = {
  passName: "Virsapur Heritage Atlas Signature Completion",
  generatedAt: new Date().toISOString(),
  contentHash: createHash("sha256").update(JSON.stringify(source)).digest("hex"),
  propertyCount: prepared.records.length,
  componentCount: prepared.records.reduce((sum, record) => sum + record.components.length, 0),
  coordinateCount: coordinateComponents.length,
  missingCoordinateCount: missingComponents.length,
  spatialSummary: {
    unassigned: coordinateComponents.filter(({component})=>component.spatialMatches.length===0).length,
    singleContext: coordinateComponents.filter(({component})=>component.spatialMatches.length===1).length,
    multiContext: coordinateComponents.filter(({component})=>component.spatialMatches.length>1).length,
    missingAtSource: missingComponents.length
  },
  provinceCounts,
  assignmentFailures: prepared.failures,
  multipleContextDiagnostics: prepared.overlaps,
  checks
};
const output = join(root, "qa-artifacts", "v1-finalization", "heritage-research", "heritage-qa");
await mkdir(output, { recursive: true });
await writeFile(join(output, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
const failed = checks.filter(item => !item.passed);
if (failed.length) {
  console.error(failed.map(item => `FAIL: ${item.name}`).join("\n"));
  process.exitCode = 1;
} else console.log(`Heritage QA passed: ${checks.length} checks, ${report.propertyCount} properties, ${report.componentCount} components, ${report.coordinateCount} verified coordinates.`);
