import {readFile,readdir,mkdir,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=join(root,'qa-artifacts',process.argv.includes('--discovery-finishing')?'atlas-v1-discovery-finishing':process.argv.includes('--final-cleanup')?'atlas-v1-final-cleanup':'atlas-exhibition-2026-09-24');
const allowed=new Set(['components/heritage-map.js','src/atlas-interface.css']);
const hashes={};
async function visit(dir){for(const e of await readdir(dir,{withFileTypes:true})){const file=join(dir,e.name),key=relative(root,file).replaceAll('\\','/');if(e.isDirectory())await visit(file);else if(!allowed.has(key))hashes[key]=createHash('sha256').update(await readFile(file)).digest('hex');}}
for(const dir of ['dist-production','assets','data','content','studio','api','src','components'])await visit(join(root,dir));
for(const file of ['app.js','styles.css','build.mjs','package.json','HERITAGE_ATLAS_RESEARCH_MANIFEST.md','heritage-atlas-research-manifest.json','HERITAGE_ATLAS_IMAGE_MANIFEST.md'])hashes[file]=createHash('sha256').update(await readFile(join(root,file))).digest('hex');
await mkdir(join(output,'baseline'),{recursive:true});
if(process.argv.includes('--snapshot')){
 await writeFile(join(output,'protected-baseline.json'),JSON.stringify(hashes,null,2),{flag:'wx'});
 for(const file of allowed)await copyFile(join(root,file),join(output,'baseline',file.replaceAll('/','__')));
 console.log({baselineFiles:Object.keys(hashes).length});
}else{
 const before=JSON.parse(await readFile(join(output,'protected-baseline.json')));
 const changed=[...new Set([...Object.keys(before),...Object.keys(hashes)])].filter(f=>before[f]!==hashes[f]);
 const records=JSON.parse(await readFile(join(root,'content/data/heritage-places.json')));
 const result={generatedAt:new Date().toISOString(),protectedFiles:Object.keys(before).length,changed,records:records.length,unesco:records.filter(r=>r.designationType==='unesco-world-heritage').length,temporaryImages:records.filter(r=>r.image&&r.imageTemporary).length,missingImages:records.filter(r=>!r.image).length,passed:!changed.length&&records.length===76};
 await writeFile(join(output,'protected-checks.json'),JSON.stringify(result,null,2));console.log(result);if(!result.passed)process.exitCode=1;
}
