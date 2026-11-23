// Shared, provider-neutral contract. No transport, pricing or publication side effects.
export const QUOTE_STATUSES = ['new','reviewing','quoted','confirmed','approved','declined','closed'];
export const MAX_ITINERARY_PLACES = 40;
export const isTour = record => record.tour?.enabled === true || record.id === 'programme-heritage-tours';
export const tourOrigin = site => String(site.defaultTourOrigin || 'Lahore');
export const eligibleTourPlace = record => record.status === 'published' && record.recordType === 'place' && record.heritageDomain === 'cultural-tangible';
export function restoreItinerary(raw,allowedIds){try{const value=JSON.parse(raw||'[]'),allowed=new Set(allowedIds);return Array.isArray(value)?[...new Set(value.filter(id=>typeof id==='string'&&allowed.has(id)))].slice(0,MAX_ITINERARY_PLACES):[];}catch{return [];}}
export function reorderItinerary(ids,id,direction){const result=[...ids],index=result.indexOf(id),next=index+direction;if(index>=0&&[-1,1].includes(direction)&&next>=0&&next<result.length)[result[index],result[next]]=[result[next],result[index]];return result;}
export const removeFromItinerary=(ids,id)=>ids.filter(value=>value!==id);
const fields = new Set(['requestedDate','groupSize','durationPreference','heritagePlaceIds','customerName','email','phone','transportPreference','specialRequirements','notes']);
const trim = (value,max) => typeof value === 'string' ? value.trim().slice(0,max) : '';
export function validateQuoteInput(input, places, {today = new Date().toISOString().slice(0,10)} = {}) {
  const errors=[];
  if(!input || Array.isArray(input) || typeof input !== 'object')return {errors:['A quote request must be an object.']};
  if(Object.keys(input).some(key=>!fields.has(key)))errors.push('Only visitor request fields are accepted.');
  const allowed = new Set(places.filter(eligibleTourPlace).map(place=>place.id));
  const ids=Array.isArray(input.heritagePlaceIds)?input.heritagePlaceIds:[];
  if(!ids.length || ids.length>MAX_ITINERARY_PLACES || new Set(ids).size!==ids.length || ids.some(id=>typeof id!=='string'||!allowed.has(id))) errors.push(`Select between 1 and ${MAX_ITINERARY_PLACES} distinct available heritage places.`);
  const requestedDate=trim(input.requestedDate,10);
  if(input.requestedDate!=null&&(typeof input.requestedDate!=='string'||input.requestedDate.length>10))errors.push('Preferred date must be a date-only value.');
  if(requestedDate && (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)||Number.isNaN(Date.parse(requestedDate))||new Date(requestedDate).toISOString().slice(0,10)!==requestedDate||requestedDate<today))errors.push('Choose a valid preferred date today or later, or leave it open.');
  const groupSize=Number(input.groupSize);
  if(!Number.isInteger(groupSize)||groupSize<1||groupSize>200)errors.push('Guest count must be a whole number from 1 to 200.');
  for(const [key,max] of Object.entries({customerName:120,email:254,phone:40,durationPreference:120,transportPreference:120,specialRequirements:1500,notes:3000}))if(input[key]!=null&&(typeof input[key]!=='string'||input[key].length>max))errors.push(`${key} exceeds the supported text limit.`);
  const value={requestedDate:requestedDate||null,groupSize,durationPreference:trim(input.durationPreference,120),heritagePlaceIds:[...ids],customerName:trim(input.customerName,120),email:trim(input.email,254),phone:trim(input.phone,40),transportPreference:trim(input.transportPreference,120),specialRequirements:trim(input.specialRequirements,1500),notes:trim(input.notes,3000)};
  if(value.customerName.length<2)errors.push('Enter a contact name.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))errors.push('Enter a valid email address.');
  if(!/^[+()\d\s.-]{7,40}$/.test(value.phone))errors.push('Enter a phone or WhatsApp number.');
  if(!value.durationPreference)errors.push('Enter a duration preference.');
  return {errors,value};
}
export function validateQuoteAdminPatch(input) {
  const errors=[],value={};
  if(!input||Array.isArray(input)||typeof input!=='object')return {errors:['Invalid update.']};
  if(Object.keys(input).some(key=>!['status','internalNotes','quotedAmount','quoteCurrency'].includes(key)))errors.push('Unsupported admin field.');
  if('status' in input){if(!QUOTE_STATUSES.includes(input.status))errors.push('Invalid quote status.');else value.status=input.status;}
  if('internalNotes' in input){if(typeof input.internalNotes!=='string'||input.internalNotes.length>10000)errors.push('Internal notes must be text, up to 10,000 characters.');else value.internalNotes=input.internalNotes.trim();}
  if('quotedAmount' in input){const amount=input.quotedAmount;if(amount!==null&&(typeof amount!=='number'||!Number.isFinite(amount)||amount<0||amount>100000000))errors.push('Manual quote amount is invalid.');else value.quotedAmount=amount;}
  if('quoteCurrency' in input){if(!/^[A-Z]{3}$/.test(input.quoteCurrency))errors.push('Use a three-letter currency code.');else value.quoteCurrency=input.quoteCurrency;}
  return {errors,value};
}
