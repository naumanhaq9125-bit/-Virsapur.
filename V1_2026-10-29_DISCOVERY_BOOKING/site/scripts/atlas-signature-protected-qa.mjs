import { readFile, readdir, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'qa-artifacts/atlas-signature-completion');
const allowed = new Set(['components/heritage-map.js','src/atlas-interface.css','src/site-builder.mjs','src/heritage-spatial.mjs','content/data/heritage-places.json','content/atlas-major-selection.json','scripts/heritage-site-qa.mjs','scripts/atlas-panel-qa.mjs']);
const hashes = {};
async function visit(path) {
  for (const entry of await readdir(path, {withFileTypes:true})) {
    const file = join(path,entry.name), key = relative(root,file).replaceAll('\\','/');
    if(entry.isDirectory()) await visit(file);
    else if(!allowed.has(key)) hashes[key] = createHash('sha256').update(await readFile(file)).digest('hex');
  }
}
for(const dir of ['dist-production','assets/maps','data','content','studio','api','src','components']) await visit(join(root,dir));
for(const file of ['app.js','styles.css','build.mjs','package.json']) hashes[file]=createHash('sha256').update(await readFile(join(root,file))).digest('hex');
await mkdir(join(out,'baseline'),{recursive:true});
const baseline=join(out,'protected-baseline.json');
if(process.argv.includes('--snapshot')) {
  await writeFile(baseline,JSON.stringify(hashes,null,2),{flag:'wx'});
  for(const file of allowed) await copyFile(join(root,file),join(out,'baseline',file.replaceAll('/','__')));
  console.log(`Baseline: ${Object.keys(hashes).length} protected files`);
} else {
  const before=JSON.parse(await readFile(baseline,'utf8'));
  const changed=[...new Set([...Object.keys(before),...Object.keys(hashes)])].filter(file=>before[file]!==hashes[file]);
  const result={generatedAt:new Date().toISOString(),protectedFiles:Object.keys(before).length,changed,passed:!changed.length};
  await writeFile(join(out,'protected-checks.json'),JSON.stringify(result,null,2));
  console.log(result); if(changed.length) process.exitCode=1;
}
