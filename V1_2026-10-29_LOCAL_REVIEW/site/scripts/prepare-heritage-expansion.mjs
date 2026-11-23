// Prepare reviewed import artifacts; canonical content is changed separately through apply_patch.
import {readFile,writeFile} from 'node:fs/promises';
import {prepareHeritageRecords} from '../src/heritage-spatial.mjs';
import {loadHeritageContext} from '../src/heritage-context.mjs';
const folder='qa-artifacts/final-build-2026-10-22',regions=['punjab','sindh','kp','balochistan','gb','ajk','islamabad'];
const baseline=JSON.parse(await readFile(`${folder}/baseline/content/data/heritage-places.json`));
const research=await Promise.all(regions.map(async key=>({key,...JSON.parse(await readFile(`${folder}/research/${key}/research.json`))})));
const proposals=research.flatMap(batch=>batch.accepted.map(record=>{const {researchSpatialContext,...value}=record;return {...value,detailsPageStatus:'available',productionCleared:false};}));
// A physical fort may belong to a shared tentative nomination without becoming a
// new UNESCO property. Preserve the existing Derawar record and its component unchanged.
for(const place of proposals.filter(x=>x.designationSourceUrl==='https://whc.unesco.org/en/tentativelists/6108/')){
 place.designationGroup={id:'unesco-tentative-6108',title:'Derawar and the Desert Forts of Cholistan',type:'unesco-tentative-list',url:place.designationSourceUrl,primaryPlaceId:'major-doam-6959'};
 place.designationType='none';place.designationName='Named in the Cholistan forts Tentative List submission; not an inscribed World Heritage property';
 place.designationNote='One physical fort within the shared tentative group6108. This record does not create a separately designated UNESCO property.';
}
const errors=[],ids=new Set(baseline.map(x=>x.id)),slugs=new Set(baseline.map(x=>x.slug)),components=new Set(baseline.flatMap(x=>x.components.map(c=>c.id)));
for(const place of proposals){
 for(const field of ['id','slug','title','summary','recordType','heritageDomain','heritageCategory','sourceAuthority','sourceUrl','sourceTitle','sourceRegion','sourceDistrict','verifiedDate'])if(!place[field])errors.push(`${place.id}: missing ${field}`);
 if(ids.has(place.id)||slugs.has(place.slug))errors.push(`Duplicate ID/slug ${place.id}`);ids.add(place.id);slugs.add(place.slug);
 if(place.mapDisplay!=='listed'||place.featured||place.image)errors.push(`Invalid display/media state ${place.id}`);
 for(const point of place.components){if(components.has(point.id))errors.push(`Duplicate component ${point.id}`);components.add(point.id);if(!Number.isFinite(point.latitude)||!Number.isFinite(point.longitude)||!point.coordinateSource||!point.coordinateNote||!point.coordinateStatus)errors.push(`Invalid source point ${point.id}`);}
}
const spatial=await prepareHeritageRecords(process.cwd(),proposals);
errors.push(...spatial.failures.map(x=>`Spatial failure ${x.propertyId}`),...spatial.overlaps.map(x=>`Spatial overlap ${x.propertyId}`));
const districts=research.flatMap(x=>x.districts),context=await loadHeritageContext(process.cwd());
for(const id of Object.keys(context.districts))if(!districts.some(x=>x.id===id||x.districtId===id))errors.push(`Missing district research ${id}`);
const report={date:'2026-10-22',baselinePlaces:baseline.length,newPlaces:proposals.length,finalPlaces:baseline.length+proposals.length,newComponents:proposals.reduce((sum,x)=>sum+x.components.length,0),configuredDistricts:Object.keys(context.districts).length,reviewedDistricts:new Set(districts.map(x=>x.id||x.districtId)).size,regions:research.map(x=>({region:x.key,additions:x.accepted.length})),errors,passed:errors.length===0,notes:['Four physical Cholistan forts reference shared tentative group6108; not four UNESCO properties. Existing Derawar and every inherited component remain unchanged.','No new imagery or remote publication.']};
await writeFile(`${folder}/HERITAGE_IMPORT_QA.json`,JSON.stringify(report,null,2));
if(errors.length)throw Error(errors.join('\n'));
await writeFile(`${folder}/HERITAGE_IMPORT_READY.json`,JSON.stringify(spatial.records,null,2));
await writeFile(`${folder}/DISTRICT_RESEARCH_STATUS.json`,JSON.stringify(districts,null,2));
console.log(report);
