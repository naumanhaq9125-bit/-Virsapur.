import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, normalize, resolve, relative, isAbsolute } from "node:path";
import { createRequire } from "node:module";
import { prepareHeritageRecords } from "../src/heritage-spatial.mjs";
import {validateHeritageIds} from "../src/heritage-relations.mjs";
import {loadHeritageContext} from "../src/heritage-context.mjs";
import {createQuoteStore} from './quote-store.mjs';
import {createSavedArticlesStore} from './saved-articles-store.mjs';
import {createMemberAuthStore} from './member-auth-store.mjs';
import {createTripBookingStore} from './trip-booking-store.mjs';
import {createBookingMailer} from './booking-mailer.mjs';
import {validateContentInput} from '../src/cms/validation.mjs';
import {isValidDateOnly,isValidPersonName} from '../src/input-validation.mjs';
import Stripe from 'stripe';

const root = decodeURIComponent(new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
try { process.loadEnvFile(join(root,".env")); } catch(error) { if(error.code!=="ENOENT") throw error; }
const studioRoot = join(root, "studio");
const previewRoot = join(root, "dist-demo");
const productionRoot = join(root, "dist-production");
const contentRoot = join(root, "content", "data");
const runtimeRoot = resolve(process.env.STUDIO_DATA_DIR || join(root, "studio-data"));
const revisionsRoot = join(runtimeRoot, "revisions");
const ordersFile = join(runtimeRoot, "mock-orders.json");
const localProductionStatusFile = join(runtimeRoot, "local-production.json");
const quoteStore=createQuoteStore(join(runtimeRoot,'custom-tour-quotes.sqlite'),{legacyFile:join(runtimeRoot,'custom-tour-quote-requests.json'),loadPlaces:async()=>JSON.parse(await readFile(join(contentRoot,'heritage-places.json'),'utf8')),loadSite:async()=>JSON.parse(await readFile(join(contentRoot,'site.json'),'utf8'))});
const port = Number(process.env.STUDIO_PORT || 4173);
const host = "127.0.0.1";
const localProductionOrigin = `http://${host}:${port}/production`;
const studioDataMode = process.env.STUDIO_DATA_MODE || "local";
const productionCmsEnabled = process.env.PRODUCTION_CMS_ENABLED === "true";
const productionAdminOrigin = String(process.env.PRODUCTION_ADMIN_ORIGIN || process.env.SITE_ORIGIN || "").replace(/\/$/, "");
if(!["local","production"].includes(studioDataMode))throw new Error("STUDIO_DATA_MODE must be local or production.");
if(studioDataMode==="production"&&!productionCmsEnabled)throw new Error("Production Studio is unavailable while PRODUCTION_CMS_ENABLED is not true. Local Studio remains available with STUDIO_DATA_MODE=local.");
if(studioDataMode==="production"&&!productionAdminOrigin)throw new Error("STUDIO_DATA_MODE=production requires PRODUCTION_ADMIN_ORIGIN or SITE_ORIGIN.");
const allowedContent = new Set(["site","homepage","archiveCategories","collaborators","stories","projects","programmes","events","people","testimonials","media","heritagePlaces"]);
const mime = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".json":"application/json; charset=utf-8", ".webp":"image/webp", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".png":"image/png", ".svg":"image/svg+xml", ".xml":"application/xml; charset=utf-8", ".txt":"text/plain; charset=utf-8", ".geojson":"application/geo+json" };

await mkdir(revisionsRoot,{recursive:true});
const savedArticlesStore=createSavedArticlesStore(join(runtimeRoot,'saved-articles.sqlite'));
const memberAuthStore=createMemberAuthStore(join(runtimeRoot,'member-accounts.sqlite'));
const tripBookingStore=createTripBookingStore(join(runtimeRoot,'official-trip-bookings.sqlite'));
const bookingMailer=createBookingMailer();
const stripe=process.env.STRIPE_SECRET_KEY?new Stripe(process.env.STRIPE_SECRET_KEY):null;
const stripePaymentsEnabled=process.env.PAYMENT_MODE==='stripe'&&Boolean(stripe)&&Boolean(process.env.STRIPE_WEBHOOK_SECRET);
const tripBookingAttempts=new Map();
mime['.mjs']='text/javascript; charset=utf-8';
try { await stat(ordersFile); } catch { await writeFile(ordersFile,"[]\n"); }

