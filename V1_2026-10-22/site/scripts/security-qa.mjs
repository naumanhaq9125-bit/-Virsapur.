import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { join, relative, resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const directoryArgument = process.argv.find(value => value.startsWith('--dir='))?.slice(6);
const output = resolve(root, directoryArgument || "dist-production");
const outputRelative = relative(root, output);
if (!outputRelative || outputRelative.startsWith('..') || isAbsolute(outputRelative)) throw Error('Security QA target must be a build inside this project.');
const candidateCheck = outputRelative === 'dist-production-candidate';
const hostedCms = process.env.PRODUCTION_CMS_ENABLED === 'true';
const failures = [];
const checks = [];
const pass = (name, detail = "") => checks.push({ name, status: "PASS", detail });
const fail = (name, detail) => { checks.push({ name, status: "FAIL", detail }); failures.push(`${name}: ${detail}`); };
async function filesUnder(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(path)); else result.push(path);
  }
  return result;
}

const outputFiles = await filesUnder(output);
if (!hostedCms) pass("CMS false by default"); else pass("Hosted CMS explicitly enabled", "Hosted checks also verify middleware and unauthenticated API denial.");
try { await stat(join(output, "admin")); hostedCms ? pass("Admin included behind middleware") : fail("Admin omitted", "dist-production/admin exists while hosted CMS is disabled."); }
catch { hostedCms ? fail("Admin included behind middleware", "Hosted CMS is enabled but dist-production/admin is missing.") : pass("Admin omitted", "No Admin file or login shell is in the public output."); }

const forbiddenNames = /(^|\\|\/)(\.env|backups?|studio-data|content|api|admin)(\\|\/|$)|\.(sql|bak|map)$/i;
const forbiddenOutput = outputFiles.map(path => relative(output, path)).filter(path => forbiddenNames.test(path) && !(hostedCms && /^admin[\\/]/i.test(path)));
forbiddenOutput.length ? fail("Public file allowlist", forbiddenOutput.join(", ")) : pass("Public file allowlist", `${outputFiles.length} files inspected.`);

const textual = outputFiles.filter(path => /\.(html|js|css|json|xml|txt)$/i.test(path));
const textBundle = (await Promise.all(textual.map(path => readFile(path, "utf8")))).join("\n");
const collections = ["stories","projects","programmes","events","people","testimonials","media"];
const draftTitles = [];
const publishedSource = [];
for (const name of collections) {
  const records = JSON.parse(await readFile(join(root, "content", "data", `${name}.json`), "utf8"));
  if (Array.isArray(records)) for (const item of records) {
    if (item.status === "published") publishedSource.push(JSON.stringify(item));
    else if (item.status && item.title?.length >= 8) draftTitles.push(item.title);
  }
}
const draftOnlyTitles = draftTitles.filter(title => !publishedSource.some(record => record.includes(title)));
const leakedTitles = draftOnlyTitles.filter(title => textBundle.includes(title));
leakedTitles.length ? fail("Draft title leak scan", leakedTitles.join(" | ")) : pass("Draft title leak scan", `${draftTitles.length} non-public titles tested.`);
const outputSecretMarkers = ["SUPABASE_SECRET_KEY","VERCEL_API_TOKEN","sb_secret_","service_role","cms_records","__Host-virsapur_access"].filter(marker => textBundle.includes(marker));
outputSecretMarkers.length ? fail("Public output secret scan", outputSecretMarkers.join(", ")) : pass("Public output secret scan");
if (textBundle.includes('name="virsapur-content-version"')) fail("Default release marker absent", "A staged CMS content-version marker appeared in the default public build."); else pass("Default release marker absent");
if (/DEMO ONLY|VIRSAPUR DEV SANDBOX|"demo"\s*:\s*true/i.test(textBundle)) fail("Demo exclusion", "A demo-only marker was found in production output."); else pass("Demo exclusion");

const vercelConfig = JSON.parse(await readFile(join(root, "vercel.json"), "utf8"));
const configuredHeaders = new Set((vercelConfig.headers ?? []).flatMap(rule => (rule.headers ?? []).map(header => header.key.toLowerCase())));
const requiredHeaders = ["content-security-policy", "permissions-policy", "referrer-policy", "x-content-type-options", "x-frame-options"];
const missingHeaders = requiredHeaders.filter(header => !configuredHeaders.has(header));
missingHeaders.length ? fail("Production security headers", missingHeaders.join(", ")) : pass("Production security headers", requiredHeaders.join(", "));

