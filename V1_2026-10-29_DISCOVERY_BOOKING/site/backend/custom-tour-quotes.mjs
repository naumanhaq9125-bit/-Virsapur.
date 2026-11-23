// Dormant hosted transport. Local Studio deliberately does not import or call this module.
import {randomUUID} from 'node:crypto';
import {cmsConfig} from '../src/cms/config.mjs';
import {createSupabaseProvider} from '../src/cms/providers/supabase.mjs';
import {QUOTE_STATUSES,MAX_ITINERARY_PLACES,tourOrigin,validateQuoteInput,validateQuoteAdminPatch} from '../src/tour-contract.mjs';
import {json,methodNotAllowed,requireAdmin,requireMutationProtection,requireSameOrigin,enforceRateLimit} from '../api/_lib/http.js';

export const hostedQuotesEnabled=env=>env.PRODUCTION_CMS_ENABLED==='true'&&env.CUSTOM_TOUR_QUOTES_ENABLED==='true';
const failure=(message,status)=>Object.assign(new Error(message),{status});
const safeError=error=>json({ok:false,error:error.status>=400&&error.status<500?error.message:'The request could not be completed.'},error.status>=400&&error.status<500?error.status:500);
const integer=(value,fallback,max)=>Math.min(max,Math.max(1,value!==null&&value!==''&&Number.isSafeInteger(Number(value))?Number(value):fallback));
const quoteRecord=row=>({...row.request_data,id:row.id,createdAt:row.created_at,updatedAt:row.updated_at,origin:row.origin,status:row.status,internalNotes:row.internal_notes,quotedAmount:row.quoted_amount,quoteCurrency:row.quote_currency,environment:'hosted'});

export async function readQuoteJson(request,maxBytes=32768) {
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))throw failure('Send application/json.',415);
  if(Number(request.headers.get('content-length'))>maxBytes)throw failure('Request is too large.',413);
  if(!request.body)throw failure('A request body is required.',400);
  const reader=request.body.getReader(),chunks=[];let size=0;
  try{
    for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw failure('Request is too large.',413);}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  }catch(error){if(error.status)throw error;throw failure('Invalid JSON body.',400);}
}

