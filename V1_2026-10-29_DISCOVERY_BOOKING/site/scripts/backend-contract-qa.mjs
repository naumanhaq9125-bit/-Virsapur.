// Offline synthetic contract tests: never connects, builds, publishes or writes content.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSupabaseProvider} from '../src/cms/providers/supabase.mjs';
import {cmsConfig} from '../src/cms/config.mjs';
import {CONTENT_COLLECTIONS,createContentExport,createWorkingSeedSql} from '../backend/content-contract.mjs';
import {createHostedQuoteHandlers,readQuoteJson} from '../backend/custom-tour-quotes.mjs';

const tests=[];
async function test(name,fn){await fn();tests.push(name);}
const env={PRODUCTION_CMS_ENABLED:'true',CUSTOM_TOUR_QUOTES_ENABLED:'true',SUPABASE_URL:'https://mock.invalid',SUPABASE_SECRET_KEY:'offline-only'};
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json',...headers}});
const content={site:{navigation:[{id:'home',route:'/'}]},homepage:{},...Object.fromEntries(CONTENT_COLLECTIONS.map(name=>[name,[]]))};
content.heritagePlaces=Array.from({length:606},(_,i)=>({id:`place-${i}`,title:`Place ${i}`,slug:`place-${i}`,status:'draft',recordType:'place',heritageDomain:'cultural-tangible'}));
content.stories=Array.from({length:420},(_,i)=>({id:`story-${i}`,title:`Story ${i}`,slug:`story-${i}`,status:'draft'}));
content.archiveCategories=[{id:'category-one',title:'Architecture',status:'draft'}];
content.collaborators=[{id:'collaborator-one',name:'Institution',status:'draft'}];
const working=CONTENT_COLLECTIONS.flatMap(collection=>content[collection].map(data=>({collection,id:data.id,status:data.status,data})));
const live=working.map(row=>({...row,content_kind:'record',record_id:row.id}));
const calls=[];
const fakeFetch=async(address,options={})=>{
  const url=new URL(address),table=url.pathname.split('/').at(-1);calls.push({url,options});
  if(options.method&&options.method!=='GET')return new Response(null,{status:204});
  let rows=table==='cms_records'?working:table==='cms_singletons'?[{key:'site',data:content.site},{key:'homepage',data:{}}]:table==='cms_live_snapshots'?(url.searchParams.get('content_kind')==='eq.singleton'?[{record_id:'site',data:content.site},{record_id:'homepage',data:{}}]:live):[];
  const collection=url.searchParams.get('collection');if(collection)rows=rows.filter(row=>row.collection===collection.slice(3));
  const offset=Number(url.searchParams.get('offset')||0),limit=Number(url.searchParams.get('limit')||200);
  return json(rows.slice(offset,offset+limit));
};
const provider=createSupabaseProvider({config:cmsConfig(env),fetch:fakeFetch});
await test('working and live pagination: 606 heritage + 420 stories + categories/collaborators',async()=>{
  for(const publishedOnly of [false,true]){const result=await provider.loadAll({publishedOnly});assert.equal(result.heritagePlaces.length,606);assert.equal(result.stories.length,420);assert.equal(result.archiveCategories.length,1);assert.equal(result.collaborators.length,1);}
  assert(calls.filter(c=>c.url.pathname.endsWith('cms_records')).every(c=>Number(c.url.searchParams.get('limit'))===200));
});
await test('save paginates existing records, writes only changed rows in bounded batches',async()=>{
  calls.length=0;await provider.save('heritagePlaces',content.heritagePlaces,'actor');
  assert.equal(calls.filter(c=>c.options.method==='POST'&&c.url.pathname.endsWith('cms_records')).length,0);
  calls.length=0;await provider.save('heritagePlaces',content.heritagePlaces.map(p=>({...p,title:p.title+' changed'})),'actor');
  const writes=calls.filter(c=>c.options.method==='POST'&&c.url.pathname.endsWith('cms_records'));
  assert.equal(writes.length,7);assert.equal(writes.reduce((n,c)=>n+JSON.parse(c.options.body).length,0),606);
  assert(writes.every(c=>Buffer.byteLength(c.options.body)<=524288&&JSON.parse(c.options.body).length<=100));
  await assert.rejects(()=>provider.save('heritagePlaces',content.heritagePlaces.slice(1),'actor'),/Archive records/);
});
await test('transport and collection boundary',async()=>{
  const before=calls.length;await assert.rejects(()=>provider.request('/anything',{method:'POST',body:{body:'x'.repeat(1048576)}}),e=>e.status===413);assert.equal(calls.length,before);
  await assert.rejects(()=>provider.save('custom_tour_quote_requests',[],'actor'),e=>e.status===422);
});
await test('export allowlist, fixture/secret screening, deterministic checksum and unapplied seed',async()=>{
  const extra={...content,custom_tour_quote_requests:[{email:'private@example.invalid'}],secret:'never exported'};
  const bundle=createContentExport(extra,{exportedAt:'2026-10-22T00:00:00Z'});
  assert.equal(bundle.counts.records,1028);assert(!JSON.stringify(bundle.records).includes('private@example.invalid'));
  assert.equal(createContentExport(content).checksum,bundle.checksum);
  await assert.rejects(async()=>createContentExport(content,{fixtureIds:['story-0']}),/demo fixture/);
  await assert.rejects(async()=>createContentExport({...content,site:{...content.site,apiKey:'secret'}}),/secret-like/);
  const withQuote=structuredClone(bundle);withQuote.records[0].data.title="Pakistan's heritage";
  const sql=createWorkingSeedSql(withQuote);assert(sql.includes("Pakistan''s heritage"));
  assert(!/insert into public\.(?:cms_live_snapshots|custom_tour_quote_requests|admin_profiles)/i.test(sql));assert(sql.includes('on conflict(collection,id) do nothing'));
});

