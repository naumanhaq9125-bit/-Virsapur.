import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {validateQuoteInput,validateQuoteAdminPatch,eligibleTourPlace,tourOrigin} from '../src/tour-contract.mjs';
import {createQuoteStore} from '../studio/quote-store.mjs';
const places=JSON.parse(await readFile('content/data/heritage-places.json'));
const eligible=places.filter(eligibleTourPlace),checks=[];
function check(name,fn){fn();checks.push({name,passed:true});}
const input=n=>({heritagePlaceIds:eligible.slice(0,n).map(x=>x.id),requestedDate:'',groupSize:3,durationPreference:'Flexible',customerName:'Local QA Example',email:'qa@example.invalid',phone:'+92000000000',transportPreference:'Discuss with Virsapur',notes:'Synthetic local QA, not a customer.',specialRequirements:''});
for(const count of [3,10,20])check(`Valid ${count}-place request`,()=>assert.deepEqual(validateQuoteInput(input(count),places).errors,[]));
check('Unknown place rejected',()=>assert.ok(validateQuoteInput({...input(3),heritagePlaceIds:['not-a-place']},places).errors.length));
check('Duplicate place rejected',()=>assert.ok(validateQuoteInput({...input(3),heritagePlaceIds:[eligible[0].id,eligible[0].id]},places).errors.length));
check('Internal fields rejected',()=>assert.ok(validateQuoteInput({...input(3),quotedAmount:0,status:'confirmed'},places).errors.length));
check('Too many places rejected',()=>assert.ok(validateQuoteInput(input(41),places).errors.length));
check('Invalid calendar date rejected',()=>assert.ok(validateQuoteInput({...input(3),requestedDate:'2027-02-30'},places).errors.length));
check('Invalid group size rejected',()=>assert.ok(validateQuoteInput({...input(3),groupSize:1.5},places).errors.length));
check('Manual amount rejects coercion',()=>assert.ok(validateQuoteAdminPatch({quotedAmount:'15'}).errors.length));
check('Admin cannot alter itinerary or contact',()=>assert.ok(validateQuoteAdminPatch({email:'changed@example.invalid'}).errors.length));
check('Origin configurable',()=>assert.equal(tourOrigin({defaultTourOrigin:'Lahore'}),'Lahore'));
const dir=await mkdtemp(join(tmpdir(),'virsapur-quote-qa-'));
try{
 const store=createQuoteStore(join(dir,'requests.json'),{loadPlaces:async()=>places,loadSite:async()=>({defaultTourOrigin:'Lahore'})});
 const receipts=await Promise.all(Array.from({length:20},()=>store.create(input(3))));
 check('Concurrent writes retain all20',()=>assert.equal(new Set(receipts.map(x=>x.id)).size,20));
 const all=await store.list({pageSize:50});check('All concurrent rows persisted',()=>assert.equal(all.total,20));
 check('Public receipt exposes no customer/internal fields',()=>assert.deepEqual(Object.keys(receipts[0]).sort(),['createdAt','environment','id']));
 await store.update(receipts[0].id,{status:'reviewing',internalNotes:'Local test only',quotedAmount:null,quoteCurrency:'PKR'});
 const reviewing=await store.list({status:'reviewing'});check('Status filtering and update',()=>assert.equal(reviewing.total,1));
 const second=await store.list({page:2,pageSize:3});check('Admin pagination',()=>assert.equal(second.items.length,3));
 check('Default price remains null',()=>assert.ok(all.items.every(x=>x.quotedAmount===null)));
 check('Server-derived origin/status',()=>assert.ok(all.items.every(x=>x.origin==='Lahore'&&x.status==='new')));
}finally{if(!resolve(dir).startsWith(resolve(tmpdir())+'\\virsapur-quote-qa-')&&!resolve(dir).startsWith(resolve(tmpdir())+'/virsapur-quote-qa-'))throw Error('Unexpected temporary path');await rm(dir,{recursive:true,force:true});}
const out='qa-artifacts/final-build-2026-10-22';await mkdir(out,{recursive:true});await writeFile(join(out,'TOURS_CONTRACT_QA.json'),JSON.stringify({checkedAt:new Date().toISOString(),checks},null,2));console.log(`${checks.length} tour contract/storage checks passed. Synthetic temporary requests removed; real Studio data untouched.`);
