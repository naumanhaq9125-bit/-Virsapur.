import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, normalize, resolve, relative, isAbsolute } from "node:path";
import { createRequire } from "node:module";
import { prepareHeritageRecords } from "../src/heritage-spatial.mjs";
import {validateHeritageIds} from "../src/heritage-relations.mjs";
import {loadHeritageContext} from "../src/heritage-context.mjs";
import {createQuoteStore} from './quote-store.mjs';
import {validateContentInput} from '../src/cms/validation.mjs';

import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("..", import.meta.url));
const studioRoot = join(root, "studio");
const previewRoot = join(root, "dist-demo");
const productionRoot = join(root, "dist-production");
const contentRoot = join(root, "content", "data");
const runtimeRoot = join(root, "studio-data");
const usersFile = join(runtimeRoot, "users.json");
const sessionsFile = join(runtimeRoot, "sessions.json");
const revisionsRoot = join(runtimeRoot, "revisions");
const ordersFile = join(runtimeRoot, "mock-orders.json");
const localProductionStatusFile = join(runtimeRoot, "local-production.json");
const quoteStore=createQuoteStore(join(runtimeRoot,'custom-tour-quote-requests.json'),{loadPlaces:async()=>JSON.parse(await readFile(join(contentRoot,'heritage-places.json'),'utf8')),loadSite:async()=>JSON.parse(await readFile(join(contentRoot,'site.json'),'utf8'))});
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
mime['.mjs']='text/javascript; charset=utf-8';
try { await stat(ordersFile); } catch { await writeFile(ordersFile,"[]\n"); }

const json = (res,status,data) => { res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}); res.end(JSON.stringify(data,null,2)); };
const body = (req,limit=15_000_000) => new Promise((resolveBody,reject) => { let size=0,chunks=[],failed=false;req.on('data',chunk=>{size+=chunk.length;if(size>limit){if(!failed){failed=true;chunks=[];const error=Error('Request too large');error.statusCode=413;reject(error);}return;}if(!failed)chunks.push(chunk);});req.on('end',()=>{if(failed)return;try{resolveBody(chunks.length?JSON.parse(Buffer.concat(chunks).toString('utf8')):{});}catch{const error=Error('Invalid JSON request');error.statusCode=400;reject(error);}});req.on('error',reject);});
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
function rebuild(){previewBuilding=previewBuilding.catch(()=>{}).then(()=>runNode([join(root,"build.mjs"),"--mode=demo"],{CMS_DATA_MODE:"local",PRODUCTION_CMS_ENABLED:"false",SITE_ORIGIN:localProductionOrigin}));return previewBuilding;}
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
await rebuild();

function safeStatic(base,urlPath){const requested=decodeURIComponent(urlPath).replace(/^\/+/,"");const candidate=resolve(base,normalize(requested||"index.html"));const rel=relative(resolve(base),candidate);if(rel.startsWith('..')||isAbsolute(rel))throw new Error("Unsafe path");return candidate;}
async function serveStatic(res,base,urlPath){let file=safeStatic(base,urlPath);try{const info=await stat(file);if(info.isDirectory())file=join(file,"index.html");}catch{if(!extname(file))file=join(file,"index.html");}try{const data=await readFile(file);res.writeHead(200,{"content-type":mime[extname(file).toLowerCase()]||"application/octet-stream","cache-control":"no-store","x-robots-tag":"noindex, nofollow"});res.end(data);}catch{res.writeHead(404,{"content-type":"text/plain"});res.end("Not found");}}

