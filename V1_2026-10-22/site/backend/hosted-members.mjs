import { randomUUID } from 'node:crypto';
import { cmsConfig } from '../src/cms/config.mjs';
import { createSupabaseProvider } from '../src/cms/providers/supabase.mjs';
import { isValidDateOnly, isValidPersonName } from '../src/input-validation.mjs';
import { eligibleTourPlace, MAX_ITINERARY_PLACES } from '../src/tour-contract.mjs';
import { json, methodNotAllowed, requireSameOrigin, requireMutationProtection, enforceRateLimit, requireMember, requireAdmin } from '../api/_lib/http.js';

const error=(message,status)=>Object.assign(new Error(message),{status});
const responseError=e=>{const status=e?.status>=400&&e.status<500?e.status:500;if(status>=500)console.error('Hosted member API request failed',{name:e?.name||'Error',status});return json({ok:false,error:status<500?e.message:'The account service could not complete this request.'},status);};
const validId=value=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9 _.-]{0,159}$/.test(value);
const emailValid=value=>typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
const bookingRecord=row=>({id:row.id,tripId:row.trip_id,tripSlug:row.trip_slug,tripTitle:row.trip_title,fullName:row.full_name,email:row.email,phone:row.phone,seats:row.seats,status:row.status,paymentStatus:row.payment_status||'not_required',paymentAmount:row.payment_amount,paymentCurrency:row.payment_currency||'PKR',createdAt:row.created_at,paidAt:row.paid_at});

async function readJson(request,max=262144){
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))throw error('Send application/json.',415);
  if(Number(request.headers.get('content-length'))>max)throw error('Request is too large.',413);
  if(!request.body)throw error('A request body is required.',400);
  const reader=request.body.getReader(),chunks=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw error('Request is too large.',413);}chunks.push(value);}}
  catch(e){if(e.status)throw e;throw error('Could not read request body.',400);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw error('Invalid JSON body.',400);}
}

function provider(env=process.env,fetcher=globalThis.fetch){return createSupabaseProvider({config:cmsConfig(env),fetch:fetcher});}
async function livePlaceRows(cms,ids){
  if(!ids.length)return [];
  return cms.request('/rest/v1/cms_live_snapshots',{query:{select:'record_id,data',content_kind:'eq.record',collection:'eq.heritagePlaces',record_id:`in.(${ids.join(',')})`,limit:String(ids.length)}});
}
async function liveTrip(cms,id){
  const rows=await cms.request('/rest/v1/cms_live_snapshots',{query:{select:'data',content_kind:'eq.record',collection:'eq.events',record_id:`eq.${id}`,limit:'1'}});
  const trip=rows[0]?.data;
  if(!trip||trip.status!=='published'||trip.scheduleType!=='heritage-trip')throw error('This official trip is not available.',404);
  if(!Number.isFinite(Date.parse(trip.start))||!Number.isFinite(Date.parse(trip.end))||Date.parse(trip.end)<=Date.parse(trip.start))throw error('This trip schedule is invalid.',409);
  if(!['open','closed','cancelled','draft'].includes(trip.registrationState))throw error('This trip registration setting is invalid.',409);
  if(trip.capacity!=null&&(!Number.isInteger(Number(trip.capacity))||Number(trip.capacity)<1||Number(trip.capacity)>100000))throw error('This trip capacity is invalid.',409);
  return trip;
}
async function profileFor(cms,user){
  const rows=await cms.request('/rest/v1/member_profiles',{query:{select:'user_id,full_name,created_at,updated_at',user_id:`eq.${user.id}`,limit:'1'}});
  return rows[0]||null;
}
const publicMember=(user,profile)=>({id:user.id,fullName:profile?.full_name||user.user_metadata?.full_name||user.user_metadata?.name||'',email:user.email||'',createdAt:profile?.created_at||user.created_at});

