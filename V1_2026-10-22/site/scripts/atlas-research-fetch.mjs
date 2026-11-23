// Read-only retrieval of public institutional catalogue facts. Never publishes records.
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('../qa-artifacts/atlas-signature-completion/research/',import.meta.url));
await mkdir(dir,{recursive:true});
const decode=t=>t.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#0?39;/g,"'").replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
for(const id of process.argv.slice(2)) {
 const url=`https://doam.gov.pk/public/sites/${id}`;
 try {
 const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
 if(!response.ok) throw Error(response.status);
 const html=await response.text();
 const title=decode(html.match(/<title>(.*?)<\/title>/s)?.[1]||'');
 const facts=Object.fromEntries([...html.matchAll(/<b>([^<]+):\s*<\/b>\s*(.*?)<\/div>/gs)].map(m=>[decode(m[1]),decode(m[2])]));
 const images=[...new Set([...html.matchAll(/(?:src|href)="([^"]*\/media\/sites\/[^" ]+)"/g)].map(m=>m[1]))];
 const excerpt=facts.Description?.slice(0,900); delete facts.Description;
 const result={id,title,url,verifiedDate:new Date().toISOString().slice(0,10),facts,images,excerpt};
 await writeFile(`${dir}doam-${id}.json`,JSON.stringify(result,null,2));
 console.log(JSON.stringify({id,title,province:facts.Province,district:facts.District,lat:facts.Latitude,lon:facts.Longitude,excerpt}));
 }catch(error){console.error(`${id}: ${error.message}`);process.exitCode=1;}
}