const req=(method='POST',body={},path='/api/custom-tour-quotes',headers={})=>new Request('https://virsapur.test'+path,{method,headers:{origin:'https://virsapur.test','content-type':'application/json',...headers},...(method==='GET'?{}:{body:JSON.stringify(body)})});
const valid={heritagePlaceIds:['place-1'],groupSize:4,customerName:'Example Visitor',email:'visitor@example.invalid',phone:'+92 300 1234567',durationPreference:'One day'};
const quoteCalls=[];let quoteRow;
const quoteFetch=async(address,options={})=>{
  const url=new URL(address);quoteCalls.push({url,options});
  if(url.pathname.endsWith('cms_live_snapshots'))return json(url.searchParams.get('content_kind')==='eq.singleton'?[{data:{defaultTourOrigin:'Lahore'}}]:[{data:{id:'place-1',status:'published',recordType:'place',heritageDomain:'cultural-tangible'}}]);
  if(options.method==='POST'){quoteRow=JSON.parse(options.body);return new Response(null,{status:204});}
  if(options.method==='PATCH'){quoteRow={...quoteRow,...JSON.parse(options.body)};return json([quoteRow]);}
  return json([quoteRow],200,{'content-range':'0-0/1'});
};
const admin=async()=>({user:{id:'offline-admin'},profile:{role:'owner'}});
const handlers=createHostedQuoteHandlers({env,fetch:quoteFetch,admin,rateLimit:async()=>{}});
await test('hosted quote feature gates fail closed before auth/network',async()=>{
  for(const disabled of [{},{PRODUCTION_CMS_ENABLED:'true'},{CUSTOM_TOUR_QUOTES_ENABLED:'true'}]){
    const no=()=>{throw new Error('must not be called');};const h=createHostedQuoteHandlers({env:disabled,fetch:no,admin:no,rateLimit:no});
    assert.equal((await h.publicRequest(req())).status,404);assert.equal((await h.adminRequest(req('GET'))).status,404);
  }
});
await test('visitor fields only; same-origin, body limits and eligible live places',async()=>{
  assert.equal((await handlers.publicRequest(req('GET'))).status,405);
  assert.equal((await handlers.publicRequest(req('POST',valid,undefined,{origin:'https://evil.invalid'}))).status,403);
  for(const field of ['status','internalNotes','quotedAmount','origin','id'])assert.equal((await handlers.publicRequest(req('POST',{...valid,[field]:'bad'}))).status,422);
  assert.equal((await handlers.publicRequest(req('POST',{...valid,heritagePlaceIds:['place-1),or(x)']}))).status,422);
  assert.equal((await handlers.publicRequest(req('POST',{...valid,notes:'x'.repeat(33000)}))).status,413);
  assert.equal((await handlers.publicRequest(req('POST',{...valid,heritagePlaceIds:['draft-only']}))).status,422);
  assert.equal((await handlers.publicRequest(req('POST',{...valid,requestedDate:'2020-02-31'}))).status,422);
  const response=await handlers.publicRequest(req('POST',valid));assert.equal(response.status,201);
  const result=await response.json();assert.deepEqual(Object.keys(result.receipt).sort(),['createdAt','environment','id']);assert.equal(quoteRow.status,'new');assert.equal(quoteRow.quoted_amount,null);
  assert(quoteCalls.filter(c=>c.url.pathname.endsWith('cms_live_snapshots')).every(c=>Number(c.url.searchParams.get('limit'))<=40));
});
await test('admin auth/CSRF, bounded list, strict manual fields and safe errors',async()=>{
  const denied=createHostedQuoteHandlers({env,fetch:quoteFetch,admin:async()=>{throw Object.assign(new Error('Sign in required'),{status:401});}});
  assert.equal((await denied.adminRequest(req('GET'))).status,401);
  const path='/api/admin-custom-tour-quotes?id='+quoteRow.id;
  assert.equal((await handlers.adminRequest(req('PATCH',{status:'reviewing'},path))).status,403);
  const headers={cookie:'__Host-virsapur_csrf=offline','x-virsapur-csrf':'offline'};
  assert.equal((await handlers.adminRequest(req('PATCH',{email:'rewrite@example.invalid'},path,headers))).status,422);
  assert.equal((await handlers.adminRequest(req('PATCH',{status:'quoted',quotedAmount:15000,quoteCurrency:'PKR',internalNotes:'Manual review'},path,headers))).status,200);
  assert.equal(quoteRow.updated_by,'offline-admin');assert.equal(quoteRow.status,'quoted');
  const normal=await (await handlers.adminRequest(req('GET',null,'/api/admin-custom-tour-quotes'))).json();assert.equal(normal.pageSize,20);
  const listed=await (await handlers.adminRequest(req('GET',null,'/api/admin-custom-tour-quotes?pageSize=500&page=200'))).json();assert.equal(listed.pageSize,50);assert.equal(listed.page,1);assert.equal(listed.total,1);
  const rate=createHostedQuoteHandlers({env,fetch:quoteFetch,rateLimit:async()=>{throw Object.assign(new Error('Rate limit'),{status:429});}});assert.equal((await rate.publicRequest(req('POST',valid))).status,429);
  const broken=createHostedQuoteHandlers({env,fetch:async()=>{throw new Error('private service token: should never leak');},rateLimit:async()=>{}});const failure=await broken.publicRequest(req('POST',valid));assert.equal(failure.status,500);assert(!(await failure.text()).includes('token'));
});
await test('bounded JSON reader rejects non-JSON and invalid input',async()=>{
  await assert.rejects(()=>readQuoteJson(req('POST',{},undefined,{'content-type':'text/plain'})),e=>e.status===415);
  await assert.rejects(()=>readQuoteJson(new Request('https://virsapur.test',{method:'POST',headers:{'content-type':'application/json'},body:'{'})),e=>e.status===400);
});
await test('migration is unapplied, private RLS/service-only and source-derived',async()=>{
  const sql=await readFile(new URL('../backend/supabase/migrations/003_discovery_and_private_quotes.sql',import.meta.url),'utf8');
  for(const table of ['cms_discovery_index','cms_content_relationships','cms_heritage_components','custom_tour_quote_requests'])assert(sql.includes(`alter table public.${table} enable row level security`));
  assert(sql.includes('from public,anon,authenticated'));assert(sql.includes('to service_role'));assert(!/create policy/i.test(sql));
  assert(sql.includes("scope in ('working','live')"));assert(sql.includes('cms_live_discovery'));assert(sql.includes('on delete cascade'));assert(sql.includes('Missing points remain NULL'));
});
console.log(JSON.stringify({ok:true,offline:true,tests:tests.length,passed:tests,syntheticRecords:1028,databaseApplied:false,networkCalls:0},null,2));
