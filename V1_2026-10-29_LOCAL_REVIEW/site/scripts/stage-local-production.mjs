import {copyFile,mkdir,readFile,readdir,rename,stat,writeFile} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

// Copies working content into a local review build without publishing records.
// No hosted provider, publish endpoint, migration, email or payment is invoked.
const root=fileURLToPath(new URL('..',import.meta.url));
const timestamp=new Date().toISOString().replace(/[:.]/g,'-');
const stageName=`dist-local-production-review-${timestamp.toLowerCase()}`;
const stage=join(root,stageName),production=join(root,'dist-production');
const backup=join(root,'backups/local-production-sync',timestamp);
const qa=join(root,'qa-artifacts/local-fixes-2026-10-29');
const statusPath=join(root,'studio-data/local-production.json');
const port=Number(process.env.STUDIO_PORT||4174);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid local Studio port');
const origin=`http://127.0.0.1:${port}/production`;
const env={...process.env,CMS_DATA_MODE:'local',STUDIO_DATA_MODE:'local',PRODUCTION_CMS_ENABLED:'false',CUSTOM_TOUR_QUOTES_ENABLED:'false',PAYMENT_MODE:'disabled',SITE_ORIGIN:origin,VIRSAPUR_OUTPUT_DIR:stage};
const exists=async path=>{try{await stat(path);return true;}catch(error){if(error.code==='ENOENT')return false;throw error;}};
const hash=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
async function walk(dir){const files=[];if(!await exists(dir))return files;for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isSymbolicLink())throw Error('Unexpected symlink in snapshot input');if(entry.isDirectory())files.push(...await walk(path));else files.push(path);}return files;}
async function capture(){const files=(await Promise.all(['content/data','data','assets/maps','dist-production','dist-production-candidate'].map(dir=>walk(join(root,dir))))).flat();return Object.fromEntries(await Promise.all(files.map(async path=>[relative(root,path).replaceAll('\\','/'),await hash(path)])));}
const before=await capture();
const collections=Object.fromEntries(await Promise.all(['stories','projects','programmes','events','archive-categories','heritage-places'].map(async name=>[name,JSON.parse(await readFile(join(root,'content/data',name+'.json'),'utf8'))])));
const run=args=>{const result=spawnSync(process.execPath,args,{cwd:root,env,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)throw Error(`Local staging check failed: ${args[0]}`);};
await mkdir(qa,{recursive:true});
await writeFile(join(qa,'BEFORE.json'),JSON.stringify({capturedAt:new Date().toISOString(),hashes:before},null,2)+'\n');
run(['build.mjs','--mode=local-review']);
run(['scripts/final-release-qa.mjs',`--dir=${stageName}`,'--report=qa-artifacts/local-fixes-2026-10-29/TECHNICAL_QA.json']);
const manifest=JSON.parse(await readFile(join(stage,'route-manifest.json'),'utf8'));
const routeMap=new Map(manifest.routes.map(item=>[item.route,item]));
if(manifest.mode!=='local-review'||manifest.siteOrigin!==origin||manifest.routes.some(item=>item.indexable||item.sitemap))throw Error('Local review must be loopback-only and entirely noindex');
const namespaces={'stories':'/archives/','projects':'/projects/','programmes':'/service/','archive-categories':'/archives/category/','heritage-places':'/archives/place/'};
for(const [name,prefix]of Object.entries(namespaces))for(const record of collections[name].filter(item=>!item.demo)){
 const route=routeMap.get(prefix+record.slug);
 if(!route||route.status!==record.status)throw Error(`Missing record or changed workflow state: ${record.id}`);
}
const demoIds=[];
for(const file of ['demo.json','heritage-interconnection.json']){
 const fixtures=JSON.parse(await readFile(join(root,'content/fixtures',file),'utf8'));
 for(const [name,records]of Object.entries(fixtures))for(const record of Array.isArray(records)?records:[])if(namespaces[name]){
  demoIds.push(record.id);if(routeMap.has(namespaces[name]+record.slug))throw Error('Demo fixture leaked into local Production: '+record.id);
 }
}
for(const route of manifest.routes){const path=route.route==='/'?'index.html':route.route.slice(1)+'/index.html';const html=await readFile(join(stage,path),'utf8');if(!/<meta name="robots" content="noindex,nofollow">/.test(html))throw Error('Indexable HTML in private local snapshot: '+route.route);if(/DEMO CONTENT ENABLED/.test(html)||route.route!=='/payment-preview'&&/data-checkout|data-event-id=/.test(html))throw Error('Demo checkout/banner leaked into real-content snapshot');}
if(!/^User-agent: \*\nDisallow: \/\n$/.test(await readFile(join(stage,'robots.txt'),'utf8')))throw Error('Robots must block the local review snapshot');
const after=await capture();
if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Content, geography or an existing build changed during staging; no swap performed');
await mkdir(backup,{recursive:true});
const oldStatus=await exists(statusPath)?await readFile(statusPath):null;
if(oldStatus)await copyFile(statusPath,join(backup,'local-production-status.json'));
let movedPrevious=false,installed=false;
const stagedAt=new Date().toISOString();
const status={mode:'local-review',stagedAt,origin,routes:manifest.routes.length,indexableRoutes:0,includesUnpublished:true,excludesDemo:true,qaPassed:true,notDeployed:true,contentStatusesUnchanged:true,backup:relative(root,backup).replaceAll('\\','/')};
try{
 if(await exists(production)){await rename(production,join(backup,'dist-production'));movedPrevious=true;}
 await rename(stage,production);installed=true;
 await writeFile(statusPath+'.staging',JSON.stringify(status,null,2)+'\n');
 await rename(statusPath+'.staging',statusPath);
}catch(error){
 if(installed)await rename(production,stage);
 if(movedPrevious)await rename(join(backup,'dist-production'),production);
 throw error;
}
const counts=Object.fromEntries(Object.entries(collections).map(([name,records])=>[name,records.filter(item=>!item.demo).length]));
const report={checkedAt:new Date().toISOString(),passed:true,notDeployed:true,status,counts,excludedDemoRecords:demoIds.length,canonicalContentUnchanged:true,geographyUnchanged:true,releaseCandidateUnchanged:true,previousProductionBackup:relative(root,join(backup,'dist-production')).replaceAll('\\','/'),manifestSHA256:await hash(join(production,'route-manifest.json'))};
await writeFile(join(qa,'SYNC_REPORT.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
