import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const urls=process.argv.slice(2);
for(const url of urls){try{const r=await fetch(url,{signal:AbortSignal.timeout(45000)}),html=await r.text();const text=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();const row={url,status:r.status,accessDate:'2026-10-22',text};const hash=createHash('sha256').update(url).digest('hex').slice(0,12);await writeFile(new URL(hash+'.json',import.meta.url),JSON.stringify(row,null,2));console.log(JSON.stringify(row));}catch(e){console.log(JSON.stringify({url,error:String(e)}));}}
