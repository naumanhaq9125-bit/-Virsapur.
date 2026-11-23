// Exact editorial relationships. Geography is deliberately not consulted here.
export const isEligibleHeritagePlace = record => record.status === 'published' && record.recordType === 'place' && record.heritageDomain === 'cultural-tangible';
export const heritagePath = record => `/archives/place/${record.slug}`;
export function validateHeritageIds(record, heritageRecords) {
  const value = record.relatedHeritageIds;
  if (value === undefined) return []; // Existing canonical records require no migration.
  const label = record.title || record.id || 'Record';
  if (!Array.isArray(value)) return [`${label}: related Heritage Places must be a list.`];
  const known = new Set(heritageRecords.map(place => place.id)), seen = new Set(), errors = [];
  for (const id of value) {
    if (typeof id !== 'string') { errors.push(`${label}: every related Heritage Place ID must be a string.`); continue; }
    if (!known.has(id)) errors.push(`${label}: unknown Heritage Place “${id}”. Choose an existing record.`);
    if (seen.has(id)) errors.push(`${label}: duplicate Heritage Place “${id}”. Remove the duplicate selection.`);
    seen.add(id);
  }
  return errors;
}
export function resolveHeritage(record, places) {
  const byId = new Map(places.filter(isEligibleHeritagePlace).map(place => [place.id, place]));
  return (record.relatedHeritageIds || []).map(id => byId.get(id)).filter(Boolean);
}
export function deriveHeritageRelations({stories=[],programmes=[],projects=[],events=[]}, places, {preview=false}={}) {
  const visible = record => record.status === 'published' ? (preview || !record.demo) : preview && ['draft','review'].includes(record.status);
  const result = new Map(places.filter(isEligibleHeritagePlace).map(place => [place.id,{stories:[],programmes:[],projects:[],events:[]}])) ;
  const parentById = new Map(programmes.filter(visible).map(record => [record.id,record]));
  for(const [kind,records] of Object.entries({stories,programmes,projects,events})) for(const record of records.filter(visible)) {
    const inherited = kind === 'events' ? parentById.get(record.programmeId)?.relatedHeritageIds || [] : [];
    for(const id of new Set([...(record.relatedHeritageIds || []),...inherited])) if(result.has(id)) result.get(id)[kind].push(record);
  }
  return result;
}
export const isUpcomingHeritageOccurrence = (event,now=Date.now()) => event.status === 'published' && ['open','closed'].includes(event.registrationState) && Number.isFinite(Date.parse(event.end || event.start)) && Date.parse(event.end || event.start) >= now;

// Existing route-aware URL semantics, shared by templates and search tests.
export function routeHref(route,target) {
  const [raw,hash=''] = String(target).split('#');
  const [path,query=''] = raw.split('?');
  const clean=path.replace(/^\//,'');
  return `${'../'.repeat(route.split('/').filter(Boolean).length)}${clean?`${clean}/`:''}index.html${query?`?${query}`:''}${hash?`#${hash}`:''}`;
}
export function searchableRecords({stories=[],projects=[],programmes=[],events=[],places=[]}, locationText=()=> '') {
  const ordinary=[...stories,...projects,...programmes,...events].map(record=>{
    const type=record.type || 'programme';
    const path=type==='story'?`/archives/${record.slug}`:type==='project'?`/projects/${record.slug}`:type==='occurrence'?`/whats-on#${record.slug}`:`/service/${record.slug}`;
    return {id:record.id,title:record.title,summary:record.summary||'',type,typeLabel:type,slug:record.slug,path,searchText:[record.province,record.district,record.location,...(record.tags||[]),...(record.categoryIds||[])].filter(Boolean).join(' ')};
  });
  return [...ordinary,...places.filter(isEligibleHeritagePlace).map(place=>({id:place.id,title:place.title,summary:place.summary||'',type:'heritage-place',typeLabel:'Heritage Place',slug:place.slug,path:heritagePath(place),searchText:[place.title,place.shortTitle,...(place.aliases||[]),place.summary,place.heritageCategory,place.designationName,locationText(place)].filter(Boolean).join(' ')}))].map(record=>({...record,url:routeHref('/search',record.path)}));
}
