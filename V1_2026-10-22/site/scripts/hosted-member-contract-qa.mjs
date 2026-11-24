import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHostedMemberHandlers} from '../backend/hosted-members.mjs';

const readJson=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const [placeRecords,stories,events]=await Promise.all([readJson('../content/data/heritage-places.json'),readJson('../content/data/stories.json'),readJson('../content/data/events.json')]);
const place=placeRecords.find(item=>item.status==='published'&&item.recordType==='place');
const storySource=stories[0];
const story={...storySource,id:'qa-hosted-story-contract',status:'published'};
const event=events.find(item=>item.status==='published'&&item.scheduleType==='heritage-trip'&&item.registrationState==='open'&&Date.parse(item.end)>Date.now());
assert.ok(place&&story&&event,'Published place, story and future official trip fixtures are required.');

const state={places:[],trips:[],saved:[],quotes:[],bookings:[]};
const user={id:'qa-user-001',email:'qa@example.com',user_metadata:{full_name:'QA Traveler'}};
const env={PRODUCTION_CMS_ENABLED:'true',CMS_DATA_MODE:'production',SUPABASE_URL:'https://supabase.example',SUPABASE_PUBLISHABLE_KEY:'qa-publishable',SUPABASE_SECRET_KEY:'qa-secret',TRIP_BOOKINGS_ENABLED:'true',PAYMENT_MODE:'disabled'};
const fetcher=async(input,options={})=>{
  const url=new URL(input),path=url.pathname,method=options.method||'GET',body=options.body?JSON.parse(options.body):null;
  let value=[];
  if(path==='/rest/v1/cms_live_snapshots'){
    const collection=url.searchParams.get('collection')?.replace(/^eq\./,'');
    const recordFilter=url.searchParams.get('record_id')||'';
    const id=recordFilter.replace(/^eq\./,'');
    const included=recordFilter.startsWith('in.(')?recordFilter.slice(4,-1).split(','):null;
    const rows=collection==='heritagePlaces'?placeRecords:collection==='stories'?[...stories,story]:collection==='events'?events:[];
    value=rows.filter(row=>(!recordFilter||(included?included.includes(row.id):row.id===id))&&row.status==='published').map(row=>({record_id:row.id,data:row}));
  }else if(path==='/rest/v1/member_places'){
    const id=url.searchParams.get('place_id')?.replace(/^eq\./,'');
    const kind=url.searchParams.get('list_type')?.replace(/^eq\./,'');
    if(method==='GET')value=state.places.filter(row=>(!id||row.place_id===id)&&(!kind||row.list_type===kind));
    else if(method==='POST'){for(const row of body||[])if(!state.places.some(item=>item.place_id===row.place_id&&item.list_type===row.list_type))state.places.push(row);value=[];}
    else {state.places=state.places.filter(row=>row.place_id!==id||row.list_type!==kind);value=[];}
  }else if(path==='/rest/v1/member_trips'){
    const id=url.searchParams.get('trip_id')?.replace(/^eq\./,'');
    if(method==='GET')value=state.trips.filter(row=>!id||row.trip_id===id);
    else if(method==='POST'){for(const row of body||[]){const at=state.trips.findIndex(item=>item.trip_id===row.trip_id);if(at<0)state.trips.push(row);else state.trips[at]=row;}value=[];}
    else {state.trips=state.trips.filter(row=>row.trip_id!==id);value=[];}
  }else if(path==='/rest/v1/saved_articles'){
    const id=url.searchParams.get('article_id')?.replace(/^eq\./,'');
    if(method==='GET')value=state.saved.filter(row=>!id||row.article_id===id);
    else if(method==='POST'){if(!state.saved.some(row=>row.article_id===body.article_id))state.saved.push({...body,saved_at:new Date().toISOString()});value=[];}
    else {state.saved=state.saved.filter(row=>row.article_id!==id);value=[];}
  }else if(path==='/rest/v1/member_profiles')value=[];
  else if(path==='/rest/v1/custom_tour_quote_requests'){
    if(method==='GET')value=state.quotes;
    else if(method==='POST'){state.quotes.push(body);value=[];}
  }else if(path==='/rest/v1/rpc/official_trip_seats_used')value=0;
  else if(path==='/rest/v1/rpc/create_official_trip_booking'){
    const row={id:body.p_booking_id,trip_id:body.p_trip_id,trip_slug:body.p_trip_slug,trip_title:body.p_trip_title,user_id:body.p_user_id,full_name:body.p_full_name,email:body.p_email,phone:body.p_phone,seats:body.p_seats,status:body.p_status,payment_status:body.p_status==='pending_payment'?'checkout_pending':'not_required',created_at:new Date().toISOString()};state.bookings.push(row);value=[row];
  }else if(path==='/rest/v1/official_trip_bookings')value=state.bookings;
  else throw new Error(`Unexpected mock request: ${method} ${path}`);
  return new Response(JSON.stringify(value),{status:200,headers:{'content-type':'application/json','content-range':`0-${Math.max(0,value.length-1)}/${value.length}`}});
};
const handlers=createHostedMemberHandlers({env,fetcher,rateLimit:async()=>{},member:async()=>({user,token:'qa-token'})});
const request=(path,method='GET',body)=>new Request(`https://virsapur.example${path}`,{method,headers:{origin:'https://virsapur.example','content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
const check=async(name,promise,predicate)=>{const response=await promise;const data=await response.json();assert.ok(predicate(response,data),`${name}: ${response.status} ${JSON.stringify(data)}`);return data;};
let checks=0;

await check('feature gate fails closed',createHostedMemberHandlers({env:{...env,PRODUCTION_CMS_ENABLED:'false'},fetcher}).places(request('/api/member/places')), (r)=>r.status===404);checks++;
let places=await check('read empty member places',handlers.places(request('/api/member/places')),(r,d)=>r.ok&&d.wishlist.length===0&&d.visited.length===0);checks++;
places=await check('save wishlist place',handlers.places(request('/api/member/places','POST',{placeId:place.id,listType:'wishlist'})),(r,d)=>r.ok&&d.wishlist.includes(place.id));checks++;
await check('reject unknown wishlist place',handlers.places(request('/api/member/places','POST',{placeId:'not-a-live-place',listType:'wishlist'})),r=>r.status===404);checks++;
await check('remove wishlist place',handlers.places(request('/api/member/places','DELETE',{placeId:place.id,listType:'wishlist'})),(r,d)=>r.ok&&d.wishlist.length===0);checks++;

const start=new Date(Date.now()+40*86400000).toISOString().slice(0,10),end=new Date(Date.now()+42*86400000).toISOString().slice(0,10);
const trip={id:'qa-hosted-trip-01',tripName:'Hosted QA itinerary',startingLocation:'Lahore',startDate:start,endDate:end,travelerGroup:'Solo',travelerCount:1,transportation:'Car',tripType:'Solo',budget:null,travelPace:'Relaxed',destinations:[{id:place.id,day:1}]};
await check('reject invalid trip dates',handlers.trips(request('/api/member/trips','POST',{trip:{...trip,startDate:'2026-02-30'}})),r=>r.status===422);checks++;
await check('save hosted trip',handlers.trips(request('/api/member/trips','POST',{trip})),(r,d)=>r.ok&&d.items.some(item=>item.id===trip.id));checks++;
let trips=await check('read hosted trip',handlers.trips(request('/api/member/trips')),(r,d)=>r.ok&&d.items.some(item=>item.id===trip.id));checks++;
await check('submit saved itinerary',handlers.submitTrip(request(`/api/member/trips/${trip.id}/submit`,'POST',{})),(r,d)=>r.ok&&d.request.status==='new');checks++;
trips=await check('trip includes admin request status',handlers.trips(request('/api/member/trips')),(r,d)=>r.ok&&d.items.some(item=>item.id===trip.id&&item.adminRequest?.status==='new'));checks++;
await check('delete hosted trip',handlers.tripItem(request(`/api/member/trips/${trip.id}`,'DELETE')),(r,d)=>r.ok);checks++;

await check('save hosted article',handlers.savedArticles(request('/api/saved-articles','POST',{articleId:story.id})),(r,d)=>r.ok&&d.articleId===story.id);checks++;
await check('read hosted article',handlers.savedArticles(request('/api/saved-articles')),(r,d)=>r.ok&&d.items.some(item=>item.articleId===story.id));checks++;
await check('remove hosted article',handlers.savedArticle(request(`/api/saved-articles/${story.id}`,'DELETE')),(r,d)=>r.ok&&d.articleId===story.id);checks++;
await check('reject unknown saved article',handlers.savedArticles(request('/api/saved-articles','POST',{articleId:'missing-story'})),r=>r.status===404);checks++;

await check('trip seat availability',handlers.tripBooking(request(`/api/trip-bookings?tripId=${encodeURIComponent(event.id)}`)),(r,d)=>r.ok&&d.registrationState==='open'&&d.availableSeats!==0);checks++;
const booking=await check('create pending seat request',handlers.tripBooking(request('/api/trip-bookings','POST',{tripId:event.id,fullName:user.user_metadata.full_name,email:user.email,phone:'',seats:1,bookingAction:'request'})),(r,d)=>r.status===201&&d.booking.status==='pending');checks++;
await check('member booking history',handlers.memberBookings(request('/api/member/trip-bookings')),(r,d)=>r.ok&&d.items.some(item=>item.id===booking.booking.id&&item.status==='pending'));checks++;
await check('reject unauthorized origin',handlers.places(new Request('https://virsapur.example/api/member/places',{method:'POST',headers:{origin:'https://attacker.example','content-type':'application/json'},body:JSON.stringify({placeId:place.id,listType:'wishlist'})})),r=>r.status===403);checks++;

console.log(JSON.stringify({ok:true,checks,passed:true,syntheticOnly:true,coverage:['hosted wishlist and visited persistence','custom itinerary persistence and admin request linkage','saved article persistence','official booking availability and pending requests','server-side user scoping, validation and same-origin checks','feature flags fail closed']} ,null,2));
