import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CONTENT_FILES,createContentExport,createWorkingSeedSql} from '../backend/content-contract.mjs';
import {prepareHeritageRecords} from '../src/heritage-spatial.mjs';

// File-only export: this command does not connect to any database or publish content.
const root=fileURLToPath(new URL('..',import.meta.url));
const argument=name=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
const output=resolve(root,argument('output')||'backups/content-export.json');
const seedOutput=argument('seed-output')?resolve(root,argument('seed-output')):null;
const content=Object.fromEntries(await Promise.all(Object.entries(CONTENT_FILES).map(async([name,file])=>[name,JSON.parse(await readFile(join(root,'content','data',`${file}.json`),'utf8'))])));
// Deterministic geometry-derived facets, not guessed source-locality strings.
// The source coordinates/components remain untouched in canonical JSON.
content.heritagePlaces=(await prepareHeritageRecords(root,content.heritagePlaces)).records;
const fixture=JSON.parse(await readFile(join(root,'content','fixtures','demo.json'),'utf8'));
const fixtureIds=Object.values(fixture).flat().map(record=>record.id).filter(Boolean);
const bundle=createContentExport(content,{fixtureIds});
await mkdir(dirname(output),{recursive:true});
await writeFile(output,JSON.stringify(bundle,null,2)+'\n','utf8');
if(seedOutput){await mkdir(dirname(seedOutput),{recursive:true});await writeFile(seedOutput,createWorkingSeedSql(bundle),'utf8');}
console.log(`Exported ${bundle.counts.records} records and ${bundle.counts.singletons} singletons to ${output}`);
if(seedOutput)console.log(`Unapplied working-content SQL seed: ${seedOutput}`);
console.log(bundle.checksum);
