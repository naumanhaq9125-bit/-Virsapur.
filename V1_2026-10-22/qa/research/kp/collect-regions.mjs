import {mkdir,writeFile} from 'node:fs/promises';
const home=await fetch('https://doam.gov.pk/public/home',{signal:AbortSignal.timeout(30000)});
const html=await home.text();const token=html.match(/name="csrf-token" content="([^"]+)"/)?.[1];
const cookie=home.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
for(const [key,province] of [['kp','Khyber Pakhtunkhwa'],['gb','Gilgit-Baltistan'],['ajk','Azad Jammu and Kashmir']]){
 const response=await fetch('https://doam.gov.pk/public/sites/filter',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',cookie,accept:'application/json'},body:new URLSearchParams({_token:token,city:'',type:'',era:'',province,visibility:'Public'}),signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw Error(`${key} ${response.status}`);
 const data=(await response.json()).data;const folder=new URL(`../${key}/`,import.meta.url);await mkdir(folder,{recursive:true});
 await writeFile(new URL('catalogue.json',folder),JSON.stringify({accessDate:'2026-10-22',sourceUrl:'https://doam.gov.pk/public/home',query:{province,visibility:'Public'},data},null,2)+'\n');
 console.log(JSON.stringify({region:key,count:data.length,districts:[...new Set(data.map(r=>r.district))]}));
}
