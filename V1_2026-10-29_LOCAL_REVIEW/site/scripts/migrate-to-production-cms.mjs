import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createSupabaseProvider } from "../src/cms/providers/supabase.mjs";
import { validateCollection, validateSingleton } from "../src/cms/validation.mjs";

const root = new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const fileArg = process.argv.find(value => value.startsWith("--file="))?.slice(7) || "backups/pre-production-cms-migration/2026-09-01/content-export.json";
const apply = process.argv.includes("--apply");
const bundle = JSON.parse(await readFile(resolve(root, fileArg), "utf8"));
if (bundle.format !== "virsapur-content-export/v1") throw new Error("Unsupported content export format.");
if (bundle.records.some(record => record.data?.demo === true)) throw new Error("Migration blocked: demo fixture found in export.");
for (const [name, value] of Object.entries(bundle.singletons)) {
  const errors = validateSingleton(name, value);
  if (errors.length) throw new Error(`${name}: ${errors.join(" ")}`);
}
for (const name of [...new Set(bundle.records.map(record => record.collection))]) {
  const errors = validateCollection(name, bundle.records.filter(record => record.collection === name).map(record => record.data));
  if (errors.length) throw new Error(`${name}: ${errors.join(" ")}`);
}
console.log(`Validated ${bundle.records.length} records and ${Object.keys(bundle.singletons).length} singletons.`);
console.log(`Source checksum: ${bundle.checksum}`);
if (!apply) {
  console.log("Dry run complete. No hosted data was changed. Add --apply and set CONFIRM_CMS_MIGRATION=VIRSAPUR-PRODUCTION to import.");
  process.exit(0);
}
if (process.env.CONFIRM_CMS_MIGRATION !== "VIRSAPUR-PRODUCTION") throw new Error("Apply blocked: set CONFIRM_CMS_MIGRATION=VIRSAPUR-PRODUCTION.");
const provider = createSupabaseProvider();
const now = new Date().toISOString();
for (const [key, data] of Object.entries(bundle.singletons)) {
  await provider.request("/rest/v1/cms_singletons", { method: "POST", query: { on_conflict: "key" }, body: { key, data, status: "published", updated_at: now }, headers: { Prefer: "resolution=merge-duplicates,return=minimal" } });
  await provider.request("/rest/v1/cms_live_snapshots", { method: "POST", query: { on_conflict: "content_kind,collection,record_id" }, body: { content_kind: "singleton", collection: "singletons", record_id: key, data, content_version: `baseline-${bundle.checksum.slice(7,23)}`, live_at: now }, headers: { Prefer: "resolution=merge-duplicates,return=minimal" } });
}
const rows = bundle.records.map(record => ({
  collection: record.collection,
  id: record.id,
  slug: record.slug,
  status: record.status,
  data: record.data,
  updated_at: now
}));
await provider.request("/rest/v1/cms_records", { method: "POST", query: { on_conflict: "collection,id" }, body: rows, headers: { Prefer: "resolution=merge-duplicates,return=minimal" } });
const liveRows = bundle.records.filter(record => record.status === "published").map(record => ({ content_kind: "record", collection: record.collection, record_id: record.id, data: record.data, content_version: `baseline-${bundle.checksum.slice(7,23)}`, live_at: now }));
await provider.request("/rest/v1/cms_live_snapshots", { method: "POST", query: { on_conflict: "content_kind,collection,record_id" }, body: liveRows, headers: { Prefer: "resolution=merge-duplicates,return=minimal" } });
console.log("Hosted import completed. Run the verification script before changing CMS_DATA_MODE in Vercel.");
