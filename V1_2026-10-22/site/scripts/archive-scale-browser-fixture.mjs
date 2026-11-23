import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import {createArchiveDiscovery} from '../src/archive-discovery.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
// Disposable rendered test pages only. The normal Preview rebuild removes these.
// No fake record is added to content/data, the candidate or any database.
const categories=[{id:'qa-architecture',title:'Architecture'},{id:'qa-archaeology',title:'Archaeology'}];
const regions=[{id:'punjab',name:'Punjab'},{id:'sindh',name:'Sindh'}];
const districts=[{id:'punjab-lahore',name:'Lahore',parentRegionId:'punjab'},{id:'sindh-karachi',name:'Karachi',parentRegionId:'sindh'}];
const results=[];
for(const size of [100,250,500]){
 const stories=Array.from({length:size},(_,i)=>({id:`synthetic-${i}`,slug:`synthetic-${i}`,title:`Synthetic test record ${i} — ${i%2?'stone':'wood'}`,summary:`Synthetic performance fixture ${i}; not researched article content.`,status:'review',contentType:i%3?'essay':'field-note',categoryIds:[i%2?'qa-archaeology':'qa-architecture'],primaryCategoryId:i%2?'qa-archaeology':'qa-architecture',province:i%2?'Sindh':'Punjab',district:i%2?'Karachi':'Lahore',tags:[i%2?'Archaeology':'Architecture'],body:[{type:'paragraph',text:'FULL_BODY_MUST_NOT_ENTER_DISCOVERY_PAYLOAD'}]}));
 const start=performance.now();
 const api=createArchiveDiscovery({stories,categories,regions,districts,preview:true,asset:(_route,path)=>'../../'+path,href:()=> '#fixture-only'});
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Synthetic Archive ${size}-record QA</title><link rel="stylesheet" href="../../styles.css"></head><body><main><section class="section"><p>Disposable local QA — not website content</p><h1>Archive ${size}-record scale check</h1><p id="fixture-only">These are synthetic metadata records. Article links are intentionally inert.</p></section>${api.render('/archives/qa-scale-'+size)}</main></body></html>`;
 if(html.includes('FULL_BODY_MUST_NOT_ENTER_DISCOVERY_PAYLOAD'))throw Error('Full body leaked into index');
 const out=join(root,'dist-demo/archives/qa-scale-'+size);await mkdir(out,{recursive:true});await writeFile(join(out,'index.html'),html);
 results.push({size,renderMs:Math.round((performance.now()-start)*100)/100,htmlBytes:Buffer.byteLength(html),initialCards:(html.match(/<article /g)||[]).length,fullBodiesIncluded:false});
}
const report=join(root,'qa-artifacts/final-build-2026-10-22/archive/ARCHIVE_SCALE_RENDER_QA.json');
await writeFile(report,JSON.stringify({checkedAt:new Date().toISOString(),syntheticOnly:true,canonicalWrites:0,results},null,2)+'\n');
console.log(JSON.stringify(results,null,2));