const apiDir = join(root, "api");
const apiFiles = (await filesUnder(apiDir)).map(path=>relative(apiDir,path).replaceAll('\\','/')).filter(name => name.endsWith(".js") && !name.split('/').includes('_lib'));
const previousFlag = process.env.PRODUCTION_CMS_ENABLED;
process.env.PRODUCTION_CMS_ENABLED = "false";
for (const name of apiFiles) {
  const handler = (await import(`${new URL(`../api/${name}`, import.meta.url).href}?qa=${Date.now()}-${name}`)).default;
  const response = await handler.fetch(new Request(`https://virsapur.example/api/${name.replace(/\.js$/, "")}`, { method: "POST", headers: { origin: "https://attacker.example", "content-type": "application/json" }, body: "{}" }));
  if (response.status !== 404) fail(`Disabled endpoint ${name}`, `Expected 404, received ${response.status}.`); else pass(`Disabled endpoint ${name}`);
}
if (previousFlag === undefined) delete process.env.PRODUCTION_CMS_ENABLED; else process.env.PRODUCTION_CMS_ENABLED = previousFlag;
if(hostedCms){
  try {
    const {default:middleware}=await import(`../middleware.js?qa=${Date.now()}`);
    const response=await middleware(new Request('https://virsapur.example/admin/'));
    const location=response.headers.get('location')||'';
    if(response.status===302&&new URL(location).pathname==='/admin/login/')pass('Admin routes require authentication');else fail('Admin routes require authentication',`Unexpected unauthenticated response ${response.status}.`);
  } catch(error) { fail('Admin routes require authentication',error.message); }
  for(const name of ['admin/trip-bookings.js','admin/trip-bookings/[id].js','admin-custom-tour-quotes.js']){
    try{const handler=(await import(`../api/${name}?qa=${Date.now()}-${encodeURIComponent(name)}`)).default;const response=await handler.fetch(new Request(`https://virsapur.example/api/${name.replace(/\.js$/,'')}`,{method:'GET'}));if(response.status===401||response.status===403)pass(`Unauthenticated admin API denied ${name}`);else fail(`Unauthenticated admin API denied ${name}`,`Expected 401/403, received ${response.status}.`);}catch(error){fail(`Unauthenticated admin API denied ${name}`,error.message);}
  }
}

const sql = `${await readFile(join(root,"backend","supabase","migrations","001_production_cms.sql"),"utf8")}\n${await readFile(join(root,"backend","supabase","migrations","002_security_hardening.sql"),"utf8")}`;
if (/grant\s+select[^;]+to\s+anon/i.test(sql) || /for\s+select\s+to\s+anon/i.test(sql)) fail("Anonymous database denial", "An anonymous SELECT grant or policy remains."); else pass("Anonymous database denial", "Migrations grant no CMS table access to anon/authenticated roles.");
if (!/virsapur-private','virsapur-private',false/i.test(sql) || !/update storage\.buckets set public=false where id='virsapur-media'/i.test(sql)) fail("Private media policy", "Private bucket hardening is incomplete."); else pass("Private media policy");
const publishSource = `${await readFile(join(apiDir,"publish.js"),"utf8")}\n${await readFile(join(apiDir,"publish-finalize.js"),"utf8")}`;
if (!/requireAdmin\(request, \["owner"\]\)/.test(publishSource) || !/deployment_id/.test(publishSource) || /latestPublishJob/.test(publishSource)) fail("Owner-only exact publishing", "Owner check or exact deployment correlation is missing."); else pass("Owner-only exact publishing");

let anonymousLive = candidateCheck ? "NOT RUN — local candidate QA explicitly prohibits hosted requests, even if test credentials are present." : "NOT RUN — SECURITY_TEST_SUPABASE_URL and SECURITY_TEST_SUPABASE_ANON_KEY were not supplied.";
if (!candidateCheck && process.env.SECURITY_TEST_SUPABASE_URL && process.env.SECURITY_TEST_SUPABASE_ANON_KEY) {
  const denied = [];
  for (const table of ["cms_records","cms_singletons","cms_live_snapshots","cms_publication_versions","cms_audit_log"]) {
    const response = await fetch(`${process.env.SECURITY_TEST_SUPABASE_URL.replace(/\/$/,"")}/rest/v1/${table}?select=*&limit=1`, { headers: { apikey: process.env.SECURITY_TEST_SUPABASE_ANON_KEY, authorization: `Bearer ${process.env.SECURITY_TEST_SUPABASE_ANON_KEY}` } });
    denied.push({ table, status: response.status });
    if (response.ok) fail(`Hosted anonymous denial ${table}`, `Anonymous request unexpectedly returned ${response.status}.`);
  }
  anonymousLive = denied.map(item => `${item.table}: HTTP ${item.status}`).join(", ");
}

const manifestRows = [];
for (const path of outputFiles.sort()) {
  const bytes = await readFile(path);
  manifestRows.push(`| \`${relative(output,path).replaceAll("\\","/")}\` | ${bytes.length} | \`${createHash("sha256").update(bytes).digest("hex") }\` |`);
}
const reportRoot=candidateCheck?join(root,'qa-artifacts/final-build-2026-10-22'):root;
await mkdir(reportRoot,{recursive:true});
await writeFile(join(reportRoot,candidateCheck?'CANDIDATE_PUBLIC_FILE_MANIFEST.md':'PRODUCTION_PUBLIC_FILE_MANIFEST.md'),`# ${candidateCheck?'Local candidate':'Production'} public file manifest\n\nGenerated by \`scripts/security-qa.mjs\`. Inspected build: ${outputRelative}; ${outputFiles.length} files. No build or publication is performed by this check.\n\n| Public file | Bytes | SHA-256 |\n|---|---:|---|\n${manifestRows.join("\n")}\n`);
const result = { generatedAt: new Date().toISOString(), output:outputRelative, offlineOnly:candidateCheck, passed: failures.length === 0, checks, hostedAnonymousTest: anonymousLive };
await writeFile(join(reportRoot,candidateCheck?'CANDIDATE_SECURITY_QA.json':'security-qa-results.json'),`${JSON.stringify(result,null,2)}\n`);
console.log(JSON.stringify(result,null,2));
if (failures.length) throw new Error(`Security QA failed:\n${failures.join("\n")}`);
