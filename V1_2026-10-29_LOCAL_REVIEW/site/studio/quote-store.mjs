import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {validateQuoteInput,validateQuoteAdminPatch,tourOrigin,QUOTE_STATUSES} from '../src/tour-contract.mjs';

// One serial queue for the complete read/modify/write, not just the final rename.
export function createQuoteStore(file,{loadPlaces,loadSite}) {
  let queue=Promise.resolve();
  const read=async()=>{try{return JSON.parse(await readFile(file,'utf8'));}catch(error){if(error.code==='ENOENT')return [];throw error;}};
  const transact=fn=>{const next=queue.catch(()=>{}).then(async()=>{const records=await read();const result=await fn(records);await mkdir(dirname(file),{recursive:true});const temp=`${file}.${process.pid}.${randomUUID()}.tmp`;await writeFile(temp,JSON.stringify(records,null,2)+'\n',{mode:0o600});await rename(temp,file);return result;});queue=next;return next;};
  const invalid=errors=>{const error=Error(errors.join('\n'));error.statusCode=422;throw error;};
  return {
    async create(input){const checked=validateQuoteInput(input,await loadPlaces());if(checked.errors.length)invalid(checked.errors);const origin=tourOrigin(await loadSite());return transact(records=>{if(records.length>=10000){const error=Error('Local request capacity reached. Ask the owner to export and archive requests.');error.statusCode=503;throw error;}const now=new Date().toISOString();const record={...checked.value,id:`VQ-${randomUUID()}`,createdAt:now,updatedAt:now,status:'new',origin,internalNotes:'',quotedAmount:null,quoteCurrency:'PKR',environment:'local'};records.unshift(record);return {id:record.id,createdAt:record.createdAt,environment:'local'};});},
    async list({query='',status='',page=1,pageSize=20}={}){await queue.catch(()=>{});if(status&&!QUOTE_STATUSES.includes(status))invalid(['Invalid status filter.']);const q=String(query).toLocaleLowerCase().slice(0,200),size=Math.max(1,Math.min(50,Math.floor(Number(pageSize))||20));const records=(await read()).filter(x=>(!status||x.status===status)&&(!q||[x.id,x.customerName,x.email,...x.heritagePlaceIds].join(' ').toLocaleLowerCase().includes(q)));const pages=Math.max(1,Math.ceil(records.length/size)),current=Math.max(1,Math.min(pages,Math.floor(Number(page))||1));return {items:records.slice((current-1)*size,current*size),total:records.length,page:current,pages,pageSize:size};},
    async update(id,input){const checked=validateQuoteAdminPatch(input);if(checked.errors.length)invalid(checked.errors);return transact(records=>{const record=records.find(x=>x.id===id);if(!record){const error=Error('Quote request not found.');error.statusCode=404;throw error;}Object.assign(record,checked.value,{updatedAt:new Date().toISOString()});return record;});}
  };
}
