import {readFile,writeFile} from 'node:fs/promises';
const rows=[]; const problems=[]; const nearPairs=[];
const distance=(a,b)=>Math.hypot((a.latitude-b.latitude)*111320,(a.longitude-b.longitude)*111320*Math.cos((a.latitude+b.latitude)/2*Math.PI/180));
for(const region of ['kp','gb','ajk']){
 const research=JSON.parse(await readFile(new URL(`../${region}/research.json`,import.meta.url),'utf8'));
 const raw=JSON.parse(await readFile(new URL(`../${region}/catalogue.json`,import.meta.url),'utf8')).data;
 for(const r of research.accepted){
  rows.push(r);
  if(r.mapDisplay!=='listed'||r.featured||r.image!==null||r.placeholderImage!==true)problems.push({id:r.id,reason:'display-or-image-invariant'});
  for(const point of r.components){
  const id=Number(point.coordinateSource.split('/').at(-1));const s=raw.find(x=>x.id===id);
  if(!r.sourceTitle||!r.sourceDistrict||!r.sourceRegion||!r.sourceUrl||!point.coordinateSource)problems.push({id:r.id,reason:'source-fields'});
  if(+s.latitude!==point.latitude||+s.longitude!==point.longitude)problems.push({id:r.id,reason:'source-point-changed'});
  for(const [stem,value]of [['lat',point.latitude],['long',point.longitude]]){
   const dms=[s[stem+'_deg'],s[stem+'_min'],s[stem+'_sec']].map(Number);
   if(dms.some(x=>!Number.isFinite(x))||dms[1]<0||dms[1]>=60||dms[2]<0||dms[2]>=60)problems.push({id:r.id,reason:'invalid-raw-dms',stem,dms});
   const v=dms[0]+dms[1]/60+dms[2]/3600;
   if(Math.abs(v-value)>0.000001)problems.push({id:r.id,reason:'raw-dms-decimal-mismatch',stem,dms,value,delta:v-value});
  }
  }
 }
}
const ids=new Set(),slugs=new Set();for(const r of rows){if(ids.has(r.id)||slugs.has(r.slug))problems.push({id:r.id,reason:'duplicate-proposed-id-or-slug'});ids.add(r.id);slugs.add(r.slug);}
for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){let d=distance(rows[i].components[0],rows[j].components[0]);if(d<50)nearPairs.push({ids:[rows[i].id,rows[j].id],titles:[rows[i].title,rows[j].title],metres:Math.round(d)});}
const report={checkedAt:'2026-10-22',proposedCount:rows.length,problems,nearPairsForEditorialReview:nearPairs};
await writeFile(new URL('validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(problems.length)process.exitCode=1;
