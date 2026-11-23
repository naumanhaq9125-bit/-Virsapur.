import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { validateQuoteInput,validateQuoteAdminPatch,tourOrigin,QUOTE_STATUSES,eligibleTourPlace } from '../src/tour-contract.mjs';

export function createQuoteStore(file,{loadPlaces,loadSite,legacyFile}={}) {
  const database=new DatabaseSync(file);
  database.exec(`
    PRAGMA busy_timeout=5000;
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS custom_tour_quote_requests(
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      record_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS custom_tour_quotes_status_created_idx ON custom_tour_quote_requests(status,created_at DESC);
  `);
  const insert=database.prepare('INSERT OR IGNORE INTO custom_tour_quote_requests(id,status,created_at,updated_at,record_json) VALUES(?,?,?,?,?)');
  const selectAll=database.prepare('SELECT record_json AS recordJson FROM custom_tour_quote_requests ORDER BY created_at DESC,id DESC');
  const selectById=database.prepare('SELECT record_json AS recordJson FROM custom_tour_quote_requests WHERE id=?');
  const update=database.prepare('UPDATE custom_tour_quote_requests SET status=?,updated_at=?,record_json=? WHERE id=?');
  const count=database.prepare('SELECT COUNT(*) AS total FROM custom_tour_quote_requests');

  if(legacyFile&&existsSync(legacyFile)){
    try{
      const legacy=JSON.parse(readFileSync(legacyFile,'utf8'));
      if(Array.isArray(legacy)&&legacy.length){
        database.exec('BEGIN');
        try{for(const record of legacy)if(record?.id&&record?.status&&record?.createdAt&&record?.updatedAt)insert.run(record.id,record.status,record.createdAt,record.updatedAt,JSON.stringify(record));database.exec('COMMIT');}
        catch(error){database.exec('ROLLBACK');throw error;}
      }
    }catch(error){console.error(`Could not migrate legacy custom-tour quote records: ${error.message}`);}
  }

  const invalid=errors=>{const error=Error(errors.join('\n'));error.statusCode=422;throw error;};
  const all=()=>selectAll.all().map(row=>JSON.parse(row.recordJson));
  const memberTripSummary=record=>record?{id:record.id,status:record.status,createdAt:record.createdAt,updatedAt:record.updatedAt}:null;
  return {
    async create(input){
      const checked=validateQuoteInput(input,await loadPlaces());
      if(checked.errors.length)invalid(checked.errors);
      if(count.get().total>=10000){const error=Error('Local request capacity reached. Ask the owner to export and archive requests.');error.statusCode=503;throw error;}
      const origin=tourOrigin(await loadSite()),now=new Date().toISOString();
      const record={...checked.value,id:`VQ-${randomUUID()}`,createdAt:now,updatedAt:now,status:'new',origin,internalNotes:'',quotedAmount:null,quoteCurrency:'PKR',environment:'local'};
      insert.run(record.id,record.status,record.createdAt,record.updatedAt,JSON.stringify(record));
      return {id:record.id,createdAt:record.createdAt,environment:'local'};
    },
    async submitMemberTrip({trip,user}){
      const places=await loadPlaces(),eligible=places.filter(eligibleTourPlace),placeById=new Map(eligible.map(place=>[place.id,place]));
      const today=new Date().toISOString().slice(0,10),destinations=Array.isArray(trip?.destinations)?trip.destinations:[];
      const start=String(trip?.startDate||''),end=String(trip?.endDate||'');
      if(!trip||typeof trip.id!=='string'||!trip.id||typeof user?.id!=='string'||!user.id||typeof user?.fullName!=='string'||typeof user?.email!=='string')invalid(['Sign in and choose one of your saved trips.']);
      if(trip.status==='completed')invalid(['Completed trips can’t be submitted as new plans.']);
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)||user.fullName.trim().length<2)invalid(['Your account needs a valid name and email address.']);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start<today||end<start)invalid(['Choose future travel dates before submitting this itinerary.']);
      if(!destinations.length||destinations.length>40||new Set(destinations.map(item=>item?.id)).size!==destinations.length||destinations.some(item=>!placeById.has(item?.id)||!Number.isInteger(Number(item.day))||Number(item.day)<1||Number(item.day)>60))invalid(['Add 1 to 40 valid heritage destinations with a day assigned to each.']);
      const groupSize=Number(trip.travelerCount);
      if(!Number.isInteger(groupSize)||groupSize<1||groupSize>100)invalid(['Traveler count must be between 1 and 100.']);
      const startMs=Date.parse(`${start}T12:00:00Z`),endMs=Date.parse(`${end}T12:00:00Z`),days=Math.floor((endMs-startMs)/86400000)+1;
      const customTrip={tripId:trip.id,tripName:String(trip.tripName||'').trim().slice(0,100),startingLocation:String(trip.startingLocation||'').trim().slice(0,120),startDate:start,endDate:end,travelerGroup:String(trip.travelerGroup||'').slice(0,30),travelerCount:groupSize,transportation:String(trip.transportation||'').slice(0,60),tripType:String(trip.tripType||'').slice(0,60),budget:trip.budget==null?null:Number(trip.budget),travelPace:String(trip.travelPace||'').slice(0,40),destinations:destinations.map(item=>({id:item.id,title:placeById.get(item.id).title,day:Number(item.day)}))};
      if(!customTrip.tripName||!customTrip.startingLocation||!customTrip.transportation||!customTrip.tripType||!customTrip.travelPace||customTrip.budget!==null&&(!Number.isFinite(customTrip.budget)||customTrip.budget<0))invalid(['Complete the trip name, starting location and travel preferences before submitting.']);
      const requests=all(),existing=requests.find(record=>record.requestType==='member_custom_trip'&&record.memberUserId===user.id&&record.memberTripId===trip.id&&record.status!=='closed');
      if(existing&& !['new','reviewing','declined'].includes(existing.status))return {request:memberTripSummary(existing),updated:false};
      const now=new Date().toISOString(),durationPreference=`${days} day${days===1?'':'s'}`;
      const record=existing||{id:`VQ-${randomUUID()}`,createdAt:now,status:'new',origin:tourOrigin(await loadSite()),environment:'local',quoteCurrency:'PKR'};
      Object.assign(record,{status:existing?.status==='declined'?'new':record.status,updatedAt:now,customerName:user.fullName.trim().slice(0,120),email:user.email.trim().toLowerCase(),phone:'',requestedDate:start,groupSize,durationPreference,transportPreference:customTrip.transportation,specialRequirements:`Trip type: ${customTrip.tripType}. Travel pace: ${customTrip.travelPace}. Estimated budget: ${customTrip.budget==null?'Not set':`PKR ${customTrip.budget}`}.`,notes:'Submitted from the member dashboard. Please contact the traveler to discuss the plan and confirm availability.',heritagePlaceIds:customTrip.destinations.map(item=>item.id),requestType:'member_custom_trip',memberUserId:user.id,memberTripId:trip.id,customTrip,internalNotes:existing?.internalNotes||'',quotedAmount:existing?.quotedAmount??null});
      if(existing)update.run(record.status,record.updatedAt,JSON.stringify(record),record.id);else insert.run(record.id,record.status,record.createdAt,record.updatedAt,JSON.stringify(record));
      return {request:memberTripSummary(record),updated:!existing||existing.status==='declined'};
    },
    memberTripRequest(userId,tripId){const record=all().find(item=>item.requestType==='member_custom_trip'&&item.memberUserId===userId&&item.memberTripId===tripId&&item.status!=='closed');return memberTripSummary(record||null);},
    async list({query='',status='',page=1,pageSize=20}={}){
      if(status&&!QUOTE_STATUSES.includes(status))invalid(['Invalid status filter.']);
      const q=String(query).toLocaleLowerCase().slice(0,200),size=Math.max(1,Math.min(50,Math.floor(Number(pageSize))||20));
      const records=all().filter(record=>(!status||record.status===status)&&(!q||[record.id,record.customerName,record.email,record.customTrip?.tripName,...record.heritagePlaceIds].filter(Boolean).join(' ').toLocaleLowerCase().includes(q)));
      const pages=Math.max(1,Math.ceil(records.length/size)),current=Math.max(1,Math.min(pages,Math.floor(Number(page))||1));
      return {items:records.slice((current-1)*size,current*size),total:records.length,page:current,pages,pageSize:size};
    },
    async update(id,input){
      const checked=validateQuoteAdminPatch(input);if(checked.errors.length)invalid(checked.errors);
      const record=JSON.parse(selectById.get(id)?.recordJson||'null');
      if(!record){const error=Error('Quote request not found.');error.statusCode=404;throw error;}
      Object.assign(record,checked.value,{updatedAt:new Date().toISOString()});
      update.run(record.status,record.updatedAt,JSON.stringify(record),id);
      return record;
    },
    close(){database.close();}
  };
}
