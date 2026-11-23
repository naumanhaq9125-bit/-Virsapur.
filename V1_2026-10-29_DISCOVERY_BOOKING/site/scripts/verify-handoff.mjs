import {readFile,readdir,stat,writeFile} from 'node:fs/promises';
import {join,resolve,relative,extname,parse,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {CONTENT_FILES,createContentExport,createWorkingSeedSql} from '../backend/content-contract.mjs';
import {prepareHeritageRecords} from '../src/heritage-spatial.mjs';
const output=resolve(process.argv.find(x=>x.startsWith('--dir='))?.slice(6)||'D:/Virsapur-Website-Developer-Handoff/V1_2026-10-22');
if(output===parse(output).root)throw Error('A package folder, not a drive/filesystem root, is required');
const identity=JSON.parse(await readFile(join(output,'site/package.json'),'utf8'));
if(identity.name!=='virsapur-full-site')throw Error('Target is not a Virsapur handoff');
await readFile(join(output,'HANDOFF_README.md'),'utf8');
const errors=[],manualReview=[],files=[];
const preflight=process.argv.includes('--preflight');
const selfReports=new Set(['FILE_MANIFEST.csv','qa/FILE_INVENTORY.json','qa/PACKAGE_VERIFICATION.json']);
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name),rel=relative(output,path).replaceAll('\\','/');if(entry.isSymbolicLink()){errors.push(rel+': symlink not self-contained');continue;}if(entry.isDirectory()){if(['node_modules','.git','.cache','studio-data'].includes(entry.name)){errors.push(rel+': excluded dependency/private/runtime directory');continue;}await walk(path);}else if(!selfReports.has(rel))files.push({path,rel});}}
await walk(output);
const copyInventory=JSON.parse(await readFile(join(output,'qa/PACKAGE_COPY_INVENTORY.json'),'utf8'));
const expectedFiles=new Set([...copyInventory.copied.map(x=>x.path),...(copyInventory.generatedAllowlist||[])]);
if(!copyInventory.generatedAllowlist?.length)errors.push('Expected-file allowlist is missing; refresh staging copy.');
for(const {rel}of files)if(!expectedFiles.has(rel))errors.push('Unexpected leftover file: '+rel);
const actualFiles=new Set(files.map(x=>x.rel));
for(const item of copyInventory.copied)if(!actualFiles.has(item.path))errors.push('Missing copied file: '+item.path);
const secretPatterns=[/\bsk-[A-Za-z0-9_-]{24,}\b/g,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/g,/\bsb_secret_[A-Za-z0-9_-]{24,}\b/g,/\b(?:eyJ[A-Za-z0-9_-]{20,})\.(?:eyJ[A-Za-z0-9_-]{20,})\.[A-Za-z0-9_-]{20,}\b/g,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\r\n A-Za-z0-9+/=]{80,}/g];
const textExt=new Set(['.json','.js','.mjs','.html','.css','.md','.txt','.sql','.yml','.yaml','.csv','.xml']);
const inventory=[];
for(const {path,rel}of files){const bytes=await readFile(path),name=rel.split('/').at(-1);if(/^\.env(?:\.|$)/.test(name)&&name!=='.env.example')errors.push(rel+': environment secrets file');if(/\.(?:pem|key|p12|pfx)$/i.test(name))errors.push(rel+': private-key container requires removal');if(textExt.has(extname(path))||name==='.env.example'){const text=bytes.toString('utf8');for(let n=0;n<secretPatterns.length;n++){secretPatterns[n].lastIndex=0;if(secretPatterns[n].test(text))errors.push(rel+': secret-like credential pattern '+(n+1)+' (value redacted)');}if(name==='.env.example')for(const line of text.split(/\r?\n/)){const match=line.match(/^\s*([A-Z0-9_]*(?:SECRET|PASSWORD|TOKEN|API_KEY|PUBLISHABLE_KEY)[A-Z0-9_]*)\s*=\s*(.+)$/);if(match&&!/^\s*#/.test(line))errors.push(rel+': nonempty sensitive configuration '+match[1]);}}
 const purpose=rel.startsWith('release-candidate/')?'Generated local release candidate':rel.startsWith('database/')?'Unapplied schema / content export':rel.startsWith('content/')?'Canonical working content':rel.startsWith('media/')?'Cleared original photography':rel.startsWith('qa/')?'Verification / source research / editorial evidence':rel.startsWith('site/assets/')?'Source media / protected geographic assets':rel.startsWith('site/')?'Application source / developer tooling / configuration':'Developer handoff documentation';
 inventory.push({path:rel,purpose,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
for(const required of ['site/package.json','site/package-lock.json','site/HANDOFF_README.md','release-candidate/index.html','content/stories.json','database/content-export.json','database/working-content-seed.sql','HANDOFF_README.md','FINAL_REPORT.md'])if(!inventory.some(x=>x.path===required))errors.push('Missing required file: '+required);
const state=JSON.parse(await readFile(join(output,'PACKAGE_STATE.json'),'utf8'));
if(!state.notDeployed)errors.push('Package must explicitly be NOT DEPLOYED');
try{
 const content={};for(const [collection,file]of Object.entries(CONTENT_FILES)){const a=await readFile(join(output,'content',file+'.json'),'utf8'),b=await readFile(join(output,'site/content/data',file+'.json'),'utf8');if(a!==b)throw Error('Source/content copy mismatch: '+file);content[collection]=JSON.parse(a);}
 content.heritagePlaces=(await prepareHeritageRecords(join(output,'site'),content.heritagePlaces)).records;
 const actual=JSON.parse(await readFile(join(output,'database/content-export.json'),'utf8'));
 const expected=createContentExport(content,{exportedAt:actual.exportedAt,source:actual.source});
 if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Export differs from canonical content');
 if(await readFile(join(output,'database/working-content-seed.sql'),'utf8')!==createWorkingSeedSql(expected))throw Error('SQL seed differs from verified export');
 const provenance=JSON.parse(await readFile(join(output,'qa/CANDIDATE_BUILD_PROVENANCE.json'),'utf8'));
 const hash=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
 const scopedFiles=async dir=>{const paths=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isSymbolicLink())throw Error('Unexpected provenance symlink');if(entry.isDirectory())paths.push(...await scopedFiles(path));else paths.push(path);}return paths;};
 const sourceBase=join(output,'site');
 const sourceFiles=[...(await Promise.all(['src','components','content','data','assets','config'].map(dir=>scopedFiles(join(sourceBase,dir))))).flat(),...['build.mjs','app.js','styles.css','site.config.mjs','package.json','package-lock.json'].map(file=>join(sourceBase,file))];
 for(const [base,entries]of [[join(output,'site'),provenance.inputHashes],[join(output,'release-candidate'),provenance.candidateHashes]]){
  if(!Array.isArray(entries)||!entries.length)throw Error('Build provenance is incomplete');
  const recordedPaths=entries.map(item=>item.path);
  const actualPaths=(base===sourceBase?sourceFiles:await scopedFiles(base)).map(file=>relative(base,file).replaceAll('\\','/')).sort();
  if(new Set(recordedPaths).size!==recordedPaths.length)throw Error('Duplicate build provenance paths');
  if(JSON.stringify([...recordedPaths].sort())!==JSON.stringify(actualPaths))throw Error('Build provenance file-set mismatch: '+relative(output,base));
  for(const item of entries){const file=resolve(base,item.path),rel=relative(base,file);if(rel.startsWith('..')||isAbsolute(rel))throw Error('Unsafe provenance path');if(await hash(file)!==item.sha256)throw Error('Build provenance mismatch: '+item.path);}
 }
}catch(error){errors.push('Source/export/candidate consistency: '+error.message);}
if(!preflight){
 if(state.status!=='VERIFIED LOCAL HANDOFF — NOT DEPLOYED')errors.push('Package state is not final; STAGING cannot pass final verification.');
 try{
  const csv=(await readFile(join(output,'FILE_MANIFEST.csv'),'utf8')).replace(/^\uFEFF/,'');
  const rows=[];let row=[],value='',quoted=false;
  for(let i=0;i<csv.length;i++){const c=csv[i];if(c==='"'){if(quoted&&csv[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if(c==='\n'&&!quoted){row.push(value.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);row=[];value='';}else value+=c;}
  if(quoted)throw Error('Unclosed CSV quote');if(value||row.length){row.push(value);rows.push(row);}
  if(JSON.stringify(rows.shift())!==JSON.stringify(['path','purpose','size','sha256']))throw Error('Unexpected manifest columns');
  const listed=new Map(rows.map(r=>[r[0],r]));if(listed.size!==rows.length||listed.size!==inventory.length)throw Error('Manifest row count/uniqueness differs from actual inventory');
  for(const item of inventory){const r=listed.get(item.path);if(!r||r[1]!==item.purpose||r[2]!==String(item.size)||r[3]!==item.sha256)throw Error('Manifest mismatch: '+item.path);}
 }catch(error){errors.push('FILE_MANIFEST.csv: '+error.message);}
}
const report={checkedAt:new Date().toISOString(),output,preflightOnly:preflight,finalAcceptance:!preflight&&errors.length===0,fileCount:inventory.length,bytes:inventory.reduce((n,x)=>n+x.size,0),errors,manualReview,passed:errors.length===0,exclusionsFromManifest:[...selfReports],secretScan:'High-confidence credential signatures, private-key files, non-template env files and nonempty sensitive template values. No credential values are logged. This is not a guarantee against every possible secret encoding.'};
await writeFile(join(output,'qa/FILE_INVENTORY.json'),JSON.stringify(inventory,null,2)+'\n');
await writeFile(join(output,'qa/PACKAGE_VERIFICATION.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
