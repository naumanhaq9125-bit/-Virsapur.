import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const site=resolve('D:/Virsapur-Website-Developer-Handoff/V1_2026-10-22/site');
const npm=process.argv.find(x=>x.startsWith('--npm-cli='))?.slice(10);
if(!npm)throw Error('Pass the actual npm CLI path with --npm-cli=');
const stories=JSON.parse(await readFile(join(site,'content/data/stories.json'),'utf8'));
if(stories.length!==420)throw Error('Final420-record source copy required before clean quickstart');
// Use an explicitly writable temporary directory: the Windows sandbox's redirected
// AppContainer Temp denies replacement renames despite allowing initial writes.
const testTemp=resolve('D:/Virsapur-Website-Developer-Handoff/.build-tools/quickstart-temp');await mkdir(testTemp,{recursive:true});
const env={...process.env,TEMP:testTemp,TMP:testTemp,PATH:dirname(process.execPath)+';'+process.env.PATH,CMS_DATA_MODE:'local',STUDIO_DATA_MODE:'local',PRODUCTION_CMS_ENABLED:'false',CUSTOM_TOUR_QUOTES_ENABLED:'false',PAYMENT_MODE:'disabled',STUDIO_PORT:'4184'};
const checks=[],errors=[];
async function run(label,args){
 const start=Date.now();let output='';const result=await new Promise((resolveRun,reject)=>{const child=spawn(process.execPath,args,{cwd:site,env,windowsHide:true,stdio:['ignore','pipe','pipe']});for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{output+=chunk.toString();if(output.length>24000)output=output.slice(-24000);});child.on('error',reject);child.on('exit',(code,signal)=>resolveRun({code,signal}));});
 const check={label,args:args.map(x=>x===npm?'[npm-cli]':x),exitCode:result.code,elapsedMs:Date.now()-start,passed:result.code===0,output};checks.push(check);console.log(label+': '+(check.passed?'PASS':'FAIL'));if(!check.passed)throw Error(label+' failed');
}
let server;
try{
 await run('Locked clean dependency installation',[npm,'ci','--no-audit','--no-fund']);
 await run('Complete test suite',[npm,'test']);
 await run('Safe default candidate build',[npm,'run','build']);
 await run('Candidate local SEO/link crawl',['scripts/final-release-qa.mjs']);
 await run('Candidate offline security check',['scripts/security-qa.mjs','--dir=dist-production-candidate']);
 await run('Heritage inventory check',['scripts/heritage-inventory-qa.mjs']);
 let log='';server=spawn(process.execPath,['studio/server.mjs'],{cwd:site,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
 for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>{log+=chunk.toString();if(log.length>12000)log=log.slice(-12000);});
 await new Promise((resolveReady,reject)=>{const timer=setTimeout(()=>reject(Error('Studio startup timeout')),180000);const observe=()=>{if(log.includes('Virsapur Studio: http://127.0.0.1:4184/studio/')){clearTimeout(timer);resolveReady();}else if(server.exitCode!==null){clearTimeout(timer);reject(Error('Studio exited before readiness: '+log));}else setTimeout(observe,250);};observe();});
 const origin='http://127.0.0.1:4184';
 for(const path of ['/studio/','/preview/','/candidate/','/candidate/heritage-map/','/candidate/tours/custom/']){const response=await fetch(origin+path),body=await response.text();const passed=response.status===200&&body.includes('<html')&&response.headers.get('x-robots-tag')==='noindex, nofollow';checks.push({label:'Local HTTP '+path,status:response.status,passed});if(!passed)throw Error('Local route failed: '+path);}
 const contentResponse=await fetch(origin+'/api/content'),content=await contentResponse.json();
 const counts={stories:content.stories?.length,heritagePlaces:content.heritagePlaces?.length};
 checks.push({label:'Studio final data load',counts,passed:counts.stories===420&&counts.heritagePlaces===606});
 if(counts.stories!==420||counts.heritagePlaces!==606)throw Error('Studio content count mismatch');
 const foreign=await fetch(origin+'/api/content',{headers:{Origin:'https://example.invalid'}});checks.push({label:'Local cross-origin denial',status:foreign.status,passed:foreign.status===403});if(foreign.status!==403)throw Error('Cross-origin request not rejected');
 await run('Fresh Preview local SEO/link crawl',['scripts/final-release-qa.mjs','--dir=dist-demo']);
}catch(error){errors.push(error.message);}finally{if(server&&server.exitCode===null){server.kill();await new Promise(resolveExit=>server.once('exit',resolveExit));}}
const report={checkedAt:new Date().toISOString(),site,node:process.version,npm:'12.2.1',checks,errors,passed:errors.length===0&&checks.every(x=>x.passed),notDeployed:true,scope:'Fresh locked install, test/build, offline security and local-only Studio HTTP checks. The owned4184 test server was stopped. No publication endpoint or remote CMS was called.'};
const qa=join(root,'qa-artifacts/final-build-2026-10-22');await mkdir(qa,{recursive:true});await writeFile(join(qa,'HANDOFF_QUICKSTART_QA.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:checks.length,errors}));if(!report.passed)process.exitCode=1;
