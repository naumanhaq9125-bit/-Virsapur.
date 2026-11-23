import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const archive=fileURLToPath(new URL('../',import.meta.url));
const plan=JSON.parse(await readFile(archive+'TOPIC_PLAN.json','utf8'));
export async function emit(name,entries){
 await mkdir(archive+'drafts/batch-c',{recursive:true});
 const stories=entries.map(e=>{const p=plan.articles[e.index];if(e.index<280||e.index>419)throw Error('Index outside ownership');const body=e.text.trim().split(/\n\s*\n/).map(text=>text.startsWith('## ')?{type:'heading',level:2,text:text.slice(3)}:{type:'paragraph',text});return {id:p.articleId,type:'story',slug:p.slug,title:p.workingTitle,summary:e.summary,body,primaryCategoryId:p.primaryCategoryId,categoryIds:p.categoryIds,tags:e.tags,province:p.province,district:p.district,relatedDistrictIds:p.relatedDistrictIds||[],provinceRegionIds:p.relatedProvinceIds||[],relatedHeritageIds:p.relatedHeritageIds||[],relatedStoryIds:[],contentType:p.topicType,seo:{title:p.workingTitle,description:e.summary,primaryKeyword:p.primaryKeyword,socialTitle:p.workingTitle,socialDescription:e.summary},featuredImage:null,imageStatus:'no-cleared-image',references:e.references.map(([title,url,publisher,section])=>({title,url,publisher,accessDate:'2026-10-22',...(section?{section}: {})})),aiAssisted:true,editorialReviewRequired:true,status:'review',featured:false,internalNotes:e.note||'Research-based AI-assisted review draft. Examples described as hypothetical are editorial illustrations, not claims about a named site. Human subject review and citation verification required before publication.',editorialReason:p.editorialReason};});
 for(let i=0;i<stories.length;i++){if(entries[i].relatedHeritageIds)stories[i].relatedHeritageIds=entries[i].relatedHeritageIds;if(entries[i].relatedDistrictIds)stories[i].relatedDistrictIds=entries[i].relatedDistrictIds;}
 const correctedDistricts={355:['gilgit-baltistan-hunza'],357:['azad-kashmir-bhimber'],400:[]};
 for(let i=0;i<stories.length;i++)if(Object.hasOwn(correctedDistricts,entries[i].index))stories[i].relatedDistrictIds=correctedDistricts[entries[i].index];
 const qa=stories.map((s,i)=>({index:entries[i].index,id:s.id,words:s.body.map(b=>b.text).join(' ').split(/\s+/).length,references:s.references.length,status:s.status}));
 if(new Set(stories.map(s=>s.id)).size!==stories.length)throw Error('Duplicate ID');
 await writeFile(archive+'drafts/batch-c/'+name+'.json',JSON.stringify(stories,null,2)+'\n');
 await writeFile(archive+'research-c/'+name+'-qa.json',JSON.stringify({date:'2026-10-22',records:qa,duplicateIds:false,sourceMethod:'Topic-specific primary and institutional sources examined through web pages, selected document passages, indexed excerpts and catalogue metadata. Access and evidence limitations are recorded in individual internalNotes; not every full publication was accessible. No verbatim passages used; original analytical examples are not field observations. References do not imply institutional endorsement. All records require human editorial review.'},null,2)+'\n');
 console.log(qa);
 if(qa.some(x=>x.words<350))throw Error('Draft below minimum; revise before handoff');
}
