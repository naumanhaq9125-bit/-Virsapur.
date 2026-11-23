// Provider-neutral public/editorial content contract. Private operational tables are never collections.
import {createHash} from 'node:crypto';
export const CONTENT_FILES = Object.freeze({site:'site',homepage:'homepage',archiveCategories:'archive-categories',collaborators:'collaborators',programmes:'programmes',stories:'stories',projects:'projects',events:'events',people:'people',testimonials:'testimonials',media:'media',heritagePlaces:'heritage-places'});
export const CONTENT_SINGLETONS = Object.freeze(['site','homepage']);
export const CONTENT_COLLECTIONS = Object.freeze(Object.keys(CONTENT_FILES).filter(name=>!CONTENT_SINGLETONS.includes(name)));
const forbidden = /^(?:password|secret|apikey|privatekey|servicerolekey|supabasesecretkey|supabaseservicerolekey|accesstoken|refreshtoken|authorization|cookie|vercelapitoken)$/i;
export function assertNoContentSecrets(value,path='content') {
  if(!value||typeof value!=='object')return;
  for(const [key,child]of Object.entries(value)){
    if(forbidden.test(key.replace(/[^a-z0-9]/gi,'')) && child)throw new Error(`Content export blocked: secret-like field at ${path}.${key}.`);
    assertNoContentSecrets(child,`${path}.${key}`);
  }
}
export function createContentExport(content,{source='content/data',fixtureIds=[],exportedAt=new Date().toISOString()}={}) {
  const blocked=new Set(fixtureIds),ids=new Set();
  const singletons=Object.fromEntries(CONTENT_SINGLETONS.map(name=>{if(!content[name]||Array.isArray(content[name])||typeof content[name]!=='object')throw new Error(`Missing singleton: ${name}`);return [name,content[name]];}));
  const records=CONTENT_COLLECTIONS.flatMap(collection=>{
    if(!Array.isArray(content[collection]))throw new Error(`Missing collection: ${collection}`);
    return content[collection].map(data=>{
      if(typeof data?.id!=='string'||!data.id||ids.has(data.id))throw new Error('Content export requires unique stable record IDs.');
      if(!['draft','review','published','archived'].includes(data.status||'draft'))throw new Error('Content export contains an invalid workflow state.');
      if(data.demo===true||blocked.has(data.id))throw new Error('Content export blocked: demo fixture detected.');
      ids.add(data.id);return {collection,id:data.id,slug:data.slug||null,status:data.status||'draft',data};
    });
  });
  assertNoContentSecrets({singletons,records});
  const canonical=JSON.stringify({singletons,records});
  return {format:'virsapur-content-export/v1',exportedAt,source,excludes:['content/fixtures','studio-data','custom_tour_quote_requests','mock orders','authentication data','secrets','environment configuration'],counts:{singletons:CONTENT_SINGLETONS.length,records:records.length,byCollection:Object.fromEntries(CONTENT_COLLECTIONS.map(name=>[name,content[name].length])),byStatus:records.reduce((out,r)=>(out[r.status]=(out[r.status]||0)+1,out),{})},checksum:`sha256:${createHash('sha256').update(canonical).digest('hex')}`,singletons,records};
}
export function createWorkingSeedSql(bundle) {
  if(bundle.format!=='virsapur-content-export/v1')throw new Error('Unsupported content bundle.');
  if(bundle.records.some(r=>!CONTENT_COLLECTIONS.includes(r.collection)))throw new Error('Seed contains an unsupported collection.');
  if(bundle.records.some(r=>!['draft','review','published','archived'].includes(r.status)||r.id!==r.data?.id||r.data?.demo===true))throw new Error('Seed contains invalid or demo records.');
  if(Object.keys(bundle.singletons).some(k=>!CONTENT_SINGLETONS.includes(k)))throw new Error('Seed contains an unsupported singleton.');
  assertNoContentSecrets(bundle);
  const literal=value=>`'${String(value).replace(/'/g,"''")}'`;
  const json=value=>`${literal(JSON.stringify(value))}::jsonb`;
  const lines=['-- UNAPPLIED working-content seed. No live snapshots, users, secrets, quotes or payment data.','-- Existing rows are never overwritten. Explicit owner-reviewed publication remains required.','begin;'];
  for(const [key,data]of Object.entries(bundle.singletons))lines.push(`insert into public.cms_singletons(key,status,data) values(${literal(key)},'draft',${json(data)}) on conflict(key) do nothing;`);
  for(const r of bundle.records)lines.push(`insert into public.cms_records(collection,id,slug,status,data) values(${literal(r.collection)},${literal(r.id)},${r.slug?literal(r.slug):'null'},${literal(r.status)},${json(r.data)}) on conflict(collection,id) do nothing;`);
  lines.push('commit;');return lines.join('\n')+'\n';
}