function cleanTrip(input,existing,allowedPlaceIds){
  if(!input||typeof input!=='object'||!validId(input.id)||typeof input.tripName!=='string'||input.tripName.trim().length<1||input.tripName.trim().length>100||typeof input.startingLocation!=='string'||!input.startingLocation.trim()||input.startingLocation.length>120)return null;
  if(!isValidDateOnly(input.startDate)||!isValidDateOnly(input.endDate)||input.endDate<input.startDate)return null;
  if(!Number.isInteger(Number(input.travelerCount))||Number(input.travelerCount)<1||Number(input.travelerCount)>100)return null;
  const choices={travelerGroup:['Solo','Couple','Family','Group'],transportation:['Car','Bike','Public transport'],tripType:['Solo','Family','Friends','Educational'],travelPace:['Relaxed','Moderate','Fast']};
  for(const [key,values] of Object.entries(choices))if(!values.includes(input[key]))return null;
  if(input.budget!=null&&input.budget!==''&&(!Number.isFinite(Number(input.budget))||Number(input.budget)<0||Number(input.budget)>100000000))return null;
  if(!Array.isArray(input.destinations)||input.destinations.length>120||input.destinations.some(stop=>!stop||!allowedPlaceIds.has(stop.id)||!Number.isInteger(Number(stop.day))||Number(stop.day)<1||Number(stop.day)>60))return null;
  if(input.status!==undefined&&input.status!=='completed')return null;
  if(input.completedAt!==undefined&&(!input.status||!Number.isFinite(Date.parse(input.completedAt))))return null;
  const now=new Date().toISOString();
  return {id:input.id,tripName:input.tripName.trim(),startingLocation:input.startingLocation.trim(),startDate:input.startDate,endDate:input.endDate,travelerGroup:input.travelerGroup,travelerCount:Number(input.travelerCount),transportation:input.transportation,tripType:input.tripType,budget:input.budget==null||input.budget===''?null:Number(input.budget),travelPace:input.travelPace,destinations:input.destinations.map(stop=>({id:stop.id,day:Number(stop.day)})),...(input.status==='completed'?{status:'completed',completedAt:input.completedAt||now}:{}),createdAt:existing?.createdAt||now,updatedAt:now};
}