export function createHostedQuoteHandlers({env=process.env,fetch=globalThis.fetch,admin=requireAdmin,mutation=requireMutationProtection,sameOrigin=requireSameOrigin,rateLimit=enforceRateLimit}={}) {
  const unavailable=()=>json({ok:false,error:'Not found.'},404);
  const provider=()=>createSupabaseProvider({config:cmsConfig(env),fetch});
  return {
    async publicRequest(request) {
      if(!hostedQuotesEnabled(env))return unavailable();
      if(request.method!=='POST')return methodNotAllowed(['POST']);
      try {
        sameOrigin(request);
        if(request.headers.get('sec-fetch-site')==='cross-site')throw failure('Cross-origin request blocked.',403);
        const input=await readQuoteJson(request);
        const initial=validateQuoteInput(input,[]);
        if(initial.errors.includes('Only visitor request fields are accepted.'))throw failure('Only visitor request fields are accepted.',422);
        const ids=input?.heritagePlaceIds;
        if(!Array.isArray(ids)||!ids.length||ids.length>MAX_ITINERARY_PLACES||ids.some(id=>typeof id!=='string'||! /^[a-zA-Z0-9_-]{1,160}$/.test(id)))throw failure('Select valid heritage place IDs.',422);
        await rateLimit(request,'custom-tour-quotes',5,3600);
        const cms=provider();
        const [places,site]=await Promise.all([
          cms.request('/rest/v1/cms_live_snapshots',{query:{select:'data',content_kind:'eq.record',collection:'eq.heritagePlaces',record_id:`in.(${ids.join(',')})`,limit:String(MAX_ITINERARY_PLACES)}}),
          cms.request('/rest/v1/cms_live_snapshots',{query:{select:'data',content_kind:'eq.singleton',collection:'eq.singletons',record_id:'eq.site',limit:'1'}})
        ]);
        const checked=validateQuoteInput(input,places.map(row=>row.data));
        if(checked.errors.length)throw failure(checked.errors.join(' '),422);
        const id='VQ-'+randomUUID(),now=new Date().toISOString();
        await cms.request('/rest/v1/custom_tour_quote_requests',{method:'POST',headers:{Prefer:'return=minimal'},body:{id,request_data:checked.value,origin:tourOrigin(site[0]?.data||{}),status:'new',internal_notes:'',quoted_amount:null,quote_currency:'PKR',created_at:now,updated_at:now}});
        return json({ok:true,receipt:{id,createdAt:now,environment:'hosted'}},201);
      }catch(error){return safeError(error);}
    },
    async adminRequest(request) {
      if(!hostedQuotesEnabled(env))return unavailable();
      if(!['GET','PATCH'].includes(request.method))return methodNotAllowed(['GET','PATCH']);
      try {
        const session=await admin(request,['owner','editor']);
        const cms=provider(),url=new URL(request.url);
        if(request.method==='GET'){
          const pageSize=integer(url.searchParams.get('pageSize'),20,50);
          let page=integer(url.searchParams.get('page'),1,100000);
          const status=url.searchParams.get('status')||'';
          if(status&&!QUOTE_STATUSES.includes(status))throw failure('Invalid quote status.',422);
          const q=(url.searchParams.get('q')||'').trim();
          if(q.length>200)throw failure('Search is too long.',422);
          // PostgREST wildcard characters are removed; the search remains data, never an or/filter expression.
          const search=q.replace(/[\\%_*]/g,'');
          const query={select:'id,request_data,origin,status,internal_notes,quoted_amount,quote_currency,created_at,updated_at',order:'created_at.desc,id.desc',limit:String(pageSize),offset:String((page-1)*pageSize),...(status?{status:`eq.${status}`}:{}),...(search?{search_text:`ilike.*${search}*`}:{})};
          // Count at offset zero first: PostgREST may reject an out-of-range offset with 416.
          const counted=await cms.request('/rest/v1/custom_tour_quote_requests',{query:{...query,select:'id',offset:'0',limit:'1'},headers:{Prefer:'count=exact'},includeResponseMeta:true});
          const count=counted.contentRange?.split('/')[1];
          if(!/^\d+$/.test(count||''))throw failure('Quote pagination count is unavailable.',503);
          const total=Number(count),pages=Math.max(1,Math.ceil(total/pageSize));
          page=Math.min(page,pages);query.offset=String((page-1)*pageSize);
          const rows=total?await cms.request('/rest/v1/custom_tour_quote_requests',{query}):[];
          return json({ok:true,items:rows.map(quoteRecord),total,page,pages,pageSize});
        }
        mutation(request);
        const id=url.searchParams.get('id')||'';
        if(!/^VQ-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw failure('Invalid quote ID.',422);
        const checked=validateQuoteAdminPatch(await readQuoteJson(request));
        if(checked.errors.length||!Object.keys(checked.value).length)throw failure(checked.errors.join(' ')||'An admin update is required.',422);
        const columns={status:'status',internalNotes:'internal_notes',quotedAmount:'quoted_amount',quoteCurrency:'quote_currency'};
        const body={updated_at:new Date().toISOString(),updated_by:session.user.id,...Object.fromEntries(Object.entries(checked.value).map(([key,value])=>[columns[key],value]))};
        const rows=await cms.request('/rest/v1/custom_tour_quote_requests',{method:'PATCH',query:{id:`eq.${id}`},body,headers:{Prefer:'return=representation'}});
        if(!rows.length)throw failure('Quote request not found.',404);
        return json({ok:true,item:quoteRecord(rows[0])});
      }catch(error){return safeError(error);}
    }
  };
}
