// Deterministic assembly of reviewed selections. Writes a review candidate, never Production.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {prepareHeritageRecords} from '../src/heritage-spatial.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const qa=join(root,'qa-artifacts/atlas-signature-completion');
const selection=JSON.parse(await readFile(join(root,'content/atlas-major-selection.json')));
const media=JSON.parse(await readFile(join(qa,'media.json')));
const existing=JSON.parse(await readFile(join(qa,'baseline/content__data__heritage-places.json')));
const date='2026-09-23';
const categories={'unesco-138':'Archaeological Site','unesco-139':'Archaeological Site','unesco-140':'Archaeological Site','unesco-171':'Historic Monument','unesco-143':'Tomb / Funerary Heritage','unesco-586':'Fortification','curated-baltit':'Fortification','curated-mehrgarh':'Archaeological Site','curated-rehman-dheri':'Archaeological Site'};
const imageIds={'unesco-138':4870,'unesco-139':9752,'unesco-140':4624,'unesco-171':6502,'unesco-143':5527,'unesco-586':6537,'curated-baltit':7804,'curated-mehrgarh':8911,'curated-rehman-dheri':4696};
const imageFields=id=>media[id]?.image?Object.fromEntries(Object.entries(media[id]).filter(([k])=>k.startsWith('image'))):{image:null,imageAlt:'',imageCredit:'',imageSourceUrl:'',imageLicense:'Not available',imageTemporary:false};
const records=existing.map(record=>({...record,heritageCategory:categories[record.id],...imageFields(imageIds[record.id]),placeholderImage:!media[imageIds[record.id]]?.image,components:record.components.map(component=>({...component,coordinateSource:record.componentSourceUrl||record.sourceUrl,coordinateNote:component.coordinateNote||'Existing published UNESCO coordinate retained without relocation.'})),...(!record.designationType.startsWith('unesco')?{designationType:'unesco-tentative-list',designationName:'UNESCO Tentative List · Not inscribed on the World Heritage List',selectionReason:'Retained from the approved Atlas inventory.'}:{})}));
for(const [index,row] of selection.doam.entries()){
 const [sourceId,shortTitle,heritageCategory,summary,selectionReason,tentativeListId]=row;
 const source=JSON.parse(await readFile(join(qa,`research/doam-${sourceId}.json`)));
 const id=`major-doam-${sourceId}`;
 const slug=shortTitle.toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 records.push({id,slug,status:'published',title:shortTitle,shortTitle,summary,recordType:'place',heritageDomain:'cultural-tangible',heritageCategory,designationType:tentativeListId?'unesco-tentative-list':'none',designationName:tentativeListId?'UNESCO Tentative List · Not inscribed on the World Heritage List':'Major heritage site',legalStatus:source.facts['Legal Status'],legalStatusNote:'As recorded in the cited DOAM catalogue; not an independent review of current legislation.',sourceAuthority:'Department of Archaeology & Museums, Government of Pakistan',sourceUrl:source.url,verifiedDate:date,sourceTitle:source.title,sourceRegion:source.facts.Province,sourceDistrict:source.facts.District,sourcePublication:source.facts['Title of Publication'],selectionReason,...(tentativeListId?{tentativeListId,designationSourceUrl:`https://whc.unesco.org/en/tentativelists/${tentativeListId}/`}:{}),components:[{id:`${id}-point`,name:shortTitle,latitude:Number(source.facts.Latitude),longitude:Number(source.facts.Longitude),coordinateStatus:'verified-official',coordinateSource:source.url,coordinateNote:'Coordinate transcribed from the public DOAM record. Administrative contexts are derived from protected ADM2 polygons, not the source district label.'}],...imageFields(sourceId),placeholderImage:!media[sourceId]?.image,featured:true,sortOrder:20+index,detailsPageStatus:'future'});
}
for(const extra of selection.additional){
 const {latitude,longitude,coordinateNote,...fields}=extra;
 records.push({...fields,status:'published',recordType:'place',heritageDomain:'cultural-tangible',designationType:'unesco-tentative-list',designationName:'UNESCO Tentative List · Not inscribed on the World Heritage List',verifiedDate:date,components:[{id:`${extra.id}-point`,name:extra.title,latitude,longitude,coordinateStatus:'verified-official',coordinateSource:extra.sourceUrl,coordinateNote}],...imageFields(null),placeholderImage:true,featured:true,sortOrder:95,detailsPageStatus:'future'});
}
const prepared=await prepareHeritageRecords(root,records);
const regions=['punjab','sindh','khyber-pakhtunkhwa','balochistan','gilgit-baltistan','azad-kashmir','islamabad'];
const coverage=regions.map(region=>{const all=prepared.records.filter(r=>r.provinceRegionIds.includes(region));const major=all.filter(r=>r.designationType!=='unesco-world-heritage');return {region,unesco:all.length-major.length,major:major.length,total:all.length,districts:[...new Set(major.flatMap(r=>r.components.flatMap(c=>c.spatialMatches.filter(m=>m.regionId===region).map(m=>m.districtId))))],categories:[...new Set(major.map(r=>r.heritageCategory))],withoutImages:all.filter(r=>!r.image).map(r=>r.id),withoutCoordinateVerification:all.filter(r=>!r.components.some(c=>c.latitude!=null&&c.longitude!=null&&c.coordinateSource&&c.coordinateStatus)).map(r=>r.id)};});
await writeFile(join(qa,'heritage-places-candidate.json'),JSON.stringify(records,null,2)+'\n');
await writeFile(join(qa,'regional-coverage.json'),JSON.stringify(coverage,null,2));
console.log(JSON.stringify({records:records.length,curated:records.length-6,coverage:coverage.map(c=>({...c,districts:c.districts.length,categories:c.categories.length,withoutImages:c.withoutImages.length})),failures:prepared.failures,overlaps:prepared.overlaps},null,2));