export function createHostedMemberHandlers({env=process.env,rateLimit=enforceRateLimit,member=requireMember,fetcher=globalThis.fetch}={}){
  const tripBookingsEnabled=()=>env.PRODUCTION_CMS_ENABLED==='true'&&env.TRIP_BOOKINGS_ENABLED==='true';
  const available=()=>json({ok:false,error:'Not found.'},404);
  return {
    async places(request){
      if(env.PRODUCTION_CMS_ENABLED!=='true')return available();
      if(!['GET','POST','DELETE'].includes(request.method))return methodNotAllowed(['GET','POST','DELETE']);
      try{
        const auth=await member(request),cms=provider(env,fetcher);
        if(request.method==='GET'){
          const rows=await cms.request('/rest/v1/member_places',{query:{select:'place_id,list_type',user_id:`eq.${auth.user.id}`,order:'created_at.asc,place_id.asc',limit:'2400'}});
          const result={wishlist:[],visited:[]};for(const row of rows)result[row.list_type]?.push(row.place_id);
          return json({ok:true,...result});
        }
        requireSameOrigin(request);
        const input=await readJson(request,120000),items=request.method==='POST'&&Array.isArray(input?.items)?input.items:[input];
        if(items.length>1200||items.some(item=>!item||!validId(item.placeId)||!['wishlist','visited'].includes(item.listType)))throw error('Choose a valid destination and list.',422);
        const ids=[...new Set(items.map(item=>item.placeId))],places=await livePlaceRows(cms,ids),allowed=new Set(places.filter(row=>row.data?.status==='published'&&row.data?.recordType==='place').map(row=>row.record_id));
        if(ids.some(id=>!allowed.has(id)))throw error('One or more selected destinations are no longer available.',404);
        if(request.method==='POST'&&items.length)await cms.request('/rest/v1/member_places',{method:'POST',query:{on_conflict:'user_id,place_id,list_type'},body:[...new Map(items.map(item=>[`${item.placeId}:${item.listType}`,{user_id:auth.user.id,place_id:item.placeId,list_type:item.listType}])).values()],headers:{Prefer:'resolution=ignore-duplicates,return=minimal'}});
        if(request.method==='DELETE')for(const item of items)await cms.request('/rest/v1/member_places',{method:'DELETE',query:{user_id:`eq.${auth.user.id}`,place_id:`eq.${item.placeId}`,list_type:`eq.${item.listType}`}});
        const rows=await cms.request('/rest/v1/member_places',{query:{select:'place_id,list_type',user_id:`eq.${auth.user.id}`,order:'created_at.asc,place_id.asc',limit:'2400'}}),result={wishlist:[],visited:[]};for(const row of rows)result[row.list_type]?.push(row.place_id);
        return json({ok:true,...result});
      }catch(e){return responseError(e);}
    },
    async trips(request){
      if(env.PRODUCTION_CMS_ENABLED!=='true')return available();
      if(!['GET','POST'].includes(request.method))return methodNotAllowed(['GET','POST']);
      try{
        const auth=await member(request),cms=provider(env,fetcher);
        if(request.method==='GET'){
          const [rows,requests]=await Promise.all([
            cms.request('/rest/v1/member_trips',{query:{select:'trip_data,created_at,updated_at',user_id:`eq.${auth.user.id}`,order:'updated_at.desc,trip_id.asc',limit:'500'}}),
            cms.request('/rest/v1/custom_tour_quote_requests',{query:{select:'id,status,created_at,updated_at,member_trip_id',member_user_id:`eq.${auth.user.id}`,request_type:'eq.member_custom_trip',status:'neq.closed',limit:'500'}})
          ]);
          const byTrip=new Map(requests.map(item=>[item.member_trip_id,{id:item.id,status:item.status,createdAt:item.created_at,updatedAt:item.updated_at}]));
          return json({ok:true,items:rows.map(row=>({...row.trip_data,adminRequest:byTrip.get(row.trip_data.id)||null}))});
        }
        requireSameOrigin(request);
        const input=await readJson(request),incoming=Array.isArray(input?.items)?input.items:[input?.trip||input];
        if(incoming.length>100)throw error('Too many trips in one request.',413);
        const existingRows=await cms.request('/rest/v1/member_trips',{query:{select:'trip_id,trip_data',user_id:`eq.${auth.user.id}`,limit:'500'}}),existing=new Map(existingRows.map(row=>[row.trip_id,row.trip_data]));
        const allowedPlaces=new Set((await cms.request('/rest/v1/cms_live_snapshots',{query:{select:'record_id,data',content_kind:'eq.record',collection:'eq.heritagePlaces',limit:'2000'}})).filter(row=>row.data?.status==='published').map(row=>row.record_id));
        const cleaned=incoming.map(item=>cleanTrip(item,existing.get(item?.id),allowedPlaces));if(cleaned.some(item=>!item))throw error('A trip has missing or invalid details. Review the trip fields and destinations.',422);
        const rows=cleaned.map(trip=>({user_id:auth.user.id,trip_id:trip.id,trip_data:trip,created_at:trip.createdAt,updated_at:trip.updatedAt}));
        if(rows.length)await cms.request('/rest/v1/member_trips',{method:'POST',query:{on_conflict:'user_id,trip_id'},body:rows,headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});
        return json({ok:true,items:cleaned});
      }catch(e){return responseError(e);}
    },
    async tripItem(request){
      if(env.PRODUCTION_CMS_ENABLED!=='true')return available();
      if(request.method!=='DELETE')return methodNotAllowed(['DELETE']);
      try{const auth=await member(request);requireSameOrigin(request);const id=decodeURIComponent(new URL(request.url).pathname.split('/').at(-1)||'');if(!validId(id))throw error('Choose a valid trip.',422);const cms=provider(env,fetcher);await cms.request('/rest/v1/member_trips',{method:'DELETE',query:{user_id:`eq.${auth.user.id}`,trip_id:`eq.${id}`}});return json({ok:true});}catch(e){return responseError(e);}
    },
    async submitTrip(request){
      if(env.PRODUCTION_CMS_ENABLED!=='true')return available();
      if(request.method!=='POST')return methodNotAllowed(['POST']);
      try{
        const auth=await member(request);requireSameOrigin(request);const input=await readJson(request,2048);if(Object.keys(input||{}).length)throw error('Submit a saved trip without additional client-supplied details.',422);
        const tripId=decodeURIComponent(new URL(request.url).pathname.split('/').at(-2)||'');if(!validId(tripId))throw error('Choose a valid saved trip.',422);
        const cms=provider(env,fetcher),trips=await cms.request('/rest/v1/member_trips',{query:{select:'trip_data',user_id:`eq.${auth.user.id}`,trip_id:`eq.${tripId}`,limit:'1'}}),trip=trips[0]?.trip_data;
        if(!trip)throw error('This saved trip could not be found in your account.',404);
        if(trip.status==='completed')throw error('Completed trips cannot be submitted as new plans.',422);
        const today=new Date().toISOString().slice(0,10),destinations=Array.isArray(trip.destinations)?trip.destinations:[];
        if(!isValidDateOnly(trip.startDate)||!isValidDateOnly(trip.endDate)||trip.startDate<today||trip.endDate<trip.startDate)throw error('Choose future travel dates before submitting this itinerary.',422);
        if(!destinations.length||destinations.length>MAX_ITINERARY_PLACES||new Set(destinations.map(stop=>stop.id)).size!==destinations.length)throw error('Add 1 to 40 distinct destinations before submitting.',422);
        const placeRows=await livePlaceRows(cms,destinations.map(stop=>stop.id)),eligible=new Map(placeRows.filter(row=>eligibleTourPlace(row.data)).map(row=>[row.record_id,row.data]));
        if(destinations.some(stop=>!eligible.has(stop.id)||!Number.isInteger(Number(stop.day))||Number(stop.day)<1||Number(stop.day)>60))throw error('Your itinerary includes a destination that is no longer eligible.',422);
        const groupSize=Number(trip.travelerCount);if(!Number.isInteger(groupSize)||groupSize<1||groupSize>100)throw error('Traveler count must be between 1 and 100.',422);
        const profile=await profileFor(cms,auth.user),fullName=profile?.full_name||auth.user.user_metadata?.full_name||'',email=auth.user.email||'';
        if(!isValidPersonName(fullName)||!emailValid(email))throw error('Your account needs a valid name and email address.',422);
        const start=Date.parse(`${trip.startDate}T12:00:00Z`),end=Date.parse(`${trip.endDate}T12:00:00Z`),days=Math.floor((end-start)/86400000)+1;
        const customTrip={tripId:trip.id,tripName:trip.tripName,startingLocation:trip.startingLocation,startDate:trip.startDate,endDate:trip.endDate,travelerGroup:trip.travelerGroup,travelerCount:groupSize,transportation:trip.transportation,tripType:trip.tripType,budget:trip.budget,travelPace:trip.travelPace,destinations:destinations.map(stop=>({id:stop.id,title:eligible.get(stop.id).title,day:Number(stop.day)}))};
        const now=new Date().toISOString(),query={select:'id,status,created_at,updated_at',member_user_id:`eq.${auth.user.id}`,member_trip_id:`eq.${trip.id}`,request_type:'eq.member_custom_trip',status:'neq.closed',order:'created_at.desc',limit:'1'},found=await cms.request('/rest/v1/custom_tour_quote_requests',{query}),existing=found[0];
        if(existing&&!['new','reviewing','declined'].includes(existing.status))return json({ok:true,updated:false,request:{id:existing.id,status:existing.status,createdAt:existing.created_at,updatedAt:existing.updated_at}});
        const requestData={requestedDate:trip.startDate,groupSize,durationPreference:`${days} day${days===1?'':'s'}`,heritagePlaceIds:destinations.map(stop=>stop.id),customerName:fullName,email,phone:'Not provided',transportPreference:trip.transportation,specialRequirements:`Trip type: ${trip.tripType}. Travel pace: ${trip.travelPace}. Estimated budget: ${trip.budget==null?'Not set':`PKR ${trip.budget}`}.`,notes:'Submitted from the member dashboard for admin review.'};
        const row={id:existing?.id||`VQ-${randomUUID()}`,request_type:'member_custom_trip',member_user_id:auth.user.id,member_trip_id:trip.id,custom_trip:customTrip,request_data:requestData,origin:'Lahore',status:existing?.status==='declined'?'new':existing?.status||'new',internal_notes:existing?.internal_notes||'',quoted_amount:existing?.quoted_amount??null,quote_currency:existing?.quote_currency||'PKR',created_at:existing?.created_at||now,updated_at:now,updated_by:null};
        if(existing)await cms.request('/rest/v1/custom_tour_quote_requests',{method:'PATCH',query:{id:`eq.${existing.id}`},body:row,headers:{Prefer:'return=minimal'}});else await cms.request('/rest/v1/custom_tour_quote_requests',{method:'POST',body:row,headers:{Prefer:'return=minimal'}});
        return json({ok:true,updated:!existing||existing.status==='declined',request:{id:row.id,status:row.status,createdAt:row.created_at,updatedAt:row.updated_at}},existing?200:201);
      }catch(e){return responseError(e);}
    },
    async savedArticles(request){
      if(env.PRODUCTION_CMS_ENABLED!=='true')return available();
      if(!['GET','POST'].includes(request.method))return methodNotAllowed(['GET','POST']);
      try{const auth=await member(request),cms=provider(env,fetcher);if(request.method==='GET'){const rows=await cms.request('/rest/v1/saved_articles',{query:{select:'article_id,saved_at',user_id:`eq.${auth.user.id}`,order:'saved_at.desc,article_id.asc',limit:'2000'}});return json({ok:true,items:rows.map(row=>({articleId:row.article_id,savedAt:row.saved_at}))});}
        requireSameOrigin(request);const input=await readJson(request,2048),id=input?.articleId;if(!validId(id))throw error('Choose a valid article.',422);const rows=await cms.request('/rest/v1/cms_live_snapshots',{query:{select:'record_id,data',content_kind:'eq.record',collection:'eq.stories',record_id:`eq.${id}`,limit:'1'}});if(!rows[0]||rows[0].data?.status!=='published')throw error('This article is no longer available to save.',404);
        await cms.request('/rest/v1/saved_articles',{method:'POST',query:{on_conflict:'user_id,article_id'},body:{user_id:auth.user.id,article_id:id},headers:{Prefer:'resolution=ignore-duplicates,return=minimal'}});return json({ok:true,articleId:id},201);
      }catch(e){return responseError(e);}
    },
    async savedArticle(request){
      if(env.PRODUCTION_CMS_ENABLED!=='true')return available();if(request.method!=='DELETE')return methodNotAllowed(['DELETE']);
      try{const auth=await member(request);requireSameOrigin(request);const id=decodeURIComponent(new URL(request.url).pathname.split('/').at(-1)||'');if(!validId(id))throw error('Choose a valid article.',422);await provider(env,fetcher).request('/rest/v1/saved_articles',{method:'DELETE',query:{user_id:`eq.${auth.user.id}`,article_id:`eq.${id}`}});return json({ok:true,articleId:id});}catch(e){return responseError(e);}
    },
    async tripBooking(request){
      if(!tripBookingsEnabled())return available();if(!['GET','POST'].includes(request.method))return methodNotAllowed(['GET','POST']);
      try{if(request.method==='POST')requireSameOrigin(request);const cms=provider(env,fetcher),url=new URL(request.url);
        if(request.method==='GET'){
          const tripId=url.searchParams.get('tripId')||'';if(!validId(tripId))throw error('Choose a valid trip.',422);await rateLimit(request,'trip-bookings-availability',60,60);const trip=await liveTrip(cms,tripId),used=Number(await cms.rpc('official_trip_seats_used',{p_trip_id:tripId})),open=trip.registrationState==='open'&&Date.parse(trip.end)>=Date.now(),remaining=trip.capacity==null?null:Math.max(0,Number(trip.capacity)-used),amount=Number(trip.commerce?.amount),currency=String(trip.commerce?.currency||'PKR').toUpperCase(),priceValid=Number.isFinite(amount)&&amount>0&&Math.abs(amount*100-Math.round(amount*100))<=1e-6&&currency==='PKR',paymentRequired=env.PAYMENT_MODE==='stripe',paymentConfigured=Boolean(env.STRIPE_SECRET_KEY&&env.STRIPE_WEBHOOK_SECRET);
          return json({ok:true,availableSeats:open?remaining:0,capacity:trip.capacity??null,registrationState:open?'open':'closed',paymentRequired, paymentConfigured,checkoutEnabled:paymentRequired&&paymentConfigured&&priceValid,seatPrice:priceValid?amount:null,currency});
        }
        const auth=await member(request);await rateLimit(request,'trip-bookings-create',8,3600);const input=await readJson(request,4096);if(!input||Object.keys(input).some(key=>!['tripId','fullName','email','phone','seats','bookingAction'].includes(key)))throw error('Only reservation details can be submitted.',422);
        if(input.bookingAction!==undefined&&!['request','pay'].includes(input.bookingAction))throw error('Choose Request to book or Pay & book.',422);
        const tripId=String(input.tripId||''),profile=await profileFor(cms,auth.user),fullName=String(profile?.full_name||auth.user.user_metadata?.full_name||'').trim(),email=String(auth.user.email||'').trim().toLowerCase(),phone=typeof input.phone==='string'?input.phone.trim():'',seats=input.seats;
        if(!validId(tripId)||fullName.length<2||fullName.length>80||!isValidPersonName(fullName)||!emailValid(email)||phone.length>40||!/^[+()\d\s.-]*$/.test(phone)||!Number.isInteger(seats)||seats<1||seats>10)throw error('Check your account name, phone number and number of seats.',422);
        const trip=await liveTrip(cms,tripId);if(trip.registrationState!=='open'||Date.parse(trip.end)<Date.now())throw error('Reservations are closed for this trip.',409);
        const pay=input.bookingAction==='pay';if(pay&&(env.PAYMENT_MODE!=='stripe'||!env.STRIPE_SECRET_KEY||!env.STRIPE_WEBHOOK_SECRET))throw error('Online payment is not configured. Choose Request to book instead.',409);
        const amount=Number(trip.commerce?.amount),currency=String(trip.commerce?.currency||'PKR').toLowerCase();if(pay&&(!Number.isFinite(amount)||amount<=0||Math.abs(amount*100-Math.round(amount*100))>1e-6||amount>999999.99||currency!=='pkr'))throw error('The admin has not set a valid PKR seat price for this trip.',409);
        const bookingId=`VT-${randomUUID()}`,bookingRows=await cms.rpc('create_official_trip_booking',{p_booking_id:bookingId,p_trip_id:tripId,p_trip_slug:trip.slug||trip.id,p_trip_title:trip.title,p_user_id:auth.user.id,p_full_name:fullName,p_email:email,p_phone:phone,p_seats:seats,p_status:pay?'pending_payment':'pending'}),booking=bookingRows?.[0];if(!booking)throw error('The reservation was not saved.',503);
        if(pay){
          try{const {default:Stripe}=await import('stripe'),stripe=new Stripe(env.STRIPE_SECRET_KEY),origin=String(env.SITE_ORIGIN||new URL(request.url).origin).replace(/\/$/,''),session=await stripe.checkout.sessions.create({mode:'payment',customer_email:email,client_reference_id:bookingId,expires_at:Math.floor(Date.now()/1000)+30*60,line_items:[{quantity:seats,price_data:{currency,unit_amount:Math.round(amount*100),product_data:{name:trip.title,description:String(trip.summary||'Official Virsapur heritage trip').slice(0,500)}}}],metadata:{bookingId,tripId,userId:auth.user.id},payment_intent_data:{metadata:{bookingId,tripId,userId:auth.user.id}},success_url:`${origin}/profile/bookings/?checkout=success`,cancel_url:`${origin}/trips/${encodeURIComponent(trip.slug||trip.id)}/?checkout=cancelled#reserve`},{idempotencyKey:`virsapur-${bookingId}`});
            await cms.request('/rest/v1/official_trip_bookings',{method:'PATCH',query:{id:`eq.${bookingId}`,status:'eq.pending_payment'},body:{stripe_session_id:session.id,hold_expires_at:new Date(session.expires_at*1000).toISOString(),payment_amount:Math.round(amount*100),payment_currency:currency.toUpperCase()},headers:{Prefer:'return=minimal'}});return json({ok:true,checkoutUrl:session.url,booking:{id:booking.id,tripId:booking.trip_id,tripTitle:booking.trip_title,seats:booking.seats,status:booking.status,paymentStatus:'checkout_pending'}},201);
          }catch(e){await cms.request('/rest/v1/official_trip_bookings',{method:'PATCH',query:{id:`eq.${bookingId}`,status:'eq.pending_payment'},body:{status:'cancelled',payment_status:'failed'},headers:{Prefer:'return=minimal'}}).catch(()=>{});throw e;}
        }
        return json({ok:true,booking:{id:booking.id,tripId:booking.trip_id,tripTitle:booking.trip_title,fullName:booking.full_name,email:booking.email,phone:booking.phone,seats:booking.seats,status:booking.status,paymentStatus:booking.payment_status,createdAt:booking.created_at}},201);
      }catch(e){return responseError(e);}
    },
    async memberBookings(request){
      if(!tripBookingsEnabled())return available();if(request.method!=='GET')return methodNotAllowed(['GET']);
      try{const auth=await member(request),rows=await provider(env,fetcher).request('/rest/v1/official_trip_bookings',{query:{select:'id,trip_id,trip_slug,trip_title,full_name,email,phone,seats,status,payment_status,payment_amount,payment_currency,created_at,paid_at',user_id:`eq.${auth.user.id}`,order:'created_at.desc,id.desc',limit:'500'}});return json({ok:true,items:rows.map(bookingRecord)});}catch(e){return responseError(e);}
    },
    async adminBookings(request){
      if(!tripBookingsEnabled())return available();if(!['GET','PATCH'].includes(request.method))return methodNotAllowed(['GET','PATCH']);
      try{const {user}=await requireAdmin(request,['owner','editor']),cms=provider(env,fetcher);if(request.method==='GET'){const rows=await cms.request('/rest/v1/official_trip_bookings',{query:{select:'*',order:'created_at.desc,id.desc',limit:'500'}});return json({ok:true,items:rows.map(bookingRecord)});}
        requireMutationProtection(request);const id=decodeURIComponent(new URL(request.url).pathname.split('/').at(-1)||'');if(!/^VT-[0-9a-f-]{36}$/i.test(id))throw error('Choose a valid booking.',422);const input=await readJson(request,2048);if(!['confirmed','declined','cancelled'].includes(input?.status)||Object.keys(input).some(key=>key!=='status'))throw error('Choose an allowed booking status.',422);const result=await cms.request('/rest/v1/official_trip_bookings',{method:'PATCH',query:{id:`eq.${id}`,status:'in.(pending,confirmed)'},body:{status:input.status,reviewed_by:user.id,reviewed_at:new Date().toISOString()},headers:{Prefer:'return=representation'}});if(!result.length)throw error('Pending booking not found or already changed.',409);return json({ok:true,items:(await cms.request('/rest/v1/official_trip_bookings',{query:{select:'*',order:'created_at.desc,id.desc',limit:'500'}})).map(bookingRecord)});
      }catch(e){return responseError(e);}
    },
    async stripeWebhook(request){
      if(env.PRODUCTION_CMS_ENABLED!=='true'||!tripBookingsEnabled()||env.PAYMENT_MODE!=='stripe'||!env.STRIPE_SECRET_KEY||!env.STRIPE_WEBHOOK_SECRET)return available();
      if(request.method!=='POST')return methodNotAllowed(['POST']);
      try{const signature=request.headers.get('stripe-signature');if(!signature)throw error('Missing Stripe signature.',400);const raw=Buffer.from(await request.arrayBuffer()),{default:Stripe}=await import('stripe'),stripe=new Stripe(env.STRIPE_SECRET_KEY);let event;try{event=stripe.webhooks.constructEvent(raw,signature,env.STRIPE_WEBHOOK_SECRET);}catch{throw error('Invalid Stripe webhook signature.',400);}
        const cms=provider(env,fetcher),session=event.data?.object,bookingId=session?.metadata?.bookingId;if(!bookingId||!/^VT-[0-9a-f-]{36}$/i.test(bookingId))return json({ok:true,ignored:true});
        if((event.type==='checkout.session.completed'&&session.payment_status==='paid')||event.type==='checkout.session.async_payment_succeeded')await cms.request('/rest/v1/official_trip_bookings',{method:'PATCH',query:{id:`eq.${bookingId}`,stripe_session_id:`eq.${session.id}`,status:'eq.pending_payment'},body:{status:'pending',payment_status:'paid',payment_intent_id:typeof session.payment_intent==='string'?session.payment_intent:null,payment_amount:session.amount_total||null,payment_currency:String(session.currency||'').toUpperCase()||null,paid_at:new Date().toISOString(),hold_expires_at:null},headers:{Prefer:'return=minimal'}});
        else if(['checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type))await cms.request('/rest/v1/official_trip_bookings',{method:'PATCH',query:{id:`eq.${bookingId}`,stripe_session_id:`eq.${session.id}`,status:'eq.pending_payment'},body:{status:'cancelled',payment_status:event.type==='checkout.session.expired'?'expired':'failed',hold_expires_at:null},headers:{Prefer:'return=minimal'}});
        return json({received:true});
      }catch(e){return responseError(e);}
    }
  };
}

export { readJson, publicMember, profileFor, provider, responseError, error };
