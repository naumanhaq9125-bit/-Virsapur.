import {readFile,readdir,mkdir,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=join(root,'qa-artifacts/atlas-hierarchy-breathing');
const allowed=new Set(['components/heritage-map.js','src/atlas-interface.css','src/site-builder.mjs','content/data/atlas-scope-media.json']);
const hashes={};
async function visit(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=join(dir,entry.name),key=relative(root,file).replaceAll('\\','/');if(entry.isDirectory())await visit(file);else if(!allowed.has(key))hashes[key]=createHash('sha256').update(await readFile(file)).digest('hex');}}
for(const dir of ['dist-production','assets','data','content','studio','api','src','components'])await visit(join(root,dir));
for(const file of ['app.js','styles.css','build.mjs','package.json','HERITAGE_ATLAS_RESEARCH_MANIFEST.md','heritage-atlas-research-manifest.json','HERITAGE_ATLAS_IMAGE_MANIFEST.md'])hashes[file]=createHash('sha256').update(await readFile(join(root,file))).digest('hex');
await mkdir(join(output,'baseline'),{recursive:true});
if(process.argv.includes('--snapshot')){
 await writeFile(join(output,'protected-baseline.json'),JSON.stringify(hashes,null,2),{flag:'wx'});
 for(const file of [...allowed].slice(0,3))await copyFile(join(root,file),join(output,'baseline',file.replaceAll('/','__')));
 console.log({baselineFiles:Object.keys(hashes).length});
}else{
 const before=JSON.parse(await readFile(join(output,'protected-baseline.json')));
 const changed=[...new Set([...Object.keys(before),...Object.keys(hashes)])].filter(file=>before[file]!==hashes[file]);
 const records=JSON.parse(await readFile(join(root,'content/data/heritage-places.json')));
 const manifest=JSON.parse(await readFile(join(root,'heritage-atlas-research-manifest.json')));
 const media=JSON.parse(await readFile(join(root,'content/data/atlas-scope-media.json')));
 const configs=[['country',null,media.country],...Object.entries(media.regions).map(([id,item])=>['region',id,item]),...Object.entries(media.districts).map(([id,item])=>['district',id,item])];
 const invalidMedia=configs.filter(([level,id,item])=>{const record=records.find(r=>r.id===item.recordId),spatial=manifest.records.find(r=>r.id===item.recordId);return !record?.image||!item.caption||!/^\d+% \d+%$/.test(item.position)||(level==='region'&&!spatial.regions.includes(id))||(level==='district'&&!spatial.derivedDistricts.includes(id));});
 const checks=[
  {name:'76 heritage records, six inscribed UNESCO properties, 70 Major Heritage',passed:records.length===76&&records.filter(r=>r.designationType==='unesco-world-heritage').length===6},
  {name:'Explicit scope photographs are existing exact-site images in the configured geography',passed:invalidMedia.length===0,invalidMedia},
  {name:'Photographic licensing status unchanged: 65 temporary, 11 missing',passed:records.filter(r=>r.image&&r.imageTemporary).length===65&&records.filter(r=>!r.image).length===11},
  {name:'Protected data, geography, research, media and Production are byte-identical',passed:changed.length===0}
 ];
 const result={generatedAt:new Date().toISOString(),protectedFiles:Object.keys(before).length,changed,checks,passed:checks.every(c=>c.passed)};
 await writeFile(join(output,'protected-checks.json'),JSON.stringify(result,null,2));console.log(result);if(!result.passed)process.exitCode=1;
}
