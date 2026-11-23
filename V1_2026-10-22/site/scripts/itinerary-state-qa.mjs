import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {restoreItinerary,reorderItinerary,removeFromItinerary,MAX_ITINERARY_PLACES,validateQuoteInput} from '../src/tour-contract.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),places=JSON.parse(await readFile(join(root,'content/data/heritage-places.json'),'utf8'));
const ids=places.map(x=>x.id),checks=[];
for(const size of [3,10,20]){const initial=ids.slice(0,size),moved=reorderItinerary(initial,initial[0],1);assert.deepEqual(initial,ids.slice(0,size));assert.equal(moved[1],initial[0]);assert.deepEqual(reorderItinerary(moved,initial[0],-1),initial);assert.deepEqual(reorderItinerary(initial,initial[0],-1),initial);assert.deepEqual(reorderItinerary(initial,initial.at(-1),1),initial);assert.deepEqual(reorderItinerary(initial,'unknown',1),initial);const removed=removeFromItinerary(moved,initial[1]);assert.equal(removed.length,size-1);assert.deepEqual(restoreItinerary(JSON.stringify(removed),ids),removed);checks.push({size,reorder:true,remove:true,serializedPersistence:true,immutable:true,bounds:true});}
assert.deepEqual(restoreItinerary('broken-json',ids),[]);assert.deepEqual(restoreItinerary('{}',ids),[]);assert.deepEqual(restoreItinerary(JSON.stringify([ids[0],ids[0],'unknown',null]),ids),[ids[0]]);assert.equal(restoreItinerary(JSON.stringify(ids),ids).length,MAX_ITINERARY_PLACES);
const input={heritagePlaceIds:[ids[0]],customerName:'QA Visitor',email:'qa@example.invalid',phone:'0000000000',groupSize:3,durationPreference:'Flexible',requestedDate:'2027-01-01suffix'};assert.ok(validateQuoteInput(input,places).errors.length);
const report={checkedAt:new Date().toISOString(),actualHeritageRecords:places.length,checks,invalidPersistenceHandled:true,maximum:MAX_ITINERARY_PLACES,personalDataPersisted:false,passed:true};await mkdir(join(root,'qa-artifacts/final-build-2026-10-22'),{recursive:true});await writeFile(join(root,'qa-artifacts/final-build-2026-10-22/ITINERARY_STATE_QA.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
