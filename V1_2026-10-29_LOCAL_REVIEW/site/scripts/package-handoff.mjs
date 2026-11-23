import {readdir,readFile,writeFile,mkdir,copyFile,stat} from 'node:fs/promises';
import {join,resolve,relative,isAbsolute,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

// A copy-only staging operation. Existing Local Production and working content are never changed.
const root=fileURLToPath(new URL('..',import.meta.url));
const output=resolve('D:/Virsapur-Website-Developer-Handoff/V1_2026-10-22');
if(!/^D:[\\/]Virsapur-Website-Developer-Handoff[\\/]V1_2026-10-22$/i.test(output))throw Error('Unexpected handoff target');
const sourceDirs=new Set(['api','assets','backend','components','config','content','data','scripts','src','studio']);
const sourceExtensions=new Set(['.js','.mjs','.css','.json','.md','.txt','.html','.yml','.yaml']);
const exclusions=[],copied=[];
const secretFile=name=>/^\.env(?:\.|$)/.test(name)&&name!=='.env.example';
async function copyTree(from,to,label){
 await mkdir(to,{recursive:true});
 for(const entry of await readdir(from,{withFileTypes:true})){
  const src=join(from,entry.name),dest=join(to,entry.name),rel=relative(root,src).replaceAll('\\','/');
  if(entry.isSymbolicLink())throw Error(`Unexpected symlink; review before packaging: ${rel}`);
  if(['node_modules','.git','.cache','__pycache__'].includes(entry.name)||secretFile(entry.name)||/\.(?:log|tmp|zip|mp4|mov|webm)$/i.test(entry.name)){exclusions.push({path:rel,reason:'dependency, secret/runtime, cache or archive/recording excluded from source copy'});continue;}
  if(entry.isDirectory())await copyTree(src,dest,label);else{await copyFile(src,dest);copied.push({path:relative(output,dest).replaceAll('\\','/'),purpose:label});}
 }
}
await mkdir(output,{recursive:true});
const stateFile=join(output,'PACKAGE_STATE.json');
try{const prior=JSON.parse(await readFile(stateFile,'utf8'));if(prior.sourceRoot!==root)throw Error('Existing package belongs to a different source');}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir(join(output,'site'),{recursive:true});
for(const entry of await readdir(root,{withFileTypes:true})){
 const src=join(root,entry.name),dest=join(output,'site',entry.name);
 if(entry.isDirectory()){
  if(sourceDirs.has(entry.name))await copyTree(src,dest,'Application source / required media or geographic data');
  else exclusions.push({path:entry.name+'/',reason:'Historical build, private runtime, backup, QA, cache or unrelated work; current candidate and QA copied separately'});
 }else if(!secretFile(entry.name)&&(sourceExtensions.has(extname(entry.name))||['.env.example','.gitignore','.vercelignore'].includes(entry.name))){await copyFile(src,dest);copied.push({path:'site/'+entry.name,purpose:entry.name.endsWith('.md')?'Repository documentation (historical references; current handoff README takes precedence)':'Application entry point or configuration'});}
 else exclusions.push({path:entry.name,reason:'Not a required source/config/documentation file; archive/private file omitted'});
}
await copyTree(join(root,'dist-production-candidate'),join(output,'release-candidate'),'Local static release candidate; NOT DEPLOYED');
await copyTree(join(root,'qa-artifacts/final-build-2026-10-22'),join(output,'qa'),'Current finalization QA, source research and editorial evidence');
await copyTree(join(root,'backend/supabase/migrations'),join(output,'database/migrations'),'Unapplied database migrations');
await copyTree(join(root,'content/data'),join(output,'content'),'Canonical provider-neutral content');
await copyTree(join(root,'assets/cleared'),join(output,'media/cleared-originals'),'Rights-cleared original photography');
await copyFile(join(root,'HANDOFF_README.md'),join(output,'HANDOFF_README.md'));
copied.push({path:'HANDOFF_README.md',purpose:'Current developer entry point and exact quickstart'});
await mkdir(join(output,'docs'),{recursive:true});
for(const name of ['BACKEND_HANDOFF.md']){await copyFile(join(root,'backend',name),join(output,'docs',name));copied.push({path:'docs/'+name,purpose:'Dormant hosted backend and database activation contract'});}
for(const name of ['CONTENT_DATABASE_REPORT.md','HERITAGE_DATABASE_REPORT.md','TECHNICAL_SEO_REPORT.md','MEDIA_REPORT.md','FINAL_REPORT.md']){
 try{await copyFile(join(root,'qa-artifacts/final-build-2026-10-22',name),join(output,name==='FINAL_REPORT.md'?name:'docs/'+name));copied.push({path:name==='FINAL_REPORT.md'?name:'docs/'+name,purpose:'Current finalization report; consult package state for acceptance'});}catch(error){if(error.code!=='ENOENT')throw error;}
}
// Reproducible inventory checks need evidence inputs, not the entire historical QA tree.
const siteQa=join(output,'site/qa-artifacts/final-build-2026-10-22');
await mkdir(join(siteQa,'baseline/content/data'),{recursive:true});
for(const name of ['HERITAGE_IMPORT_READY.json','DISTRICT_RESEARCH_STATUS.json','NEAR_COORDINATE_REVIEW.json','baseline/content/data/heritage-places.json']){await copyFile(join(root,'qa-artifacts/final-build-2026-10-22',name),join(siteQa,name));copied.push({path:'site/qa-artifacts/final-build-2026-10-22/'+name,purpose:'Required inputs for reproducible Heritage inventory QA'});}
const sourceArticles=JSON.parse(await readFile(join(root,'content/data/stories.json'),'utf8'));
const candidateManifest=JSON.parse(await readFile(join(root,'dist-production-candidate/route-manifest.json'),'utf8'));
const state={status:'STAGING — NOT FINAL',notDeployed:true,sourceRoot:root,output,updatedAt:new Date().toISOString(),articleCount:sourceArticles.length,candidateRoutes:candidateManifest.routes.length,filesCopied:copied.length,exclusions};
await writeFile(stateFile,JSON.stringify(state,null,2)+'\n');
await writeFile(join(output,'qa/PACKAGE_COPY_INVENTORY.json'),JSON.stringify({copied,exclusions,generatedAllowlist:['PACKAGE_STATE.json','qa/PACKAGE_COPY_INVENTORY.json','database/content-export.json','database/working-content-seed.sql','FILE_MANIFEST.csv','qa/FILE_INVENTORY.json','qa/PACKAGE_VERIFICATION.json'],note:'Copy-only staging may leave old files. Final verification rejects every file outside this exact inventory/allowlist; quarantine leftovers before delivery.'},null,2)+'\n');
console.log(JSON.stringify({output,status:state.status,articles:state.articleCount,filesCopied:copied.length,excludedTopLevel:exclusions.length,productionUntouched:true},null,2));
