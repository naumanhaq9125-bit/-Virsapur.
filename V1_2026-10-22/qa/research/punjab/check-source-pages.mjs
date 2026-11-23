import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const input=JSON.parse(await readFile(new URL('./research.json',import.meta.url),'utf8'));
const urls=[...new Set(input.accepted.flatMap(p=>[p.sourceUrl,...p.components.map(c=>c.coordinateSource)]))];
const results=[];let next=0;
async function worker(){while(next<urls.length){const url=urls[next++];try{const r=await fetch(url,{signal:AbortSignal.timeout(20000)}),html=await r.text();results.push({url,status:r.status,finalUrl:r.url,title:html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,' ').trim()||null,h1:[...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m=>m[1].replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim()),sha256:createHash('sha256').update(html).digest('hex'),bytes:Buffer.byteLength(html),accessDate:'2026-10-22'});}catch(e){results.push({url,error:e.message,accessDate:'2026-10-22'});}if(results.length%20===0)console.log('Checked '+results.length+'/'+urls.length);await new Promise(resolve=>setTimeout(resolve,150));}}
await Promise.all(Array.from({length:4},worker));
await writeFile(new URL('./source-checks.json',import.meta.url),JSON.stringify({accessDate:'2026-10-22',method:'Read-only unauthenticated GET of every accepted DOAM source/component URL; HTTP availability does not independently verify accuracy.',results:results.sort((a,b)=>a.url.localeCompare(b.url))},null,2)+'\n');
console.log(JSON.stringify({checked:results.length,ok:results.filter(r=>r.status===200).length,errors:results.filter(r=>r.status!==200)},null,2));
