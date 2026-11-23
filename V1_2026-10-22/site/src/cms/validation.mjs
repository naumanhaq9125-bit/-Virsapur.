import { isValidDateTime } from '../input-validation.mjs';
const allowedStatuses = new Set(["draft", "review", "published", "archived"]);

// Route/collection identity determines shape, never the untrusted submitted value.
export function validateContentInput(name,value) {
  return ['site','homepage'].includes(name)?validateSingleton(name,value):validateCollection(name,value);
}

export function validateHeritageComponents(record) {
  if(record.components===undefined)return []; // Incomplete drafts remain allowed by the shared provider.
  if(!Array.isArray(record.components))return [`${record.id}: components must be a list.`];
  const errors=[];
  for(const component of record.components){
    if(!component||typeof component!=='object'||Array.isArray(component)){errors.push(`${record.id}: invalid heritage component.`);continue;}
    const label=component.name||component.id||record.id;
    const missingLatitude=component.latitude==null,missingLongitude=component.longitude==null;
    if(missingLatitude&&missingLongitude){if(component.coordinateStatus!=='missing-at-source')errors.push(`${label}: missing coordinates must be explicitly marked missing-at-source.`);continue;}
    if(missingLatitude||missingLongitude||!Number.isFinite(component.latitude)||!Number.isFinite(component.longitude)||Math.abs(component.latitude)>90||Math.abs(component.longitude)>180)errors.push(`${label}: latitude and longitude must both be finite numbers within -90..90 and -180..180.`);
  }
  return errors;
}

export function validateCollection(name, value) {
  const errors = [];
  if (!Array.isArray(value)) return [`${name} must be an array.`];
  const ids = new Set();
  const slugs = new Set();
  for (const record of value) {
    if (!record || typeof record !== "object" || Array.isArray(record)) { errors.push(`${name} contains an invalid record.`); continue; }
    if (!record.id) errors.push("Every record needs a stable ID.");
    else if (ids.has(record.id)) errors.push(`Duplicate ID: ${record.id}`);
    else ids.add(record.id);
    if (record.demo === true) errors.push(`${record.id || "Record"}: demo records cannot enter canonical content.`);
    if (!allowedStatuses.has(record.status || "draft")) errors.push(`${record.id || "Record"}: invalid workflow state.`);
    if (record.slug) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) errors.push(`${record.title || record.id}: slug must use lowercase words and hyphens.`);
      if (slugs.has(record.slug)) errors.push(`Duplicate slug: ${record.slug}`);
      slugs.add(record.slug);
    }
    if(record.seo?.noindex!==undefined && typeof record.seo.noindex!=='boolean')errors.push(`${record.id}: SEO noindex must be a boolean.`);
    if(name==='heritagePlaces' && record.mapDisplay!==undefined && !['featured','listed'].includes(record.mapDisplay))errors.push(`${record.id}: mapDisplay must be featured or listed.`);
    if(name==='heritagePlaces')errors.push(...validateHeritageComponents(record));
    if(name==='stories'){
      if(record.body!==undefined&&!Array.isArray(record.body))errors.push(`${record.id}: article body must be structured blocks.`);
      const validCategories=Array.isArray(record.categoryIds)&&record.categoryIds.every(id=>typeof id==='string'&&id.trim().length>0);
      if(record.categoryIds!==undefined&&!validCategories)errors.push(`${record.id}: categoryIds must be a list of non-empty string IDs.`);
      if(record.primaryCategoryId!==undefined&&typeof record.primaryCategoryId!=='string')errors.push(`${record.id}: primaryCategoryId must be a string ID.`);
      if(record.primaryCategoryId && (!validCategories||!record.categoryIds.includes(record.primaryCategoryId)))errors.push(`${record.id}: the primary category must be selected in categories.`);
      if(record.references!==undefined&&!Array.isArray(record.references))errors.push(`${record.id}: references must be a list.`);
      for(const reference of Array.isArray(record.references)?record.references:[])if(typeof reference!=='string'&&(!reference||typeof reference!=='object'||!/^https?:\/\//.test(reference.url||'')||!reference.title))errors.push(`${record.id}: a reference requires a title and HTTP(S) source URL.`);
    }
    if(name==='programmes' && record.tour && (!['quote','enquiry','scheduled'].includes(record.tour.bookingMode||'quote')||typeof record.tour.enabled!=='boolean'))errors.push(`${record.id}: invalid tour configuration.`);
    if(name==='events'&&record.scheduleType==='heritage-trip'){
      if(record.registrationState!==undefined&&!['draft','open','closed','cancelled'].includes(record.registrationState))errors.push(`${record.id}: invalid trip registration state.`);
      for(const field of ['start','end'])if(record[field]!==undefined&&record[field]!==''&&!isValidDateTime(record[field]))errors.push(`${record.id}: ${field} must be a valid date and time.`);
      if(record.relatedHeritageIds!==undefined&&(!Array.isArray(record.relatedHeritageIds)||record.relatedHeritageIds.some(id=>typeof id!=='string'||!id.trim())))errors.push(`${record.id}: trip destinations must be a list of place IDs.`);
      if(record.officialTrip!==undefined&&(!record.officialTrip||typeof record.officialTrip!=='object'||Array.isArray(record.officialTrip)))errors.push(`${record.id}: trip preferences must be an object.`);
      const budget=record.officialTrip?.budget,travelers=record.officialTrip?.travelerCount;
      if(record.capacity!==null&&record.capacity!==undefined&&(!Number.isInteger(Number(record.capacity))||Number(record.capacity)<1||Number(record.capacity)>100000))errors.push(`${record.id}: available seats must be a whole number from 1 to 100,000, or left blank for unlimited seats.`);
      if(budget!==null&&budget!==undefined&&(!Number.isFinite(Number(budget))||Number(budget)<0))errors.push(`${record.id}: trip budget must be zero or greater.`);
      if(travelers!==null&&travelers!==undefined&&(!Number.isInteger(Number(travelers))||Number(travelers)<1||Number(travelers)>100))errors.push(`${record.id}: traveler count must be between 1 and 100.`);
      const seatPrice=record.commerce?.amount;
      if(seatPrice!==null&&seatPrice!==undefined&&(!Number.isFinite(Number(seatPrice))||Number(seatPrice)<0||Number(seatPrice)>999999.99||Math.abs(Number(seatPrice)*100-Math.round(Number(seatPrice)*100))>1e-6))errors.push(`${record.id}: seat price must be a PKR amount with at most two decimal places.`);
      if(record.commerce?.currency!==undefined&&record.commerce.currency!=='PKR')errors.push(`${record.id}: official trip seat prices must use PKR.`);
      if(record.start&&record.end&&isValidDateTime(record.start)&&isValidDateTime(record.end)&&Date.parse(record.end)<=Date.parse(record.start))errors.push(`${record.id}: trip end must be after trip start.`);
    }
    if(record.productionCleared===true&&name==='media'&&(!(record.license||record.licence)||!record.sourceUrl||!(record.credit||record.creator)))errors.push(`${record.id}: clearance requires licence, source and credit.`);
    if(record.status==='published')errors.push(...validateForPublish(name,record).map(error=>`${record.id}: ${error}`));
  }
  return errors;
}

