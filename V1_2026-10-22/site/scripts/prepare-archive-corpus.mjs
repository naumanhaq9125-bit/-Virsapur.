import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {validateCollection} from '../src/cms/validation.mjs';

// File-only preparation and corpus audit. Never publishes or writes canonical content.
const root=fileURLToPath(new URL('..',import.meta.url)),out=join(root,'qa-artifacts/final-build-2026-10-22/archive');
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const plan=(await json(join(out,'TOPIC_PLAN.json'))).articles;
const legacy=await json(join(out,'LEGACY_STORY_METADATA.json'));
const byPlan=new Map(plan.map((x,i)=>[x.articleId,{...x,index:i}]));
const categories=await json(join(root,'content/data/archive-categories.json'));
const places=await json(join(root,'content/data/heritage-places.json'));
const catIds=new Set(categories.map(x=>x.id)),placeIds=new Set(places.map(x=>x.id)),byLegacy=new Map(legacy.map(x=>[x.id,x]));
const drafts=[],origins=new Map(),errors=[],warnings=[];
for(const batch of ['batch-a','batch-b','batch-c']){
  const dir=join(out,'drafts',batch);
  for(const name of (await readdir(dir)).filter(x=>x.endsWith('.json')).sort()){
    const records=await json(join(dir,name));
    if(!Array.isArray(records)){errors.push(`${batch}/${name}: expected record array`);continue;}
    for(const record of records){if(origins.has(record.id))errors.push(`${record.id}: duplicate draft in ${batch}/${name}`);origins.set(record.id,`${batch}/${name}`);drafts.push(record);}
  }
}
const words=text=>String(text||'').match(/[\p{L}\p{N}]+(?:['’’-][\p{L}\p{N}]+)*/gu)||[];
const prose=record=>(record.body||[]).filter(b=>['paragraph','quote','callout'].includes(b.type)).map(b=>b.text||'').join('\n\n');
const normalized=text=>words(text).join(' ').toLocaleLowerCase();
const controlledTags=['Mughal','Sikh','Buddhist','Hindu','Islamic','Christian','Colonial','Indus Valley','Gandhara','Languages','Literature','Craft','Music','Architecture','Archaeology','Punjab','Sindh','Khyber Pakhtunkhwa','Balochistan','Gilgit-Baltistan','Azad Kashmir','Islamabad','Conservation','Museums','Material Culture','Sacred Heritage','Cultural Landscapes','Oral Traditions','Regional History','Cultural Figures','Heritage Practice','Rock Art','Textiles','Ceramics','Metalwork','Manuscripts'];
const tagLookup=new Map(controlledTags.map(x=>[x.toLowerCase(),x]));
const topicTags={'heritage-place':'Architecture',archaeology:'Archaeology',architecture:'Architecture','objects-material':'Material Culture','languages-literature-living':'Languages',sacred:'Sacred Heritage','regional-history':'Regional History',personality:'Cultural Figures',landscape:'Cultural Landscapes','heritage-concept':'Heritage Practice'};
const regionTags={'KP':'Khyber Pakhtunkhwa','Khyber Pakhtunkhwa':'Khyber Pakhtunkhwa','GB':'Gilgit-Baltistan','Gilgit-Baltistan':'Gilgit-Baltistan','AJK':'Azad Kashmir','Azad Jammu and Kashmir':'Azad Kashmir','Islamabad Capital Territory':'Islamabad'};
const records=drafts.map(record=>{
  const p=byPlan.get(record.id),prior=byLegacy.get(record.id)||{};
  if(!p){errors.push(`${record.id}: absent from approved plan`);return record;}
  if(record.slug!==p.slug)errors.push(`${record.id}: slug differs from plan`);
  const tags=(record.tags||[]).map(t=>tagLookup.get(String(t).toLowerCase())).filter(Boolean);
  const region=regionTags[record.province]||record.province;if(tagLookup.has(String(region).toLowerCase()))tags.push(tagLookup.get(region.toLowerCase()));
  if(topicTags[record.contentType||p.topicType])tags.push(topicTags[record.contentType||p.topicType]);
  // Retain durable legacy identity and editorial ordering; no unchecked legacy photograph is promoted.
  return {...prior,...record,featuredImage:record.featuredImage||null,seo:{...record.seo},tags:[...new Set(tags)],sortOrder:prior.sortOrder||p.index+1};
}).sort((a,b)=>(byPlan.get(a.id)?.index??9999)-(byPlan.get(b.id)?.index??9999));
errors.push(...validateCollection('stories',records));
const rows=[],tokens=[],shingles=[],paragraphs=new Map(),duplicateParagraphs=[];
for(const record of records){
  const text=prose(record),wordCount=words(text).length,refs=record.references||[];
  for(const block of record.body||[])if(block.type==='heading'&&(/\n/.test(block.text||'')||words(block.text).length>25))errors.push(`${record.id}: heading contains prose or is excessively long`);
  const holds=record.publicationHold===true||record.editorialHold===true||wordCount<300;
  if(record.status!=='review'||record.aiAssisted!==true||record.editorialReviewRequired!==true)errors.push(`${record.id}: review/provenance guard missing`);
  if(!record.summary?.trim()||!record.seo?.title?.trim()||!record.seo?.description?.trim()||!record.seo?.primaryKeyword?.trim())errors.push(`${record.id}: required summary/SEO missing`);
  if(!record.editorialReason?.trim())warnings.push(`${record.id}: no editorialReason field`);
  if(!refs.length)errors.push(`${record.id}: no references`);
  for(const r of refs)if(!r.title||!r.publisher||!/^https?:\/\//.test(r.url||'')||!/^\d{4}-\d{2}-\d{2}$/.test(r.accessDate||''))errors.push(`${record.id}: incomplete source reference`);
  for(const id of record.categoryIds||[])if(!catIds.has(id))errors.push(`${record.id}: unknown category ${id}`);
  for(const id of record.relatedHeritageIds||[])if(!placeIds.has(id))errors.push(`${record.id}: unknown Place ${id}`);
  for(const id of record.relatedStoryIds||[])if(!byPlan.has(id))errors.push(`${record.id}: unknown related article ${id}`);
  if(wordCount<300&&!record.publicationHold&&!record.editorialHold)errors.push(`${record.id}: under300 words without an explicit hold`);
  if(wordCount<450)warnings.push(`${record.id}: ${wordCount} words; ${holds?'specific editorial hold':'below preferred450, above minimum if300+'}`);
  const parts=(record.body||[]).filter(b=>b.type==='paragraph').map(b=>normalized(b.text));
  for(const part of parts.filter(x=>words(x).length>=25)){if(paragraphs.has(part))duplicateParagraphs.push({first:paragraphs.get(part),second:record.id,wordCount:words(part).length});else paragraphs.set(part,record.id);}
  const t=words(text).map(w=>w.toLowerCase());tokens.push(t);const s=new Set();for(let i=0;i<=t.length-5;i++)s.add(t.slice(i,i+5).join(' '));shingles.push(s);
  rows.push({articleId:record.id,title:record.title,slug:record.slug,wordCount,sourcesCount:refs.length,heritageLinksCount:(record.relatedHeritageIds||[]).length,internalLinks:(record.relatedHeritageIds||[]).length+(record.relatedStoryIds||[]).length+(record.categoryIds||[]).length,imageStatus:record.featuredImage?.productionCleared?'cleared':'no-cleared-image',seoStatus:record.seo?.title&&record.seo?.description&&record.seo?.primaryKeyword?'complete':'incomplete',similarityFlag:'none',editorialStatus:holds?'review—specific hold':'review',primaryCategory:record.primaryCategoryId,province:record.province||'',headings:(record.body||[]).filter(b=>b.type==='heading').length,descriptionCharacters:record.seo?.description?.length||0,sourceFile:origins.get(record.id)});
}
const pairs=[];
for(let i=0;i<shingles.length;i++)for(let j=i+1;j<shingles.length;j++){
 const a=shingles[i],b=shingles[j],smaller=a.size<b.size?a:b,larger=a.size<b.size?b:a;let shared=0;
 for(const word of smaller)if(larger.has(word))shared++;
 const jaccard=shared/(a.size+b.size-shared||1),containment=shared/(smaller.size||1);
 if(jaccard>=.12||containment>=.25){pairs.push({a:records[i].id,b:records[j].id,jaccard,containment,shared5grams:shared});rows[i].similarityFlag=rows[j].similarityFlag='manual-review';}
}
if(duplicateParagraphs.length)errors.push(`${duplicateParagraphs.length} repeated substantive paragraphs require revision.`);
const uniqueness={};for(const field of ['title','slug','primaryKeyword','description']){const values=new Map();for(const r of records){const value=normalized(r[field]||r.seo?.[field]);if(values.has(value)&&value)errors.push(`Duplicate ${field}: ${values.get(value)} and ${r.id}`);values.set(value,r.id);}uniqueness[field]=values.size;}
const completeIds=new Set(records.map(x=>x.id)),missing=plan.filter(p=>!completeIds.has(p.articleId)).map(p=>p.articleId);
if(process.argv.includes('--final')&&missing.length)errors.push(`${missing.length} planned articles still missing.`);
const group=(items,key)=>items.reduce((acc,x)=>(acc[x[key]||'Unspecified']=(acc[x[key]||'Unspecified']||0)+1,acc),{});
const countWords=rows.map(x=>x.wordCount),report={checkedAt:new Date().toISOString(),planned:plan.length,actualDrafts:records.length,missing,errors,warnings,passed:!errors.length&&records.length===plan.length,partialValidationPassed:!errors.length,uniqueness,wordCount:{average:Math.round(countWords.reduce((a,b)=>a+b,0)/(rows.length||1)),min:Math.min(...countWords),max:Math.max(...countWords),preferred450Plus:rows.filter(x=>x.wordCount>=450).length,below300:rows.filter(x=>x.wordCount<300).map(x=>x.articleId)},statusCounts:group(records,'status'),primaryCategoryCounts:group(records,'primaryCategoryId'),regionCounts:group(records,'province'),articlesWithReferences:rows.filter(x=>x.sourcesCount>0).length,articlesLinkedToHeritage:rows.filter(x=>x.heritageLinksCount>0).length,similarityPairs:pairs,duplicateParagraphs,rows,controlledTagCount:new Set(records.flatMap(r=>r.tags)).size,bodySHA256:createHash('sha256').update(JSON.stringify(records)).digest('hex')};
await mkdir(out,{recursive:true});await writeFile(join(out,'CORPUS_QUALITY.json'),JSON.stringify(report,null,2)+'\n');await writeFile(join(out,'CORPUS_INTEGRATION_READY.json'),JSON.stringify(records,null,2)+'\n');
console.log(JSON.stringify({drafts:records.length,planned:plan.length,wordCount:report.wordCount,errors,similarityPairs:pairs.length,duplicateParagraphs:duplicateParagraphs.length,controlledTagCount:report.controlledTagCount},null,2));
if(errors.length)process.exitCode=1;
