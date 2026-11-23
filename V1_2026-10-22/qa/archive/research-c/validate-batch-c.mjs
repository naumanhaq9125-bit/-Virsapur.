import {readFile,readdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const archive=fileURLToPath(new URL('../',import.meta.url));
const plan=JSON.parse(await readFile(archive+'TOPIC_PLAN.json','utf8'));
const files=(await readdir(archive+'drafts/batch-c')).filter(f=>f.endsWith('.json'));
const records=(await Promise.all(files.map(async f=>JSON.parse(await readFile(archive+'drafts/batch-c/'+f,'utf8'))))).flat();
const expected=plan.articles.slice(280,420);
const errors=[];
if(records.length!==140)errors.push('Expected 140 records');
for(const key of ['id','slug'])if(new Set(records.map(r=>r[key])).size!==140)errors.push('Duplicate '+key);
for(const p of expected){const r=records.find(r=>r.id===p.articleId);if(!r){errors.push('Missing '+p.articleId);continue;}if(r.slug!==p.slug)errors.push('Changed slug '+r.id);}
const words=records.map(r=>r.body.map(b=>b.text).join(' ').split(/\s+/).length);
for(const [i,r]of records.entries()){
 if(words[i]<350)errors.push('Below 350 words '+r.id);
 if(r.status!=='review'||!r.aiAssisted||!r.editorialReviewRequired||r.featured||r.featuredImage!==null||r.imageStatus!=='no-cleared-image')errors.push('Review/image flags '+r.id);
 if(r.authorId||r.publishedAt||r.publishedDate)errors.push('Unexpected author/publication date '+r.id);
 if(!r.references?.length||r.references.some(x=>!/^https?:\/\//.test(x.url)||x.accessDate!=='2026-10-22'))errors.push('Invalid reference '+r.id);
 if(r.body.some(b=>!['paragraph','heading'].includes(b.type)||(b.type==='heading'&&b.level!==2)))errors.push('Invalid block '+r.id);
}
const corrections=[
 {index:355,removedHeritageIds:['major-doam-7810'],relatedHeritageIds:['curated-baltit'],removedDistrictIds:['gilgit-baltistan-nagar'],relatedDistrictIds:['gilgit-baltistan-hunza'],reason:'Nilt belongs to Nagar, not the Hunza-focused article.'},
 {index:357,removedHeritageIds:['major-doam-10366'],relatedHeritageIds:['major-doam-6680','major-doam-9863'],removedDistrictIds:['azad-kashmir-sudhnoti'],relatedDistrictIds:['azad-kashmir-bhimber'],reason:'Rani Baoli and Hammams is Palandri/Sudhnoti, not Bhimber.'},
 {index:400,removedHeritageIds:['major-doam-8244'],relatedHeritageIds:[],removedDistrictIds:['gilgit-baltistan-astore'],relatedDistrictIds:[],reason:'Zaipur Shikari is in Astore, not Baltistan; irrigation research concerns Thurgu. No guessed canonical replacement.'}
];
for(const c of corrections){const r=records.find(r=>r.id===plan.articles[c.index].articleId);if(JSON.stringify(r.relatedHeritageIds)!==JSON.stringify(c.relatedHeritageIds)||JSON.stringify(r.relatedDistrictIds)!==JSON.stringify(c.relatedDistrictIds))errors.push('Relationship correction missing '+c.index);}
const result={date:'2026-10-22',scope:'Batch C only; no site build or canonical changes',files,records:records.length,expectedIndices:[280,419],wordRange:{min:Math.min(...words),max:Math.max(...words)},wordsUnder450:words.filter(w=>w<450).length,errors,corrections,sourceAccess:'References comprise examined primary/institutional pages, selected full-text passages, indexed excerpts and catalogue metadata. Individual internalNotes retain access limits. No claim of complete full-text reading for every reference or publication readiness.',reviewState:'All AI-assisted and editorialReviewRequired; no author, release date or image invented.'};
await writeFile(archive+'research-c/FINAL_BATCH_C_QA.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(errors.length)process.exitCode=1;
