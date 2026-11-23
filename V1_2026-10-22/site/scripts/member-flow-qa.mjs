import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { createServer } from 'node:net';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

const root=resolve(decodeURIComponent(new URL('..',import.meta.url).pathname).replace(/^\/(.:)/,'$1'));
const runtimeRoot=mkdtempSync(join(tmpdir(),'virsapur-member-flow-'));
const knownTestPrefix=join(tmpdir(),'virsapur-member-flow-');
assert(runtimeRoot.startsWith(knownTestPrefix), 'Test data must remain in its isolated temporary folder.');
const closeServer=server=>new Promise(resolveClose=>server.close(resolveClose));
const portServer=createServer();
await new Promise((resolveListen,reject)=>{portServer.once('error',reject);portServer.listen(0,'127.0.0.1',resolveListen);});
const port=portServer.address().port;
await closeServer(portServer);
const base=`http://127.0.0.1:${port}`;
let child,logs='',checks=0;
const pass=()=>checks++;

async function startServer(){
  child=spawn(process.execPath,['studio/server.mjs'],{cwd:root,env:{...process.env,STUDIO_PORT:String(port),STUDIO_DATA_DIR:runtimeRoot,SMTP_USER:'',SMTP_PASS:''},stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',chunk=>{logs+=chunk.toString();});
  child.stderr.on('data',chunk=>{logs+=chunk.toString();});
  const started=Date.now();
  while(Date.now()-started<25000){
    if(child.exitCode!==null)throw new Error(`Isolated Studio server exited during startup: ${logs}`);
    try{const response=await fetch(`${base}/api/member-session`);if(response.status===401)return;}catch{}
    await new Promise(resolveWait=>setTimeout(resolveWait,250));
  }
  throw new Error(`Isolated Studio server did not become ready: ${logs}`);
}
async function stopServer(){
  if(!child||child.exitCode!==null)return;
  child.kill();
  await Promise.race([new Promise(resolveExit=>child.once('exit',resolveExit)),new Promise(resolveTimeout=>setTimeout(resolveTimeout,5000))]);
  child=null;
}
async function call(path,{method='GET',body,cookie}={}){
  const response=await fetch(`${base}${path}`,{method,headers:{...(cookie?{cookie}:{}),...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await response.json().catch(()=>({}));
  return {response,data};
}
function sqlite(file,sql,...values){const db=new DatabaseSync(join(runtimeRoot,file),{readOnly:true});try{return db.prepare(sql).get(...values);}finally{db.close();}}

try{
  await startServer();
  const contentResponse=await fetch(`${base}/api/content`);
  assert.equal(contentResponse.status,200);
  const content=await contentResponse.json();
  const place=content.heritagePlaces.find(item=>item.status==='published'&&item.recordType==='place'&&item.heritageDomain==='cultural-tangible');
  const story=content.stories[0];
  const tripRecord=content.events.find(item=>item.status==='published'&&item.scheduleType==='heritage-trip'&&item.registrationState==='open'&&Number.isInteger(Number(item.capacity))&&Number(item.capacity)>=10&&Date.parse(item.end)>=Date.now());
  assert(place, 'Test fixtures must include at least one eligible published place.');
  assert(story, 'Test fixtures must include a story for local bookmark validation.');
  assert(tripRecord, `Test fixtures must include an open published trip with at least ten seats; events found: ${JSON.stringify(content.events?.map(item=>({status:item.status,type:item.scheduleType,state:item.registrationState,capacity:item.capacity,end:item.end})))}`);

  const signupInput={fullName:'Virsapur QA',email:`qa-${Date.now()}@example.invalid`,password:'StrongPassword123'};
  const invalidSignup=await call('/api/auth/signup',{method:'POST',body:{...signupInput,fullName:'<bad>'}});
  assert.equal(invalidSignup.response.status,422);pass();
  const signup=await call('/api/auth/signup',{method:'POST',body:signupInput});
  assert.equal(signup.response.status,201);
  const cookie=signup.response.headers.get('set-cookie')?.split(';')[0];
  assert(cookie?.startsWith('virsapur_session='),'Signup must issue the server session cookie.');
  assert.equal(signup.data.user.email,signupInput.email);pass();
  const unauthorized=await call('/api/member/places');
  assert.equal(unauthorized.response.status,401);pass();

  const profile=await call('/api/auth/profile',{method:'PATCH',body:{fullName:'Virsapur QA Member'},cookie});
  assert.equal(profile.response.status,200);assert.equal(profile.data.user.fullName,'Virsapur QA Member');pass();
  const badProfile=await call('/api/auth/profile',{method:'PATCH',body:{fullName:'Bad',email:'qa@example.invalid'},cookie});
  assert.equal(badProfile.response.status,422);pass();

  for(const listType of ['wishlist','visited']){
    const added=await call('/api/member/places',{method:'POST',body:{placeId:place.id,listType},cookie});
    assert.equal(added.response.status,200);assert(added.data[listType].includes(place.id));
  }
  let places=await call('/api/member/places',{cookie});
  assert.equal(places.data.wishlist.length,1);assert.equal(places.data.visited.length,1);pass();
  const invalidPlace=await call('/api/member/places',{method:'POST',body:{placeId:'not-a-real-place',listType:'wishlist'},cookie});
  assert.equal(invalidPlace.response.status,200);assert.equal(invalidPlace.data.wishlist.length,1);pass();

  const start=new Date(Date.now()+86400000).toISOString().slice(0,10),end=new Date(Date.now()+3*86400000).toISOString().slice(0,10);
  const trip={id:'qa-trip-'+Date.now(),tripName:'QA Heritage Route',startingLocation:'Lahore',startDate:start,endDate:end,travelerGroup:'Family',travelerCount:2,transportation:'Car',tripType:'Family',budget:12000,travelPace:'Relaxed',destinations:[{id:place.id,day:1}]};
  const badTrip=await call('/api/member/trips',{method:'POST',body:{trip:{...trip,id:'qa-invalid-date',startDate:'2026-02-31'}},cookie});
  assert.equal(badTrip.response.status,422);pass();
  const savedTrip=await call('/api/member/trips',{method:'POST',body:{trip},cookie});
  assert.equal(savedTrip.response.status,200);assert(savedTrip.data.items.some(item=>item.id===trip.id));pass();
  const completedTrip=await call('/api/member/trips',{method:'POST',body:{trip:{...trip,status:'completed',completedAt:new Date().toISOString()}},cookie});
  assert.equal(completedTrip.response.status,200);
  let memberTrips=await call('/api/member/trips',{cookie});
  assert.equal(memberTrips.data.items.filter(item=>item.status==='completed').length,1);pass();

  const saveArticle=await call('/api/saved-articles',{method:'POST',body:{articleId:story.id},cookie});
  assert.equal(saveArticle.response.status,201);
  let savedArticles=await call('/api/saved-articles',{cookie});
  assert(savedArticles.data.items.some(item=>item.articleId===story.id));pass();
  const removeArticle=await call(`/api/saved-articles/${encodeURIComponent(story.id)}`,{method:'DELETE',cookie});
  assert.equal(removeArticle.response.status,200);
  savedArticles=await call('/api/saved-articles',{cookie});assert.equal(savedArticles.data.items.length,0);pass();

  const quoteInput={customerName:'Virsapur QA Member',email:signupInput.email,phone:'+923001234567',groupSize:2,durationPreference:'2 days',requestedDate:start,heritagePlaceIds:[place.id],transportPreference:'Car',specialRequirements:'Automated isolated QA request'};
  const badQuote=await call('/api/custom-tour-quotes',{method:'POST',body:{...quoteInput,requestedDate:'2026-02-31'}});
  assert.equal(badQuote.response.status,422);pass();
  const quote=await call('/api/custom-tour-quotes',{method:'POST',body:quoteInput});
  assert.equal(quote.response.status,201);
  const quoteStatus=await call(`/api/admin/custom-tour-quotes/${encodeURIComponent(quote.data.receipt.id)}`,{method:'PATCH',body:{status:'reviewing'}});
  assert.equal(quoteStatus.response.status,200);assert.equal(quoteStatus.data.item.status,'reviewing');pass();

  const seats=Number(tripRecord.capacity);
  const reserve=seatCount=>call('/api/trip-bookings',{method:'POST',body:{tripId:tripRecord.id,fullName:'Virsapur QA Member',email:signupInput.email,phone:'+923001234567',seats:seatCount,bookingAction:'request'},cookie});
  const first=await reserve(Math.min(10,seats));assert.equal(first.response.status,201);pass();
  let remaining=await call(`/api/trip-bookings?tripId=${encodeURIComponent(tripRecord.id)}`);
  const rest=seats-Math.min(10,seats);
  if(rest>0){assert.equal(remaining.data.availableSeats,rest);const second=await reserve(rest);assert.equal(second.response.status,201);}
  remaining=await call(`/api/trip-bookings?tripId=${encodeURIComponent(tripRecord.id)}`);
  assert.equal(remaining.data.availableSeats,0);assert.equal(remaining.data.registrationState,'open');
  const overbook=await reserve(1);assert.equal(overbook.response.status,409);assert.match(overbook.data.error,/fully booked/i);pass();
  const adminBookings=await call('/api/admin/trip-bookings');
  assert.equal(adminBookings.response.status,200);assert.equal(adminBookings.data.items.reduce((sum,item)=>sum+item.seats,0),seats);pass();
  const approval=await call(`/api/admin/trip-bookings/${encodeURIComponent(first.data.booking.id)}`,{method:'PATCH',body:{status:'confirmed'}});
  assert.equal(approval.response.status,200);assert(approval.data.items.some(item=>item.id===first.data.booking.id&&item.status==='confirmed'));pass();
  const memberBookings=await call('/api/member/trip-bookings',{cookie});
  assert.equal(memberBookings.response.status,200);assert.equal(memberBookings.data.items.reduce((sum,item)=>sum+item.seats,0),seats);pass();

  await stopServer();
  await startServer();
  const login=await call('/api/auth/login',{method:'POST',body:{email:signupInput.email,password:signupInput.password}});
  assert.equal(login.response.status,200);
  const persistedCookie=login.response.headers.get('set-cookie')?.split(';')[0];
  const session=await call('/api/auth/session',{cookie:persistedCookie});
  assert.equal(session.response.status,200);assert.equal(session.data.user.email,signupInput.email);pass();
  const persistentPlaces=await call('/api/member/places',{cookie:persistedCookie});
  assert.equal(persistentPlaces.data.wishlist.length,1);assert.equal(persistentPlaces.data.visited.length,1);
  const persistentTrip=await call('/api/member/trips',{cookie:persistedCookie});
  assert.equal(persistentTrip.data.items[0].id,trip.id);assert.equal(persistentTrip.data.items[0].status,'completed');pass();
  const persistentBookings=await call('/api/member/trip-bookings',{cookie:persistedCookie});
  assert.equal(persistentBookings.data.items.reduce((sum,item)=>sum+item.seats,0),seats);pass();

  await stopServer();
  const account=sqlite('member-accounts.sqlite','SELECT password_hash FROM member_accounts WHERE email=?',signupInput.email);
  assert(account.password_hash.startsWith('scrypt$'));assert(!account.password_hash.includes(signupInput.password));
  assert.equal(sqlite('member-accounts.sqlite','PRAGMA integrity_check').integrity_check,'ok');
  assert.equal(sqlite('saved-articles.sqlite','PRAGMA integrity_check').integrity_check,'ok');
  assert.equal(sqlite('official-trip-bookings.sqlite','PRAGMA integrity_check').integrity_check,'ok');
  assert.equal(sqlite('custom-tour-quotes.sqlite','PRAGMA integrity_check').integrity_check,'ok');pass();

  const noMemberBrowserWrites=!/\b(?:localStorage|sessionStorage)\.setItem\s*\(/.test(await (await import('node:fs/promises')).readFile(join(root,'app.js'),'utf8'));
  assert(noMemberBrowserWrites,'Member account/dashboard code must not write functionality state to browser storage.');pass();
  console.log(JSON.stringify({ok:true,checks:checks+1,passed:true,coverage:['server-side signup/login/profile validation','unauthenticated member endpoints','wishlist and visited persistence','custom itinerary and travel-history persistence','saved article add/remove','validated custom tour request and admin status update','capacity refusal at full seats','member/admin booking visibility','database persistence across server restart','scrypt password hash','SQLite integrity','no browser member-state writes']},null,2));
} finally {
  await stopServer();
  const resolvedTemp=resolve(runtimeRoot);
  if(resolvedTemp.startsWith(resolve(tmpdir())+sep)&&existsSync(resolvedTemp))rmSync(resolvedTemp,{recursive:true,force:true});
}
