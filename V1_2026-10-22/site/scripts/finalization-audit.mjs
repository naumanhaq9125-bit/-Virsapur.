import {readFile,writeFile,readdir,mkdir,copyFile,stat} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),out=join(root,'qa-artifacts/final-build-2026-10-22');
const targets=['src','studio','api','backend','config','content','components','data','assets/maps','dist-production'];
const rootFiles=['app.js','styles.css','package.json','package-lock.json','site.config.mjs','build.mjs','qa.mjs','.env.example','vercel.json','middleware.js'];
async function walk(dir){let files=[];try{for(const x of await readdir(dir,{withFileTypes:true})){const p=join(dir,x.name);if(x.isDirectory())files.push(...await walk(p));else if(x.isFile())files.push(p);}}catch(e){if(e.code!=='ENOENT')throw e;}return files;}
const files=[...(await Promise.all(targets.map(x=>walk(join(root,x))))).flat(),...(await Promise.all(rootFiles.map(async f=>{try{await stat(join(root,f));return join(root,f);}catch{return null;}}))).filter(Boolean)];
const hashes=await Promise.all(files.map(async file=>({path:relative(root,file).replaceAll('\\','/'),sha256:createHash('sha256').update(await readFile(file)).digest('hex')})));
await mkdir(out,{recursive:true});
if(process.argv.includes('--baseline')){
 try{await stat(join(out,'BASELINE.json'));throw Error('Existing baseline must not be replaced');}catch(e){if(e.code!=='ENOENT')throw e;}
 for(const f of hashes.filter(x=>!x.path.startsWith('dist-production/')&&!x.path.startsWith('assets/maps/'))){const dest=join(out,'baseline',f.path);await mkdir(join(dest,'..'),{recursive:true});await copyFile(join(root,f.path),dest);}
 await writeFile(join(out,'BASELINE.json'),JSON.stringify({createdAt:new Date().toISOString(),hashes},null,2));
 const counts={};for(const file of await readdir(join(root,'content/data'))){if(file.endsWith('.json')){const data=JSON.parse(await readFile(join(root,'content/data',file)));counts[file]=Array.isArray(data)?{records:data.length,statuses:data.reduce((a,x)=>(a[x.status||'unset']=(a[x.status||'unset']||0)+1,a),{})}:{singleton:true};}}
 await writeFile(join(out,'CURRENT_STATE.json'),JSON.stringify({counts,protectedFiles:hashes.length,source:'Current repository, not historical report',deployment:'NOT DEPLOYED'},null,2));console.log(counts);
}else{
 const baseline=JSON.parse(await readFile(join(out,'BASELINE.json'))),current=new Map(hashes.map(x=>[x.path,x.sha256]));
 const changed=baseline.hashes.filter(x=>current.get(x.path)!==x.sha256).map(x=>x.path);
 const protectedChanges=changed.filter(x=>x.startsWith('dist-production/')||x.startsWith('assets/maps/')||x.startsWith('data/'));
 const before=JSON.parse(await readFile(join(out,'baseline/content/data/heritage-places.json'))),after=JSON.parse(await readFile(join(root,'content/data/heritage-places.json')));
 const retained=before.every(x=>{const now=after.find(y=>y.id===x.id);return now&&now.slug===x.slug&&JSON.stringify(now.components)===JSON.stringify(x.components);});
 const report={checkedAt:new Date().toISOString(),protectedChanges,retainedHeritageIdsSlugsComponents:retained,changed,passed:!protectedChanges.length&&retained};
 await writeFile(join(out,'PROTECTION_CHECK.json'),JSON.stringify(report,null,2));console.log(report);if(!report.passed)process.exitCode=1;
}
