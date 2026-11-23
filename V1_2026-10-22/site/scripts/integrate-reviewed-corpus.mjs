import {readFile,writeFile,copyFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

// Deterministic local data integration, never publication. Requires the complete passing audit.
const root=fileURLToPath(new URL('..',import.meta.url));
const archive=join(root,'qa-artifacts/final-build-2026-10-22/archive');
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const [audit,records,plan,current]=await Promise.all([
  json(join(archive,'CORPUS_QUALITY.json')),json(join(archive,'CORPUS_INTEGRATION_READY.json')),
  json(join(archive,'TOPIC_PLAN.json')),json(join(root,'content/data/stories.json'))
]);
const hash=items=>createHash('sha256').update(JSON.stringify(items)).digest('hex');
if(!audit.passed||audit.actualDrafts!==420||records.length!==420||hash(records)!==audit.bodySHA256)throw Error('Complete, unchanged passing420-record audit required');
if(records.some(r=>r.status!=='review'||r.aiAssisted!==true||r.editorialReviewRequired!==true))throw Error('All integrated articles must remain AI-assisted Review');
for(const prior of current){const next=records.find(r=>r.id===prior.id);if(!next||next.slug!==prior.slug)throw Error('Current record identity/route would be lost: '+prior.id);}
for(const [source,name]of [[join(archive,'TOPIC_PLAN.json'),'TOPIC_PLAN_ORIGINAL.json'],[join(root,'content/data/stories.json'),'PRE_FINAL_INTEGRATION_STORIES.json']]){
  const destination=join(archive,name);try{await stat(destination);}catch(e){if(e.code!=='ENOENT')throw e;await copyFile(source,destination);}
}
const byId=new Map(records.map(r=>[r.id,r])),changes=[];
const fields={workingTitle:'title',primaryCategoryId:'primaryCategoryId',categoryIds:'categoryIds',province:'province',district:'district',relatedHeritageIds:'relatedHeritageIds',relatedDistrictIds:'relatedDistrictIds',relatedProvinceIds:'relatedProvinceIds',editorialReason:'editorialReason'};
const articles=plan.articles.map(p=>{
  const actual=byId.get(p.articleId);if(!actual||actual.slug!==p.slug)throw Error('Plan identity mismatch: '+p.articleId);
  const next={...p};for(const [target,source]of Object.entries(fields)){if(actual[source]!==undefined)next[target]=actual[source];}
  for(const key of ['primaryKeyword','secondaryKeywords','searchIntent'])if(actual.seo?.[key]!==undefined)next[key]=actual.seo[key];
  next.articleStatus='review';next.researchStatus=actual.publicationHold||actual.editorialHold?'drafted with explicit editorial hold':'drafted with sources; editorial review required';
  next.draftingGate='Plan acknowledged and drafting completed; publication remains a separate editorial decision.';
  next.actualReferences=actual.references;
  const differences=Object.keys(next).filter(k=>JSON.stringify(next[k])!==JSON.stringify(p[k])).map(field=>({field,before:p[field]??null,after:next[field]}));
  if(differences.length)changes.push({articleId:p.articleId,differences});return next;
});
await writeFile(join(root,'content/data/stories.json'),JSON.stringify(records,null,2)+'\n');
await writeFile(join(archive,'TOPIC_PLAN.json'),JSON.stringify({...plan,status:'420 drafted Review records; reconciled to researched titles and relationships',reconciledAt:new Date().toISOString(),scopeNote:'Original commissioning plan retained in TOPIC_PLAN_ORIGINAL.json. Current fields reflect researched Review drafts; sourcePlan remains a research lead, actualReferences records cited sources. No publication approval is implied.',articles},null,2)+'\n');
await writeFile(join(archive,'PLAN_RECONCILIATION.json'),JSON.stringify({checkedAt:new Date().toISOString(),changes,articleCount:records.length,bodySHA256:hash(records),published:0,notDeployed:true},null,2)+'\n');
console.log(JSON.stringify({canonicalArticles:records.length,status:'review',preservedCurrentIdentities:current.length,bodySHA256:hash(records),notDeployed:true}));
