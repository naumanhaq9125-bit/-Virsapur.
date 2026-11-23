import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createBookingStore} from './booking-store.mjs';
const sample={id:'sample',demo:true,previewOnly:true,title:'Sample tour',start:'2026-11-15T09:00:00+05:00',amount:4500,capacity:3,registrationState:'open',location:'Lahore'};
const request=(overrides={})=>({eventId:'sample',requestId:randomUUID(),quantity:2,participants:['First visitor','Second visitor'],customer:'Demo visitor',email:'visitor@example.com',outcome:'success',...overrides});
async function setup(t){const dir=await mkdtemp(join(tmpdir(),'virsapur-booking-'));t.after(()=>rm(dir,{recursive:true,force:true}));return createBookingStore(join(dir,'orders.json'),{loadEvents:async()=>[sample],now:()=>Date.parse('2026-10-29')});}
test('server owns prices; successful bookings issue one ticket per participant',async t=>{const store=await setup(t);const order=await store.create(request({amount:1,total:1}));assert.equal(order.amount,4500);assert.equal(order.total,9000);assert.equal(order.tickets.length,2);assert.equal(new Set(order.tickets.map(ticket=>ticket.id)).size,2);assert.equal(order.demo,true);});
test('duplicate submission is idempotent and changed payload cannot reuse a reference',async t=>{const store=await setup(t),input=request();const [a,b]=await Promise.all([store.create(input),store.create(input)]);assert.equal(a.id,b.id);assert.equal((await store.list()).length,1);await assert.rejects(store.create({...input,customer:'Changed'}),/different details/);});
test('concurrent bookings cannot exceed sample capacity',async t=>{const store=await setup(t);const results=await Promise.allSettled([store.create(request()),store.create(request())]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal((await store.list()).length,1);});
test('decline and cancellation reserve no seats and issue no tickets',async t=>{const store=await setup(t);for(const outcome of ['declined','cancelled'])assert.deepEqual((await store.create(request({outcome}))).tickets,[]);assert.equal((await store.create(request())).tickets.length,2);});
test('invalid participants, outcomes and unknown events are rejected',async t=>{const store=await setup(t);for(const invalid of [{quantity:0},{quantity:1.5},{quantity:21},{participants:['']},{outcome:'paid'},{eventId:'real-event'},{email:'bad'}])await assert.rejects(store.create(request(invalid)));assert.deepEqual(await store.list(),[]);});
test('closed and expired samples cannot be booked',async()=>{for(const event of [{...sample,registrationState:'closed'},{...sample,start:'2020-01-01'}]){const store=createBookingStore(join(tmpdir(),'unused-'+randomUUID()+'.json'),{loadEvents:async()=>[event]});await assert.rejects(store.create(request()),/no longer open/);}});
