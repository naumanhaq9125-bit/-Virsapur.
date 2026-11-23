import {cp,mkdir,readFile,readdir,writeFile,stat,copyFile} from 'node:fs/promises';
import {join,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('..',import.meta.url));
const out='D:/Virsapur-Website-Developer-Handoff/V1_2026-10-29_DISCOVERY_BOOKING';
const target=join(out,'site');
if(!process.argv.includes('--refresh')){try{await stat(out);throw Error('Package exists: use --refresh only for this in-progress handoff.');}catch(error){if(error.code!=='ENOENT')throw error;}}
await mkdir(out,{recursive:true});
const included=['api','assets','backend','components','config','content','data','scripts','src','studio','dist-production','dist-demo'];
const excluded=[];
const filter=path=>{const name=path.split(/[\\/]/).at(-1);if(['.git','node_modules','__pycache__','.cache'].includes(name)||/^\.env(?:\.|$)/.test(name)&&name!=='.env.example'||/\.(zip|log|tmp|mp4|mov)$/i.test(name)){excluded.push(relative(root,path));return false;}return true;};
async function syncTree(from,to){const jobs=[];async function visit(src,dest){await mkdir(dest,{recursive:true});for(const entry of await readdir(src,{withFileTypes:true})){const a=join(src,entry.name),b=join(dest,entry.name);if(!filter(a))continue;if(entry.isSymbolicLink())throw Error('Symlink: '+a);if(entry.isDirectory())await visit(a,b);else jobs.push([a,b]);}}await visit(from,to);for(let i=0;i<jobs.length;i+=24)await Promise.all(jobs.slice(i,i+24).map(async([a,b])=>{const bytes=await readFile(a);try{if(bytes.equals(await readFile(b)))return;}catch(error){if(error.code!=='ENOENT')throw error;}await copyFile(a,b);}));}
for(const dir of included)await syncTree(join(root,dir),join(target,dir));
for(const entry of await readdir(root,{withFileTypes:true}))if(entry.isFile()&&['.json','.mjs','.js','.css','.md','.html','.yml','.yaml','.txt'].includes(extname(entry.name)))await cp(join(root,entry.name),join(target,entry.name));
await cp(join(root,'.env.example'),join(target,'.env.example'));
await mkdir(join(target,'studio-data'),{recursive:true});
await cp(join(root,'studio-data/local-production.json'),join(target,'studio-data/local-production.json'));
await cp(join(root,'qa-artifacts/discovery-booking-2026-10-29'),join(out,'qa'),{recursive:true,filter:path=>!path.split(/[\\/]/).includes('temp')});
await mkdir(join(target,'qa-artifacts/v1-finalization'),{recursive:true});
await cp(join(root,'qa-artifacts/v1-finalization/CALENDAR_SOURCE_NOTES.md'),join(target,'qa-artifacts/v1-finalization/CALENDAR_SOURCE_NOTES.md'));
for(const file of await readdir(join(root,'scripts/local-handoff')))await cp(join(root,'scripts/local-handoff',file),join(out,file));
await mkdir(join(out,'runtime/bin'),{recursive:true});
const nodeTarget=join(out,'runtime/bin/node.exe');
let sameRuntime=false;try{sameRuntime=(await readFile(process.execPath)).equals(await readFile(nodeTarget));}catch(error){if(error.code!=='ENOENT')throw error;}
if(!sameRuntime)await cp(process.execPath,nodeTarget);
await cp(join(root,'qa-artifacts/discovery-booking-2026-10-29/runtime-licences/NODE_LICENSE.txt'),join(out,'runtime/NODE_LICENSE.txt'));
try{await stat(join(target,'node_modules/sharp/package.json'));}catch{await cp('D:/Virsapur-Website-Developer-Handoff/V1_2026-10-29_LOCAL_REVIEW/site/node_modules',join(target,'node_modules'),{recursive:true});}
const report=JSON.parse(await readFile(join(root,'qa-artifacts/discovery-booking-2026-10-29/SYNC_REPORT.json'),'utf8'));
if(!report.passed||report.counts.stories!==420||report.counts['heritage-places']!==606)throw Error('Unexpected staged content');
await writeFile(join(out,'README.md'),`# Virsapur — local review, 29 October 2026

Double-click START_VIRSAPUR.cmd. Windows starts a hidden localhost server with the included Node runtime. No installation, publishing account or internet service is required. Startup rebuilds development Preview from the included source, but does not change Local Production.

- Website: http://127.0.0.1:4174/production/
- Development Preview: http://127.0.0.1:4174/preview/
- Admin Studio: http://127.0.0.1:4174/studio/
- Payment demonstration: http://127.0.0.1:4174/production/payment-preview/

Do not open individual website HTML files directly. Browser restrictions prevent their modules and local services from working under file://. START_HERE.html is a safe guide with the correct links.

## Included current content

420 archive articles; 606 heritage places; 8 programme records; 2 project records. Existing publication states are preserved. Draft and Review records are deliberately visible in this private local Production review. Twelve isolated, clearly labelled sample activities exercise the complete booking flow: three fixed tours, six language cohorts, a workshop, research and a cultural event. Their dates and prices are examples authorized for local review; canonical events remain unchanged.

The programme landing page shows all five programme families. Individual fixed tours and custom itineraries live under Heritage Tours. Active activities appear in a searchable catalogue beneath the five activity families. All five families have local preview imagery; temporary illustrative images remain subject to replacement/clearance before a public release.

## Photographs and map symbols

420 is the article count, not a photograph library. 606 is the Heritage Place count. The ten release-cleared media records cover seven heritage places; the remaining places do not have release-cleared site-specific photography. 65 source heritage records currently have local/reference images; these remain available where present. A small point is a heritage location, a number is a cluster/components, and a photograph appears where one is assigned. UNESCO status remains separately labelled.

In Studio choose Media, upload a JPG/PNG/WebP (under 12 MB), add credit/licence/source information, then choose Map Heritage and the site. Use “Photograph from media library”, then Validate and save. The photograph appears in development Preview. Local Production is a separate snapshot. From site/ run the bundled runtime with scripts/stage-local-production.mjs to refresh this private all-real-content review. The existing Publish to Local Production action retains its published-only clean-release semantics.

The integrated booking walkthrough supports participants, server-calculated sample prices, success/decline/cancellation, capacity checks and duplicate protection. Successful simulations create one numbered ticket per participant, downloaded together as a printable HTML file. They are not valid admission tickets. Sample bookings are saved only on this computer and are visible in Studio Mock Orders. No email is sent. No card/bank data is requested. No payment provider, hosted CMS, Supabase or Vercel is enabled.

## Complete heritage discovery

All 606 records participate in map markers and clusters, including the 385 formerly list-only records. Browse all opens the full searchable inventory. Clusters expand as you zoom or click; district names use internal labels without long leaders. The homepage and full map share clean province borders. At minimum zoom, one further outward wheel movement returns to the parent level; inward zoom over a province/district enters it. Drag or use the horizontal/vertical scrollbars to pan a zoomed map. The complete province fits above the closed drawer.

## Sample activity editing

The isolated content/fixtures/booking-preview.json file contains sample dates, prices, capacities and locations. It is loaded only in local-review/demo modes. Real content statuses and canonical events remain separate. studio/booking-store.mjs and its tests own local ticket generation. A hosted release does not load sample activities and cannot use this local checkout.

## Developer files

- site/src, components, styles.css, app.js: website source.
- site/content, data, assets/maps: canonical content and geography.
- site/dist-production: complete private local Production build (${report.status.routes} routes, all noindex).
- site/dist-demo: development Preview, including labelled demo fixtures.
- site/studio: local Admin source; run through the server.
- site/backend and api: retained future integration code, dormant.
- site/node_modules and runtime: ready-to-run Windows dependencies, with upstream licences. package.json and lockfile support normal developer installation on other systems.
- qa: checks and screenshots for this repair; FILES.sha256.json verifies the packaged files.

The previous V1_2026-10-22 release candidate remains unchanged in its own folder. This package is a private review, not a public release. STOP_VIRSAPUR.cmd stops only the server launched by this package. Runtime data created later (uploads, revisions, quotes and mock orders) is local and is not part of the initial handoff.
`);
await writeFile(join(out,'REVIEW_PACKAGE_MANIFEST.md'),'# Package directory manifest\n\nIncluded: site/{'+included.join(', ')+'}; site/node_modules (intentional offline runtime dependency); site/studio-data/local-production.json (snapshot metadata only); site/qa-artifacts/v1-finalization (calendar evidence); runtime; qa (latest repair evidence); root launchers, HTML guide and documentation.\n\nExcluded: .git; caches; backups; old build archives; dist-production-candidate (older published-only snapshot); failed/intermediate dist-local-* builds; review-package-work; work; old QA screenshots/recordings; original studio-data requests, orders and revisions; credentials and .env files other than .env.example. The earlier immutable October 22 handoff remains separate.\n\nSource files copied unchanged from the working project after checks. Dormant backend code is retained, not activated.\n\nFiltered entries: '+(excluded.join(', ')||'none inside selected source directories')+'\n');
await writeFile(join(out,'PACKAGE_STATE.json'),JSON.stringify({version:'2026-10-29-discovery-booking',notDeployed:true,sourceRoot:root,counts:report.counts,routes:report.status.routes,createdAt:new Date().toISOString()},null,2)+'\n');
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){if(e.name==='local-runtime')continue;const p=join(dir,e.name),rel=relative(out,p).replaceAll('\\','/');if(rel.startsWith('site/studio-data/')&&rel!=='site/studio-data/local-production.json')continue;if(e.isSymbolicLink())throw Error('Symlink in handoff '+p);if(e.isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
const hashes={},paths=await walk(out);for(let i=0;i<paths.length;i+=24)await Promise.all(paths.slice(i,i+24).map(async path=>{const rel=relative(out,path).replaceAll('\\','/');if(rel==='FILES.sha256.json')return;hashes[rel]=createHash('sha256').update(await readFile(path)).digest('hex');}));
await writeFile(join(out,'FILES.sha256.json'),JSON.stringify(hashes,null,2)+'\n');
console.log(JSON.stringify({out,files:Object.keys(hashes).length,counts:report.counts,notDeployed:true}));
