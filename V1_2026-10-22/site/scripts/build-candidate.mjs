import {spawnSync} from 'node:child_process';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const site=JSON.parse(await readFile(join(root,'content/data/site.json'),'utf8'));
const env={...process.env,CMS_DATA_MODE:'local',STUDIO_DATA_MODE:'local',PRODUCTION_CMS_ENABLED:'false',CUSTOM_TOUR_QUOTES_ENABLED:'false',PAYMENT_MODE:'disabled',VIRSAPUR_OUTPUT_DIR:join(root,'dist-production-candidate'),SITE_ORIGIN:process.env.CANDIDATE_SITE_ORIGIN||site.productionDomain||site.defaultSiteOrigin||'http://127.0.0.1:4173/candidate'};
const result=spawnSync(process.execPath,['build.mjs','--mode=production'],{cwd:root,env,stdio:'inherit'});
if(result.error)throw result.error;process.exitCode=result.status||0;
if(result.status===0){
 const hash=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
 const walk=async dir=>{const files=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isSymbolicLink())throw Error('Unexpected build input symlink');if(entry.isDirectory())files.push(...await walk(path));else files.push(path);}return files;};
 const inputFiles=[...(await Promise.all(['src','components','content','data','assets','config'].map(dir=>walk(join(root,dir))))).flat(),...['build.mjs','app.js','styles.css','site.config.mjs','package.json','package-lock.json'].map(file=>join(root,file))];
 const inputHashes=await Promise.all(inputFiles.map(async file=>({path:relative(root,file).replaceAll('\\','/'),sha256:await hash(file)})));
 const candidateHashes=await Promise.all((await walk(env.VIRSAPUR_OUTPUT_DIR)).map(async file=>({path:relative(env.VIRSAPUR_OUTPUT_DIR,file).replaceAll('\\','/'),sha256:await hash(file)})));
 const qa=join(root,'qa-artifacts/final-build-2026-10-22');await mkdir(qa,{recursive:true});
 await writeFile(join(qa,'CANDIDATE_BUILD_PROVENANCE.json'),JSON.stringify({builtAt:new Date().toISOString(),node:process.version,mode:'local candidate; NOT DEPLOYED',siteOrigin:env.SITE_ORIGIN,inputHashes,candidateHashes},null,2)+'\n');
}
