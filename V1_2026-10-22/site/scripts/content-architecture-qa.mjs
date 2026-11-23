import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {validateCollection,validateSingleton} from '../src/cms/validation.mjs';
import {validateHeritageIds} from '../src/heritage-relations.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const files={site:'site',homepage:'homepage',archiveCategories:'archive-categories',collaborators:'collaborators',stories:'stories',projects:'projects',programmes:'programmes',events:'events',people:'people',testimonials:'testimonials',media:'media',heritagePlaces:'heritage-places'};
const data={};for(const [key,name]of Object.entries(files))data[key]=JSON.parse(await readFile(join(root,'content/data',name+'.json'),'utf8'));
const errors=[];
for(const [key,value]of Object.entries(data))errors.push(...(key==='site'||key==='homepage'?validateSingleton(key,value):validateCollection(key,value)).map(error=>`${key}: ${error}`));
const categoryIds=new Set(data.archiveCategories.map(x=>x.id)),storyIds=new Set(data.stories.map(x=>x.id));
for(const record of [...data.stories,...data.projects,...data.programmes,...data.events])errors.push(...validateHeritageIds(record,data.heritagePlaces));
for(const story of data.stories){for(const id of story.categoryIds||[])if(!categoryIds.has(id))errors.push(`${story.id}: unknown category ${id}`);for(const id of story.relatedStoryIds||[])if(!storyIds.has(id))errors.push(`${story.id}: unknown story ${id}`);}
const report={checkedAt:new Date().toISOString(),collections:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,Array.isArray(v)?v.length:1])),errors,passed:!errors.length};
await mkdir(join(root,'qa-artifacts/final-build-2026-10-22'),{recursive:true});
await writeFile(join(root,'qa-artifacts/final-build-2026-10-22/CONTENT_ARCHITECTURE_QA.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