export function validateSingleton(name, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [`${name} must be an object.`];
  if (name === "site" && (!Array.isArray(value.navigation)||!value.navigation.some(item => item?.id === "home" && item.visible !== false && item.route === "/"))) return ["Home is protected and must remain visible at /. "];
  return [];
}

export function validateForPublish(collection, record) {
  const required = collection === "stories" ? ["title", "slug", "summary", "primaryCategoryId", "categoryIds", "seo", "body"]
    : collection === "archiveCategories" ? ["title", "slug", "summary", "description", "featuredImage", "seo"]
    : collection === "collaborators" ? ["name", "logo"]
    : collection === "projects" ? ["title", "slug", "summary", "featuredImage", "seo", "body"]
    : collection === "events" ? ["title", "slug", "summary", "programmeId", "start", "registrationState", "location"]
    : collection === 'people' ? ['name','role','biography']
    : collection === 'testimonials' ? ['quote','attribution']
    : collection === 'media' ? ['src','alt'] : ["title", "slug", "summary"];
  const errors = required.filter(field => !record?.[field] || (Array.isArray(record[field]) && !record[field].length)).map(field => `${field} is required before publishing.`);
  if (["stories", "archiveCategories"].includes(collection) && record?.featuredImage && !record.featuredImage.alt) errors.push("Image alt text is required before publishing.");
  if (["stories", "projects", "archiveCategories"].includes(collection) && (!record?.seo?.title || !record?.seo?.description)) errors.push("SEO title and description are required before publishing.");
  if (record?.demo === true) errors.push("Demo records cannot be published.");
  if(collection==='stories' && record?.editorialReviewRequired===true)errors.push('Complete editorial review before publishing this article.');
  if(collection==='stories' && record?.aiAssisted===true && !record?.references?.length)errors.push('AI-assisted articles require factual references before publishing.');
  if(collection==='events'&&record?.scheduleType==='heritage-trip'){
    if(!record.end)errors.push('An end date and time is required for an official trip.');
    if(!Array.isArray(record.relatedHeritageIds)||!record.relatedHeritageIds.length)errors.push('Select at least one heritage destination for the official trip.');
    if(!record.officialTrip?.transportation)errors.push('Choose transportation for the official trip.');
    if(!record.officialTrip?.tripType)errors.push('Choose a trip type for the official trip.');
    if(!record.officialTrip?.travelPace)errors.push('Choose a travel pace for the official trip.');
  }
  return errors;
}
