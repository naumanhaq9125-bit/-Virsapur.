import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {prepareHeritageRecords} from '../../../../src/heritage-spatial.mjs';
const [region,pattern='.',offset='0',limit='30',districtPattern='.']=process.argv.slice(2);
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const records=JSON.parse(await readFile(new URL(`../${region}/catalogue.json`,import.meta.url),'utf8')).data;
const existing=JSON.parse(await readFile(new URL('../../../../content/data/heritage-places.json',import.meta.url),'utf8'));
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const currentNames=existing.flatMap(r=>[r.title,r.sourceTitle,r.shortTitle,...r.components.map(c=>c.name)]).filter(Boolean).map(norm);
const selected=records.filter(r=>new RegExp(districtPattern,'i').test(r.district)&&new RegExp(pattern,'i').test(r.name_of_site)&&!existing.some(e=>e.sourceUrl===`https://doam.gov.pk/public/sites/${r.id}`)&&!currentNames.includes(norm(r.name_of_site)));
const spatial=await prepareHeritageRecords(root,selected.map(r=>({id:String(r.id),components:[{id:String(r.id),latitude:Number(r.latitude),longitude:Number(r.longitude)}]})));
console.log(`TOTAL ${selected.length}`);
for(const [i,r]of selected.entries()){
 if(i<Number(offset)||i>=Number(offset)+Number(limit))continue;
 const issues=[];
 if(['lat','long'].some(p=>Number(r[p+'_sec'])>=60||Number(r[p+'_min'])>=60))issues.push('INVALID_DMS');
 if(Math.abs(Number(r.latitude)*60-Math.round(Number(r.latitude)*60))<1e-7&&Math.abs(Number(r.longitude)*60-Math.round(Number(r.longitude)*60))<1e-7)issues.push('WHOLE_MINUTES');
 const dup=records.filter(e=>e.id!==r.id&&e.latitude===r.latitude&&e.longitude===r.longitude);if(dup.length)issues.push('SAME_POINT:'+dup.map(d=>`${d.id}:${d.name_of_site}`).join('|'));
 const s=spatial.records[i];if(!s.districtIds.length)issues.push('UNASSIGNED');
 console.log(JSON.stringify({id:r.id,title:r.name_of_site,district:r.district,derived:s.districtIds,lat:r.latitude,lon:r.longitude,issues,description:r.description}));
}