const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,`http://${host}:${port}`); const path=url.pathname;
    const allowedHosts=new Set([`${host}:${port}`,`localhost:${port}`]);
    if(!allowedHosts.has(req.headers.host))return json(res,403,{error:'Local Studio accepts loopback hosts only.'});
    if(req.headers.origin && ![`http://${host}:${port}`,`http://localhost:${port}`].includes(req.headers.origin))return json(res,403,{error:'Cross-origin requests are not allowed.'});
    if(req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'Cross-site requests are not allowed.'});
    if(!['GET','HEAD','POST','PUT','PATCH'].includes(req.method))return json(res,405,{error:'Method not allowed.'});
    if(['POST','PUT','PATCH'].includes(req.method)&&!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))return json(res,415,{error:'JSON content type required.'});
    res.setHeader('x-content-type-options','nosniff');
    if(studioDataMode==="production"&&(path==="/"||path.startsWith("/studio"))){res.writeHead(302,{location:`${productionAdminOrigin}/admin/`,"cache-control":"no-store"});return res.end();}
    if(studioDataMode==="production"&&path.startsWith("/api/"))return json(res,503,{ok:false,error:`Production data is protected by the hosted Admin. Open ${productionAdminOrigin}/admin/ and sign in.`});
    if(path==="/"){res.writeHead(302,{location:"/studio/"});return res.end();}
    if(path==="/api/local-production-status"&&req.method==="GET"){
      try{return json(res,200,{ok:true,status:JSON.parse(await readFile(localProductionStatusFile,"utf8"))});}
      catch{try{const manifest=JSON.parse(await readFile(join(productionRoot,"route-manifest.json"),"utf8"));return json(res,200,{ok:true,status:{publishedAt:manifest.generatedAt||null,origin:localProductionOrigin,routes:manifest.routes.length,indexableRoutes:manifest.routes.filter(route=>route.indexable).length,qaPassed:null}});}catch{return json(res,200,{ok:true,status:null});}}
    }
    if(path==='/api/custom-tour-quotes'&&req.method==='POST'){
      const receipt=await quoteStore.create(await body(req,25000));return json(res,201,{ok:true,receipt,message:'Saved on this computer only. No email, booking or payment was made.'});
    }
    if(path==='/api/admin/custom-tour-quotes'&&req.method==='GET')return json(res,200,await quoteStore.list(Object.fromEntries(url.searchParams)));
    if(/^\/api\/admin\/custom-tour-quotes\/VQ-[a-f0-9-]+$/.test(path)&&req.method==='PATCH')return json(res,200,{ok:true,item:await quoteStore.update(path.split('/').at(-1),await body(req,15000))});
    if(path==="/api/publish-local"&&req.method==="POST"){
      const status=await publishLocalProduction();return json(res,200,{ok:true,status,message:`Published ${status.indexableRoutes} indexable routes to Local Production.`});
    }
    if(path==="/api/content"&&req.method==="GET"){const result={};for(const name of allowedContent)result[name]=JSON.parse(await readFile(safeContentPath(name),"utf8"));result.heritagePlaces=(await prepareHeritageRecords(root,result.heritagePlaces)).records;result.heritageContext=await loadHeritageContext(root);return json(res,200,result);}
    if(path.startsWith("/api/content/")&&req.method==="PUT"){
      const name=path.split("/").at(-1);const target=safeContentPath(name);let value=await body(req);const heritageRecords=JSON.parse(await readFile(safeContentPath("heritagePlaces"),"utf8"));const errors=validate(name,value,heritageRecords);if(errors.length)return json(res,422,{ok:false,errors});
      if(name==="heritagePlaces")value=(await prepareHeritageRecords(root,value)).records;
      await revise(name,target);await atomicJson(target,value);const buildOutput=await rebuild();return json(res,200,{ok:true,message:`${name} saved`,buildOutput,value});
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
    if(path==="/api/auth/logout"&&req.method==="POST"){
      return json(res,200,{ok:true});
    }
    if(path==="/api/auth/signup"&&req.method==="POST"){
      const {firstName,lastName,email,password,confirmPassword}=await body(req);
      if(!email||!password||!firstName||!lastName)return json(res,422,{ok:false,error:"All fields are required."});
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json(res,422,{ok:false,error:"Invalid email format."});
      if(password.length<8)return json(res,422,{ok:false,error:"Password must be at least 8 characters."});
      if(!firstName.trim()||!lastName.trim())return json(res,422,{ok:false,error:"Enter your full name."});
      if(confirmPassword && confirmPassword!==password)return json(res,422,{ok:false,error:"The passwords do not match."});
      let users=[];
      try{users=JSON.parse(await readFile(usersFile,"utf8"));}catch{users=[];}
      const normalizedEmail=email.trim().toLowerCase();
      if(users.some(u=>u.email===normalizedEmail))return json(res,409,{ok:false,error:"An account with this email already exists."});
      const salt=Date.now().toString(36);
      const hash=createHash("sha256").update(password+salt).digest("hex");
      const newUser={
        id:`user-${Date.now()}`,
        firstName:firstName.trim(),
        lastName:lastName.trim(),
        email:normalizedEmail,
        salt,
        hash,
        createdAt:new Date().toISOString()
      };
      users.push(newUser);
      await atomicJson(usersFile,users);
      return json(res,201,{ok:true,message:"Account created successfully.",user:{id:newUser.id,name:`${newUser.firstName} ${newUser.lastName}`,email:newUser.email}});
    }
    if((path==="/api/auth/login"||path==="/api/auth-login")&&req.method==="POST"){
      const {email,password}=await body(req);
      if(!email||!password)return json(res,422,{ok:false,error:"Email and password are required."});
      let users=[];
      try{users=JSON.parse(await readFile(usersFile,"utf8"));}catch{users=[];}
      const normalizedEmail=email.trim().toLowerCase();
      const user=users.find(u=>u.email===normalizedEmail);
      if(!user){
        return json(res,401,{ok:false,error:"Invalid email or password."});
      }
      const hash=createHash("sha256").update(password+user.salt).digest("hex");
      if(hash!==user.hash){
        return json(res,401,{ok:false,error:"Invalid email or password."});
      }
      const token=createHash("sha256").update(user.id+Date.now()).digest("hex");
      return json(res,200,{ok:true,token,user:{id:user.id,name:`${user.firstName} ${user.lastName}`,email:user.email}});
    }
    if(path.startsWith("/studio"))return serveStatic(res,studioRoot,path.replace(/^\/studio\/?/,""));
    if(path.startsWith("/preview"))return serveStatic(res,previewRoot,path.replace(/^\/preview\/?/,""));
    if(path.startsWith("/production"))return serveStatic(res,productionRoot,path.replace(/^\/production\/?/,""));
    if(path.startsWith('/candidate'))return serveStatic(res,join(root,'dist-production-candidate'),path.replace(/^\/candidate\/?/,''));
    res.writeHead(404,{"content-type":"text/plain"});res.end("Not found");
  }catch(error){json(res,error.statusCode||500,{ok:false,error:error.message});}
});
server.listen(port,host,()=>console.log(studioDataMode==="production"?`Virsapur Studio production mode: open ${productionAdminOrigin}/admin/ (authenticated hosted Admin).`:`Virsapur Studio: http://${host}:${port}/studio/\nPreview sandbox: http://${host}:${port}/preview/\nLocal Production: ${localProductionOrigin}/`));
