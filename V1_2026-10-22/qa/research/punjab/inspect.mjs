import {readFile,writeFile} from 'node:fs/promises';
import {loadHeritageContext} from '../../../../src/heritage-context.mjs';
import {loadDistrictCollections,deriveHeritageAssignments} from '../../../../src/heritage-spatial.mjs';
const root=process.cwd(),{districts}=await loadHeritageContext(root),collections=await loadDistrictCollections(root);
const current=JSON.parse(await readFile('content/data/heritage-places.json','utf8'));
const catalogue=JSON.parse(await readFile(new URL('./catalogue.json',import.meta.url),'utf8')).data;
const spatial=deriveHeritageAssignments(catalogue.map(r=>({id:r.id,components:[{id:r.id,latitude:Number(r.latitude),longitude:Number(r.longitude)}]})),{punjab:collections.punjab});
await writeFile(new URL('./spatial-catalogue.json',import.meta.url),JSON.stringify(spatial,null,2));
for(const district of Object.values(districts).filter(d=>d.parentRegionId==='punjab')){
if(process.argv[2]&&!district.id.includes(process.argv[2]))continue;
const rows=catalogue.filter(r=>spatial.records.find(x=>x.id===r.id)?.districtIds.includes(district.id)&&!current.some(x=>x.sourceUrl==='https://doam.gov.pk/public/sites/'+r.id));
console.log(JSON.stringify({district:district.name,remaining:rows.length,monuments:rows.filter(r=>r.type==='Monument').map(r=>({id:r.id,title:r.name_of_site,legal:r.legal_status,chars:(r.description||'').length}))}));
}