const json = (res,status,data) => { res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}); res.end(JSON.stringify(data,null,2)); };
const cookie = (req,name) => { const entry=String(req.headers.cookie||'').split(';').map(part=>part.trim()).find(part=>part.startsWith(`${name}=`));if(!entry)return '';try{return decodeURIComponent(entry.slice(name.length+1));}catch{return '';}};
const sessionCookieName='virsapur_session';
const setSessionCookie=(req,res,token,maxAge)=>{const secure=req.socket.encrypted?' Secure':'';const persistent=maxAge==null?'':` Max-Age=${maxAge}`;res.setHeader('Set-Cookie',`${sessionCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${persistent}${secure}`);};
const clearSessionCookie=(req,res)=>{const secure=req.socket.encrypted?' Secure':'';res.setHeader('Set-Cookie',`${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);};
const authenticatedUser=req=>memberAuthStore.getSession(cookie(req,sessionCookieName));
const body = (req,limit=15_000_000) => new Promise((resolveBody,reject) => { let size=0,chunks=[],failed=false;req.on('data',chunk=>{size+=chunk.length;if(size>limit){if(!failed){failed=true;chunks=[];const error=Error('Request too large');error.statusCode=413;reject(error);}return;}if(!failed)chunks.push(chunk);});req.on('end',()=>{if(failed)return;try{resolveBody(chunks.length?JSON.parse(Buffer.concat(chunks).toString('utf8')):{});}catch{const error=Error('Invalid JSON request');error.statusCode=400;reject(error);}});req.on('error',reject);});
const rawBody = (req,limit=1_000_000) => new Promise((resolveBody,reject) => { let size=0,chunks=[];req.on('data',chunk=>{size+=chunk.length;if(size>limit){const error=Error('Request too large');error.statusCode=413;reject(error);req.destroy();return;}chunks.push(chunk);});req.on('end',()=>resolveBody(Buffer.concat(chunks)));req.on('error',reject);});
const contentFiles={archiveCategories:"archive-categories",heritagePlaces:"heritage-places"};
const safeContentPath = name => { if(!allowedContent.has(name)) throw new Error("Unknown content collection"); return join(contentRoot,`${contentFiles[name]||name}.json`); };
const timestamp = () => new Date().toISOString().replace(/[:.]/g,"-");
async function atomicJson(path,value){const temp=`${path}.${process.pid}.tmp`;await writeFile(temp,`${JSON.stringify(value,null,2)}\n`,"utf8");await rename(temp,path);}
async function revise(name,path){try{await copyFile(path,join(revisionsRoot,`${timestamp()}--${name}.json`));}catch{} }
function validate(name,value,heritageRecords=[]){
  const errors=validateContentInput(name,value); if(errors.length)return errors;
  if(Array.isArray(value)){
    const slugs=new Set(); for(const record of value){
      if(["stories","projects","programmes","events"].includes(name))errors.push(...validateHeritageIds(record,heritageRecords));
      if(!record.id)errors.push("Every record needs a stable ID.");
      if(record.slug){if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug))errors.push(`${record.title||record.id}: slug must use lowercase words and hyphens.`);if(slugs.has(record.slug))errors.push(`Duplicate slug: ${record.slug}`);slugs.add(record.slug);}
      if(name==="heritagePlaces"){
        for(const field of ["title","slug","recordType","heritageDomain","designationType","sourceAuthority","sourceUrl"])if(!record[field])errors.push(`${record.title||record.id}: ${field} is required.`);
        if(!Array.isArray(record.components)||!record.components.length)errors.push(`${record.title||record.id}: at least one component is required.`);
        for(const component of record.components||[]){
          if(!component.id||!component.name)errors.push(`${record.title||record.id}: every component needs an ID and name.`);
        }
      }
      if(record.status==="published"){
        const fields=name==="stories"?["title","slug","summary","primaryCategoryId","categoryIds","seo","body"]:name==="archiveCategories"?["title","slug","summary","description","featuredImage","seo"]:name==="collaborators"?["name","logo"]:name==="projects"?["title","slug","summary","featuredImage","seo","body"]:name==="events"?["programmeId","start","registrationState","location"]:name==="people"?["name","role","biography"]:name==="testimonials"?["quote","attribution"]:name==="media"?["src","alt"]:["title","slug","summary"];
        for(const field of fields)if(!record[field]||(Array.isArray(record[field])&&!record[field].length))errors.push(`${record.title||record.id}: ${field} is required before publishing.`);
        if(["stories","archiveCategories"].includes(name)&&record.featuredImage&&!record.featuredImage.alt)errors.push(`${record.title||record.id}: image alt text is required before publishing.`);
        if(["stories","projects","archiveCategories"].includes(name)&&(!record.seo?.title||!record.seo?.description))errors.push(`${record.title||record.id}: SEO title and description are required before publishing.`);
      }
    }
  }
  if(name==="site"&&!value.navigation?.some(item=>item.id==="home"&&item.visible!==false&&item.route==="/"))errors.push("Home is a protected navigation item and must remain visible at /.");
  return errors;
}
function runNode(args,env={}){return new Promise((resolveRun,reject)=>{const child=spawn(process.execPath,args,{cwd:root,env:{...process.env,...env},stdio:["ignore","pipe","pipe"]});let output="";child.stdout.on("data",d=>output+=d);child.stderr.on("data",d=>output+=d);child.on("error",reject);child.on("close",code=>code?reject(new Error(output||`Process failed (${code})`)):resolveRun(output.trim()));});}
let previewBuilding=Promise.resolve();
let previewBuildGeneration=0;
let previewBuildStatus={state:"ready",startedAt:null,completedAt:null,error:null};
function rebuild(){
  const generation=++previewBuildGeneration;
  previewBuildStatus={state:"building",startedAt:new Date().toISOString(),completedAt:null,error:null};
  const job=previewBuilding.catch(()=>{}).then(()=>runNode([join(root,"build.mjs"),"--mode=demo"],{CMS_DATA_MODE:"local",PRODUCTION_CMS_ENABLED:"false",SITE_ORIGIN:localProductionOrigin}));
  previewBuilding=job;
  job.then(()=>{if(generation===previewBuildGeneration)previewBuildStatus={state:"ready",startedAt:previewBuildStatus.startedAt,completedAt:new Date().toISOString(),error:null};}).catch(error=>{if(generation===previewBuildGeneration)previewBuildStatus={state:"failed",startedAt:previewBuildStatus.startedAt,completedAt:new Date().toISOString(),error:error.message};});
  return job;
}
let productionBuilding=Promise.resolve();
function validateAllContent(){return Promise.all([...allowedContent].map(async name=>({name,value:JSON.parse(await readFile(safeContentPath(name),"utf8"))}))).then(items=>items.flatMap(({name,value})=>validate(name,value,items.find(item=>item.name==="heritagePlaces")?.value||[])));}
function publishLocalProduction(){
  productionBuilding=productionBuilding.catch(()=>{}).then(async()=>{
    const errors=await validateAllContent();if(errors.length)throw new Error(`Local Production validation failed:\n${errors.join("\n")}`);
    const candidateRoot=join(runtimeRoot,"local-production-candidate");const backupRoot=join(runtimeRoot,"local-production-previous");
    await rm(candidateRoot,{recursive:true,force:true});await rm(backupRoot,{recursive:true,force:true});
    const localEnv={CMS_DATA_MODE:"local",PRODUCTION_CMS_ENABLED:"false",PAYMENT_MODE:"disabled",SITE_ORIGIN:localProductionOrigin,VIRSAPUR_OUTPUT_DIR:candidateRoot};
    const buildOutput=await runNode([join(root,"build.mjs"),"--mode=production"],localEnv);
    const qaOutput=await runNode([join(root,"qa.mjs"),"--mode=production"],localEnv);
    const manifest=JSON.parse(await readFile(join(candidateRoot,"route-manifest.json"),"utf8"));
    let hadPrevious=true;try{await stat(productionRoot);}catch{hadPrevious=false;}
    try{
      if(hadPrevious)await rename(productionRoot,backupRoot);
      await rename(candidateRoot,productionRoot);
      if(hadPrevious)await rm(backupRoot,{recursive:true,force:true});
    }catch(error){
      try{await stat(backupRoot);await rm(productionRoot,{recursive:true,force:true});await rename(backupRoot,productionRoot);}catch{}
      throw error;
    }
    const status={publishedAt:new Date().toISOString(),origin:localProductionOrigin,routes:manifest.routes.length,indexableRoutes:manifest.routes.filter(route=>route.indexable).length,buildOutput,qaPassed:true,qaOutput};
    await atomicJson(localProductionStatusFile,status);return status;
  });
  return productionBuilding;
}
if(process.env.PAYMENT_MODE==='stripe'&&!stripePaymentsEnabled)console.warn('Stripe Checkout is not active: set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env, then restart.');
await rebuild();

function safeStatic(base,urlPath){const requested=decodeURIComponent(urlPath).replace(/^\/+/,"");const candidate=resolve(base,normalize(requested||"index.html"));const rel=relative(resolve(base),candidate);if(rel.startsWith('..')||isAbsolute(rel))throw new Error("Unsafe path");return candidate;}
async function serveStatic(res,base,urlPath){let file=safeStatic(base,urlPath);try{const info=await stat(file);if(info.isDirectory())file=join(file,"index.html");}catch{if(!extname(file))file=join(file,"index.html");}try{const data=await readFile(file);res.writeHead(200,{"content-type":mime[extname(file).toLowerCase()]||"application/octet-stream","cache-control":"no-store","x-robots-tag":"noindex, nofollow"});res.end(data);}catch{res.writeHead(404,{"content-type":"text/plain"});res.end("Not found");}}

const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,`http://${host}:${port}`); const path=url.pathname;
    const allowedHosts=new Set([`${host}:${port}`,`localhost:${port}`]);
    const isTopLevelNavigation=['GET','HEAD'].includes(req.method)&&req.headers['sec-fetch-mode']==='navigate'&&req.headers['sec-fetch-dest']==='document'&&!path.startsWith('/api/');
    if(!allowedHosts.has(req.headers.host))return json(res,403,{error:'Local Studio accepts loopback hosts only.'});
    if(req.headers.origin && ![`http://${host}:${port}`,`http://localhost:${port}`].includes(req.headers.origin)&&!isTopLevelNavigation)return json(res,403,{error:'Cross-origin requests are not allowed.'});
    if(req.headers['sec-fetch-site']==='cross-site'&&!isTopLevelNavigation)return json(res,403,{error:'Cross-site requests are not allowed.'});
    if(!['GET','HEAD','POST','PUT','PATCH','DELETE'].includes(req.method))return json(res,405,{error:'Method not allowed.'});
    if(['POST','PUT','PATCH'].includes(req.method)&&!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))return json(res,415,{error:'JSON content type required.'});
    res.setHeader('x-content-type-options','nosniff');
    if(path==='/api/stripe/webhook'&&req.method==='POST'){
      if(!stripe)return json(res,503,{ok:false,error:'Stripe is not configured on this server.'});
      if(!process.env.STRIPE_WEBHOOK_SECRET)return json(res,503,{ok:false,error:'Stripe webhook signing secret is not configured.'});
      let event;
      try{event=stripe.webhooks.constructEvent(await rawBody(req),req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET);}
      catch(error){return json(res,400,{ok:false,error:'Invalid Stripe webhook signature.'});}
      const result=tripBookingStore.processStripeEvent(event);
      if(result.newlyPaid&&result.booking){
        const events=JSON.parse(await readFile(safeContentPath('events'),'utf8'));
        const trip=events.find(item=>item.id===result.booking.tripId);
        try{await bookingMailer.sendConfirmation({...result.booking,tripStart:trip?.start||'',location:trip?.location||''});}
        catch(error){console.error('Paid booking email could not be sent:',error.code||error.message);}
      }
      return json(res,200,{received:true});
    }
    if(studioDataMode==="production"&&(path==="/"||path.startsWith("/studio"))){res.writeHead(302,{location:`${productionAdminOrigin}/admin/`,"cache-control":"no-store"});return res.end();}
    if(studioDataMode==="production"&&path.startsWith("/api/"))return json(res,503,{ok:false,error:`Production data is protected by the hosted Admin. Open ${productionAdminOrigin}/admin/ and sign in.`});
    if(path==="/"){res.writeHead(302,{location:"/studio/"});return res.end();}
    if(path==="/api/local-production-status"&&req.method==="GET"){
      try{return json(res,200,{ok:true,status:JSON.parse(await readFile(localProductionStatusFile,"utf8"))});}
      catch{try{const manifest=JSON.parse(await readFile(join(productionRoot,"route-manifest.json"),"utf8"));return json(res,200,{ok:true,status:{publishedAt:manifest.generatedAt||null,origin:localProductionOrigin,routes:manifest.routes.length,indexableRoutes:manifest.routes.filter(route=>route.indexable).length,qaPassed:null}});}catch{return json(res,200,{ok:true,status:null});}}
    }
    if(path==='/api/member-session'&&req.method==='GET'){
      const user=authenticatedUser(req);
      return user?json(res,200,{ok:true,user:{id:user.id,fullName:user.fullName,email:user.email}}):json(res,401,{ok:false,error:'Sign in to continue.'});
    }
    if(path==='/api/auth/session'&&req.method==='GET'){
      const user=authenticatedUser(req);
      return user?json(res,200,{ok:true,user}):json(res,401,{ok:false,error:'Sign in to continue.'});
    }
    if(path==='/api/trip-bookings'&&req.method==='GET'){
      const tripId=url.searchParams.get('tripId')||'';
      if(!/^[a-zA-Z0-9][a-zA-Z0-9 _.-]{0,159}$/.test(tripId))return json(res,422,{ok:false,error:'Choose a valid trip.'});
      const events=JSON.parse(await readFile(safeContentPath('events'),'utf8'));
      const trip=events.find(item=>item.id===tripId&&item.status==='published'&&item.scheduleType==='heritage-trip');
      if(!trip)return json(res,404,{ok:false,error:'This trip is not available for reservations.'});
      const remaining=tripBookingStore.available(trip.id,trip.capacity);
      const open=trip.registrationState==='open'&&Number.isFinite(Date.parse(trip.end))&&Date.parse(trip.end)>=Date.now();
      const seatPrice=Number(trip.commerce?.amount);
      const hasSeatPrice=Number.isFinite(seatPrice)&&seatPrice>0&&Math.abs(seatPrice*100-Math.round(seatPrice*100))<=1e-6&&String(trip.commerce?.currency||'PKR').toUpperCase()==='PKR';
      return json(res,200,{ok:true,availableSeats:open?remaining:0,capacity:trip.capacity??null,registrationState:open?'open':'closed',paymentRequired:process.env.PAYMENT_MODE==='stripe',paymentConfigured:stripePaymentsEnabled,checkoutEnabled:stripePaymentsEnabled&&hasSeatPrice,seatPrice:hasSeatPrice?seatPrice:null,currency:String(trip.commerce?.currency||'PKR').toUpperCase()});
    }
    if(path==='/api/trip-bookings'&&req.method==='POST'){
      const account=authenticatedUser(req);
      if(!account)return json(res,401,{ok:false,error:'Sign in to reserve seats for this trip.'});
      const ip=String(req.socket.remoteAddress||'local');const cutoff=Date.now()-60*60*1000;const attempts=(tripBookingAttempts.get(ip)||[]).filter(time=>time>cutoff);
      if(attempts.length>=8)return json(res,429,{ok:false,error:'Too many reservation attempts. Please try again later.'});
      attempts.push(Date.now());tripBookingAttempts.set(ip,attempts);
      const input=await body(req,4096);
      if(!input||Object.keys(input).some(key=>!['tripId','fullName','email','phone','seats','bookingAction'].includes(key)))return json(res,422,{ok:false,error:'Only trip reservation details can be submitted.'});
      const bookingAction=String(input.bookingAction||'request');
      if(!['request','pay'].includes(bookingAction))return json(res,422,{ok:false,error:'Choose Request to book or Pay & book.'});
      const tripId=String(input.tripId||''),fullName=String(account.fullName||input.fullName||'').trim(),email=String(account.email||'').trim().toLowerCase(),phone=typeof input.phone==='string'?input.phone.trim():'',seats=input.seats;
      if(!/^[a-zA-Z0-9][a-zA-Z0-9 _.-]{0,159}$/.test(tripId)||fullName.length<2||fullName.length>80||!isValidPersonName(fullName)||!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||email.length>254||phone.length>40||! /^[+()\d\s.-]*$/.test(phone)||!Number.isInteger(seats)||seats<1||seats>10)return json(res,422,{ok:false,error:'Check your account name, phone number and number of seats.'});
      const events=JSON.parse(await readFile(safeContentPath('events'),'utf8'));
      const trip=events.find(item=>item.id===tripId&&item.status==='published'&&item.scheduleType==='heritage-trip');
      if(!trip||trip.registrationState!=='open'||!Number.isFinite(Date.parse(trip.end))||Date.parse(trip.end)<Date.now())return json(res,409,{ok:false,error:'Reservations are closed for this trip.'});
      if(bookingAction==='pay'){
        if(process.env.PAYMENT_MODE!=='stripe')return json(res,409,{ok:false,error:'Online payment is not enabled. Choose Request to book instead.'});
        if(!stripe||!process.env.STRIPE_WEBHOOK_SECRET)return json(res,503,{ok:false,error:'Stripe Checkout needs STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env. Restart the server after setup.'});
        const amount=Number(trip.commerce?.amount),currency=String(trip.commerce?.currency||'PKR').toLowerCase();
        if(!Number.isFinite(amount)||amount<=0||Math.abs(amount*100-Math.round(amount*100))>1e-6||amount>999999.99)return json(res,409,{ok:false,error:'The admin has not set a valid per-seat price for this trip yet.'});
        if(currency!=='pkr')return json(res,409,{ok:false,error:'Official trip checkout currently requires a PKR seat price.'});
        const booking=tripBookingStore.reserve({trip,userId:account.id,fullName,email,phone,seats,payment:{amount:Math.round(amount*100),currency:currency.toUpperCase()}});
        try{
          const origin=String(process.env.SITE_ORIGIN||localProductionOrigin).replace(/\/$/,'');
          const session=await stripe.checkout.sessions.create({
            mode:'payment',customer_email:email,client_reference_id:booking.id,
            expires_at:Math.floor(Date.now()/1000)+30*60,
            line_items:[{quantity:seats,price_data:{currency,unit_amount:Math.round(amount*100),product_data:{name:trip.title,description:String(trip.summary||'Official Virsapur heritage trip').slice(0,500)}}}],
            metadata:{bookingId:booking.id,tripId:trip.id,userId:account.id},
            payment_intent_data:{metadata:{bookingId:booking.id,tripId:trip.id}},
            success_url:`${origin}/profile/bookings/?checkout=success`,
            cancel_url:`${origin}/trips/${encodeURIComponent(trip.slug||trip.id)}/?checkout=cancelled#reserve`
          },{idempotencyKey:`virsapur-${booking.id}`});
          tripBookingStore.setCheckoutSession(booking.id,session.id,new Date(session.expires_at*1000).toISOString());
          return json(res,201,{ok:true,checkoutUrl:session.url,booking:tripBookingStore.listForMember(account.id).find(item=>item.id===booking.id)});
        }catch(error){tripBookingStore.cancelCheckout(booking.id);console.error('Stripe Checkout session creation failed:',error.code||error.message);return json(res,502,{ok:false,error:'Secure checkout could not be started. No payment was collected; please try again.'});}
      }
      const booking=tripBookingStore.reserve({trip,userId:account.id,fullName,email,phone,seats});
      return json(res,201,{ok:true,booking});
    }
    if(path==='/api/admin/trip-bookings'&&req.method==='GET')return json(res,200,{ok:true,items:tripBookingStore.list()});
    if(path==='/api/member/trip-bookings'&&req.method==='GET'){
      const account=authenticatedUser(req);
      if(!account)return json(res,401,{ok:false,error:'Sign in to view your booking requests.'});
      return json(res,200,{ok:true,items:tripBookingStore.listForMember(account.id)});
    }
    if(/^\/api\/admin\/trip-bookings\/VT-[0-9a-f-]{36}$/i.test(path)&&req.method==='PATCH'){
      const id=path.split('/').at(-1),input=await body(req,2048),events=JSON.parse(await readFile(safeContentPath('events'),'utf8'));
      if(!input||typeof input.status!=='string')return json(res,422,{ok:false,error:'Choose a booking status to save.'});
      let update;
      try{update=tripBookingStore.updateStatus(id,input.status,events);if(!update)return json(res,404,{ok:false,error:'Booking request not found.'});}
      catch(error){return json(res,error.statusCode||409,{ok:false,error:error.message||'Booking status could not be updated.'});}
      let notification=null;
      if(input.status==='confirmed'&&update.previousStatus!=='confirmed'){
        const trip=events.find(item=>item.id===update.booking.tripId);
        try{notification=await bookingMailer.sendConfirmation({...update.booking,tripStart:trip?.start||'',location:trip?.location||''});}
        catch(error){console.error('Booking confirmation email could not be sent:',error.code||error.message);notification={sent:false,reason:'send_failed'};}
      }
      return json(res,200,{ok:true,items:tripBookingStore.list(),notification});
    }
    if(path==='/api/auth/profile'&&req.method==='PATCH'){
      const account=authenticatedUser(req);
      if(!account)return json(res,401,{ok:false,error:'Sign in to update your profile.'});
      const input=await body(req,2048);
      if(!input||Object.keys(input).some(key=>key!=='fullName'))return json(res,422,{ok:false,error:'Only the full name can be updated here.'});
      try{return json(res,200,{ok:true,user:memberAuthStore.updateProfile(account.id,input.fullName)});}catch(error){if(error.code==='INVALID_INPUT')return json(res,422,{ok:false,error:error.message});throw error;}
    }
    if(path==='/api/member/places'&&['GET','POST','DELETE'].includes(req.method)){
      const account=authenticatedUser(req);
      if(!account)return json(res,401,{ok:false,error:'Sign in to manage your places.'});
      if(req.method==='GET')return json(res,200,{ok:true,...memberAuthStore.getMemberPlaces(account.id)});
      const input=await body(req,120_000);
      const items=req.method==='POST'&&Array.isArray(input.items)?input.items:[input];
      if(items.length>1200)return json(res,413,{ok:false,error:'Too many places in one request.'});
      if(!items.length)return json(res,200,{ok:true,...memberAuthStore.getMemberPlaces(account.id)});
      const validTypes=new Set(['wishlist','visited']);
      if(items.some(item=>!item||typeof item.placeId!=='string'||!item.placeId||item.placeId.length>240||!validTypes.has(item.listType)))return json(res,422,{ok:false,error:'Choose a valid destination and list.'});
      const availablePlaces=JSON.parse(await readFile(safeContentPath('heritagePlaces'),'utf8'));
      const placeIds=new Set(availablePlaces.map(place=>place.id));
      if(req.method==='POST'){
        for(const item of items)if(placeIds.has(item.placeId))memberAuthStore.addMemberPlace(account.id,item.placeId,item.listType);
      }else{
        for(const item of items){if(!placeIds.has(item.placeId))return json(res,404,{ok:false,error:'This destination is no longer available.'});memberAuthStore.removeMemberPlace(account.id,item.placeId,item.listType);}
      }
      return json(res,200,{ok:true,...memberAuthStore.getMemberPlaces(account.id)});
    }
    if(/^\/api\/member\/trips\/[^/]+\/submit$/.test(path)&&req.method==='POST'){
      const account=authenticatedUser(req);
      if(!account)return json(res,401,{ok:false,error:'Sign in to submit a custom trip for review.'});
      const input=await body(req,2048);
      if(Object.keys(input).length)return json(res,422,{ok:false,error:'Submit a saved trip without additional client-supplied details.'});
      const tripId=decodeURIComponent(path.slice('/api/member/trips/'.length).replace(/\/submit$/,''));
      if(!tripId||tripId.length>120)return json(res,422,{ok:false,error:'Choose a valid saved trip.'});
      const trip=memberAuthStore.getMemberTrips(account.id).find(item=>item.id===tripId);
      if(!trip)return json(res,404,{ok:false,error:'This saved trip could not be found in your account.'});
      const result=await quoteStore.submitMemberTrip({trip,user:account});
      return json(res,result.updated?201:200,{ok:true,...result});
    }
    if(path==='/api/member/trips'&&['GET','POST'].includes(req.method)||/^\/api\/member\/trips\/[^/]+$/.test(path)&&req.method==='DELETE'){
      const account=authenticatedUser(req);
      if(!account)return json(res,401,{ok:false,error:'Sign in to manage your trips.'});
      if(req.method==='GET')return json(res,200,{ok:true,items:memberAuthStore.getMemberTrips(account.id).map(trip=>({...trip,adminRequest:quoteStore.memberTripRequest(account.id,trip.id)}))});
      if(req.method==='DELETE'){
        const tripId=decodeURIComponent(path.slice('/api/member/trips/'.length));
        if(!tripId||tripId.length>120)return json(res,422,{ok:false,error:'Choose a valid trip.'});
        memberAuthStore.deleteMemberTrip(account.id,tripId);
        return json(res,200,{ok:true,items:memberAuthStore.getMemberTrips(account.id)});
      }
      const input=await body(req,250_000),incoming=Array.isArray(input.items)?input.items:[input.trip||input];
      if(incoming.length>100)return json(res,413,{ok:false,error:'Too many trips in one request.'});
      const availablePlaces=JSON.parse(await readFile(safeContentPath('heritagePlaces'),'utf8'));
      const placeIds=new Set(availablePlaces.map(place=>place.id));
      const choices={travelerGroup:['Solo','Couple','Family','Group'],transportation:['Car','Bike','Public transport'],tripType:['Solo','Family','Friends','Educational'],travelPace:['Relaxed','Moderate','Fast']};
      const cleanTrip=trip=>{
        if(!trip||typeof trip!=='object'||typeof trip.id!=='string'||!trip.id||trip.id.length>120||typeof trip.tripName!=='string'||!trip.tripName.trim()||trip.tripName.length>100||typeof trip.startingLocation!=='string'||!trip.startingLocation.trim()||trip.startingLocation.length>120)return null;
        if(!isValidDateOnly(trip.startDate)||!isValidDateOnly(trip.endDate)||trip.endDate<trip.startDate)return null;
        if(!Number.isInteger(Number(trip.travelerCount))||Number(trip.travelerCount)<1||Number(trip.travelerCount)>100)return null;
        for(const [key,options] of Object.entries(choices))if(!options.includes(trip[key]))return null;
        if(trip.budget!==null&&trip.budget!==''&&(!Number.isFinite(Number(trip.budget))||Number(trip.budget)<0||Number(trip.budget)>100_000_000))return null;
        if(!Array.isArray(trip.destinations)||trip.destinations.length>120||trip.destinations.some(item=>!item||!placeIds.has(item.id)||!Number.isInteger(Number(item.day))||Number(item.day)<1||Number(item.day)>60))return null;
        if(trip.status!==undefined&&trip.status!=='completed')return null;
        if(trip.completedAt!==undefined&&(!trip.status||typeof trip.completedAt!=='string'||!Number.isFinite(Date.parse(trip.completedAt))))return null;
        if(trip.createdAt!==undefined&&(typeof trip.createdAt!=='string'||!Number.isFinite(Date.parse(trip.createdAt))))return null;
        const now=new Date().toISOString();
        const existing=memberAuthStore.getMemberTrips(account.id).find(item=>item.id===trip.id);
        return {id:trip.id,tripName:trip.tripName.trim(),startingLocation:trip.startingLocation.trim(),startDate:trip.startDate,endDate:trip.endDate,travelerGroup:trip.travelerGroup,travelerCount:Number(trip.travelerCount),transportation:trip.transportation,tripType:trip.tripType,budget:trip.budget===null||trip.budget===''?null:Number(trip.budget),travelPace:trip.travelPace,destinations:trip.destinations.map(item=>({id:item.id,day:Number(item.day)})),...(trip.status==='completed'?{status:'completed',completedAt:typeof trip.completedAt==='string'?new Date(trip.completedAt).toISOString():now}:{}),createdAt:existing?.createdAt||trip.createdAt||now,updatedAt:now};
      };
      const trips=incoming.map(cleanTrip);
      if(trips.some(trip=>!trip))return json(res,422,{ok:false,error:'A trip has missing or invalid details. Review the trip fields and destinations.'});
      for(const trip of trips)memberAuthStore.saveMemberTrip(account.id,trip);
      return json(res,200,{ok:true,items:memberAuthStore.getMemberTrips(account.id)});
    }
    if(path==='/api/auth/signup'&&req.method==='POST'){
      const input=await body(req,4096);
      if(!input||Object.keys(input).some(key=>!['fullName','email','password','remember'].includes(key)))return json(res,422,{ok:false,error:'Only name, email and password can be submitted.'});
      let user;
      try{user=await memberAuthStore.register(input);}catch(error){if(error.code==='EMAIL_EXISTS')return json(res,409,{ok:false,error:error.message});if(error.code==='INVALID_INPUT')return json(res,422,{ok:false,error:error.message});throw error;}
      const session=memberAuthStore.createSession(user.id,input.remember!==false);setSessionCookie(req,res,session.token,session.maxAge);
      return json(res,201,{ok:true,user});
    }
    if(path==='/api/auth/login'&&req.method==='POST'){
      const input=await body(req,4096);
      if(!input||Object.keys(input).some(key=>!['email','password','remember'].includes(key))||typeof input.email!=='string'||input.email.length>254||typeof input.password!=='string'||input.password.length>128)return json(res,422,{ok:false,error:'Enter a valid email and password.'});
      const user=await memberAuthStore.authenticate(input.email,input.password);
      if(!user)return json(res,401,{ok:false,error:'Incorrect email or password. Please try again.'});
      const session=memberAuthStore.createSession(user.id,input.remember===true);setSessionCookie(req,res,session.token,session.maxAge);
      return json(res,200,{ok:true,user});
    }
    if(path==='/api/auth/logout'&&req.method==='POST'){
      memberAuthStore.deleteSession(cookie(req,sessionCookieName));clearSessionCookie(req,res);
      return json(res,200,{ok:true});
    }
    if(path==='/api/custom-tour-quotes'&&req.method==='POST'){
      const receipt=await quoteStore.create(await body(req,25000));return json(res,201,{ok:true,receipt,message:'Saved in the Virsapur request database for team review. No email was sent, and no booking or payment was made.'});
    }
    if((path==='/api/saved-articles'&&['GET','POST'].includes(req.method))||(/^\/api\/saved-articles\/[^/]+$/.test(path)&&req.method==='DELETE')){
      const account=authenticatedUser(req);
      if(!account)return json(res,401,{ok:false,error:'Sign in to access your saved articles.'});
      const userId=account.id;
      if(req.method==='GET')return json(res,200,{ok:true,items:savedArticlesStore.list(userId)});
      if(req.method==='POST'){
        const input=await body(req,2000),articleId=typeof input.articleId==='string'?input.articleId:'';
        if(!articleId||articleId.length>240)return json(res,422,{ok:false,error:'Choose a valid article.'});
        const stories=JSON.parse(await readFile(safeContentPath('stories'),'utf8'));
        let availableStories=stories;
        if(studioDataMode==='local'){
          const [demoFixtures,relationshipFixtures]=await Promise.all([
            readFile(join(root,'content','fixtures','demo.json'),'utf8').then(JSON.parse),
            readFile(join(root,'content','fixtures','heritage-interconnection.json'),'utf8').then(JSON.parse)
          ]);
          availableStories=[...stories,...(demoFixtures.stories||[]),...(relationshipFixtures.stories||[])];
        }
        if(!availableStories.some(story=>story.id===articleId&&(story.status==='published'||studioDataMode==='local')))return json(res,404,{ok:false,error:'This article is no longer available to save.'});
        savedArticlesStore.save(userId,articleId);return json(res,201,{ok:true,articleId});
      }
      const articleId=decodeURIComponent(path.slice('/api/saved-articles/'.length));
      if(!articleId||articleId.length>240)return json(res,422,{ok:false,error:'Choose a valid article.'});
      savedArticlesStore.remove(userId,articleId);return json(res,200,{ok:true,articleId});
    }
    if(path==='/api/admin/custom-tour-quotes'&&req.method==='GET')return json(res,200,await quoteStore.list(Object.fromEntries(url.searchParams)));
    if(/^\/api\/admin\/custom-tour-quotes\/VQ-[a-f0-9-]+$/.test(path)&&req.method==='PATCH')return json(res,200,{ok:true,item:await quoteStore.update(path.split('/').at(-1),await body(req,15000))});
    if(path==="/api/publish-local"&&req.method==="POST"){
      const status=await publishLocalProduction();return json(res,200,{ok:true,status,message:`Published ${status.indexableRoutes} indexable routes to Local Production.`});
    }
    if(path==="/api/content"&&req.method==="GET"){const result={};for(const name of allowedContent)result[name]=JSON.parse(await readFile(safeContentPath(name),"utf8"));result.heritagePlaces=(await prepareHeritageRecords(root,result.heritagePlaces)).records;result.heritageContext=await loadHeritageContext(root);return json(res,200,result);}
    if(path==="/api/preview-build-status"&&req.method==="GET")return json(res,200,{ok:true,status:previewBuildStatus});
    if(path.startsWith("/api/content/")&&req.method==="PUT"){
      const name=path.split("/").at(-1);const target=safeContentPath(name);let value=await body(req);
      if(name==="events"&&Array.isArray(value)){const savedAt=new Date().toISOString();value=value.map(record=>record&&typeof record==="object"?{...record,createdAt:record.createdAt||savedAt,updatedAt:savedAt}:record);}
      if(name==="events"&&Array.isArray(value)){
        const existing=JSON.parse(await readFile(target,"utf8"));
        const nextIds=new Set(value.map(record=>record?.id).filter(Boolean));
        const removedTripIds=new Set(existing.filter(record=>record?.scheduleType==="heritage-trip"&&!nextIds.has(record.id)).map(record=>record.id));
        if(removedTripIds.size&&tripBookingStore.list().some(booking=>removedTripIds.has(booking.tripId)))return json(res,409,{ok:false,error:"This trip has booking history and cannot be deleted. Archive it to keep its booking records."});
      }
      const heritageRecords=JSON.parse(await readFile(safeContentPath("heritagePlaces"),"utf8"));const errors=validate(name,value,heritageRecords);if(errors.length)return json(res,422,{ok:false,errors});
      if(name==="heritagePlaces")value=(await prepareHeritageRecords(root,value)).records;
      await revise(name,target);await atomicJson(target,value);rebuild().catch(()=>{});return json(res,200,{ok:true,message:`${name} saved; Preview rebuild started`,previewBuild:previewBuildStatus,value});
    }
    if(path==="/api/orders"&&req.method==="GET")return json(res,200,JSON.parse(await readFile(ordersFile,"utf8")));
    if(path==="/api/orders"&&req.method==="POST"){const order=await body(req);const orders=JSON.parse(await readFile(ordersFile,"utf8"));orders.unshift({id:`MOCK-${Date.now()}`,demo:true,...order,createdAt:order.createdAt||new Date().toISOString()});await atomicJson(ordersFile,orders);return json(res,201,{ok:true,order:orders[0]});}
    if(path==="/api/revisions"&&req.method==="GET"){const files=(await readdir(revisionsRoot)).filter(f=>f.endsWith(".json")).sort().reverse();return json(res,200,files);}
    if(path==="/api/revisions/restore"&&req.method==="POST"){const {file}=await body(req);const safe=basename(file);if(safe!==file||!file.endsWith(".json"))return json(res,400,{error:"Unsafe revision name"});const name=file.split("--").at(-1).replace(/\.json$/,"");const target=safeContentPath(name);await revise(name,target);await copyFile(join(revisionsRoot,file),target);await rebuild();return json(res,200,{ok:true});}
    if(path==="/api/media"&&req.method==="POST"){
      const upload=await body(req);const originalName=basename(upload.name||"");const extension=extname(originalName).toLowerCase();if(![".jpg",".jpeg",".png",".webp"].includes(extension))return json(res,415,{error:"Upload a JPG, PNG or WebP image."});
      const stem=originalName.replace(/\.[^.]+$/,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");if(!stem)return json(res,400,{error:"Invalid image name."});const bytes=Buffer.from(String(upload.data||"").replace(/^data:[^,]+,/,""),"base64");if(!bytes.length||bytes.length>12_000_000)return json(res,413,{error:"Image is empty or larger than 12 MB."});
      const uploadDir=join(root,"assets","uploads");await mkdir(uploadDir,{recursive:true});const original=join(uploadDir,`${stem}${extension}`);await writeFile(original,bytes);
      let width=1280,height=720;try{const require=createRequire(import.meta.url);let sharp;try{sharp=require("sharp");}catch{sharp=require(join(resolve(process.execPath,"..",".."),"node_modules","sharp"));}const image=sharp(bytes);const meta=await image.metadata();width=meta.width||width;height=meta.height||height;for(const size of [...new Set([Math.min(640,width),Math.min(1280,width)])])await image.clone().resize({width:size,withoutEnlargement:true}).webp({quality:82}).toFile(join(root,"assets","optimized",`${stem}-${size}.webp`));}catch(error){return json(res,500,{error:`Image processing failed: ${error.message}`});}
      const mediaPath=safeContentPath("media");const items=JSON.parse(await readFile(mediaPath,"utf8"));const item={id:`media-${Date.now()}`,src:`assets/uploads/${stem}${extension}`,optimizedStem:stem,width,height,alt:upload.alt||"",caption:upload.caption||"",credit:upload.credit||"",focalX:50,focalY:50,createdAt:new Date().toISOString()};items.unshift(item);await revise("media",mediaPath);await atomicJson(mediaPath,items);rebuild().catch(error=>console.error(`Preview rebuild failed after media upload: ${error.message}`));return json(res,201,{ok:true,item});
    }
    if(path.startsWith("/studio"))return serveStatic(res,studioRoot,path.replace(/^\/studio\/?/,""));
    if(path.startsWith("/preview"))return serveStatic(res,previewRoot,path.replace(/^\/preview\/?/,""));
    if(path.startsWith("/production"))return serveStatic(res,productionRoot,path.replace(/^\/production\/?/,""));
    if(path.startsWith('/candidate'))return serveStatic(res,join(root,'dist-production-candidate'),path.replace(/^\/candidate\/?/,''));
    res.writeHead(404,{"content-type":"text/plain"});res.end("Not found");
  }catch(error){json(res,error.statusCode||500,{ok:false,error:error.message});}
});
server.listen(port,host,()=>console.log(studioDataMode==="production"?`Virsapur Studio production mode: open ${productionAdminOrigin}/admin/ (authenticated hosted Admin).`:`Virsapur Studio: http://${host}:${port}/studio/\nPreview sandbox: http://${host}:${port}/preview/\nLocal Production: ${localProductionOrigin}/`));
