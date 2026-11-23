// Read-only official catalogue retrieval; outputs research evidence only.
import {mkdir,writeFile} from 'node:fs/promises';
import {prepareHeritageRecords} from '../../../../src/heritage-spatial.mjs';
const response=await fetch('https://doam.gov.pk/public/home',{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw Error(`Catalogue home ${response.status}`);
const html=await response.text(),token=html.match(/name="csrf-token" content="([^"]+)"/)?.[1];
if(!token)throw Error('Catalogue form token unavailable');
const cookie=response.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
const result=await fetch('https://doam.gov.pk/public/sites/filter',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',cookie,accept:'application/json'},body:new URLSearchParams({_token:token,city:'',type:'',era:'',province:'Balochistan',visibility:'Public'}),signal:AbortSignal.timeout(60000)});
if(!result.ok)throw Error(`Catalogue query ${result.status}`);
const {data}=await result.json();
const spatial=await prepareHeritageRecords(process.cwd(),data.map(x=>({id:String(x.id),components:[{id:String(x.id),latitude:x.latitude,longitude:x.longitude}]})));
await mkdir(new URL('./',import.meta.url),{recursive:true});
await writeFile(new URL('catalogue.json',import.meta.url),JSON.stringify({accessDate:'2026-10-22',sourceUrl:'https://doam.gov.pk/public/home',query:{province:'Balochistan'},data:data.map((x,i)=>({...x,derivedDistricts:spatial.records[i].districtIds,derivedRegions:spatial.records[i].provinceRegionIds}))},null,2));
console.log({count:data.length});
