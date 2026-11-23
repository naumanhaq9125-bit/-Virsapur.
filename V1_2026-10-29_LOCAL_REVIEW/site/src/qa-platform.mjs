import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root=fileURLToPath(new URL("..",import.meta.url));
const mode=process.argv.find(v=>v.startsWith("--mode="))?.split("=")[1]||"production";
const output=process.env.VIRSAPUR_OUTPUT_DIR?resolve(process.env.VIRSAPUR_OUTPUT_DIR):join(root,mode==="production"?"dist-production":"dist-demo");
const outputRelative=relative(resolve(root),output);if(outputRelative.startsWith("..")||isAbsolute(outputRelative))throw new Error("QA output must stay inside the Virsapur project.");
const errors=[];const warnings=[];const titles=new Map();
async function filesUnder(dir){const result=[];for(const name of await readdir(dir)){const path=join(dir,name);const info=await stat(path);if(info.isDirectory())result.push(...await filesUnder(path));else result.push(path);}return result;}
const files=await filesUnder(output);const htmlFiles=files.filter(f=>f.endsWith(".html"));const manifest=JSON.parse(await readFile(join(output,"route-manifest.json"),"utf8"));
const routeFor=file=>{const rel=relative(output,file).split(sep).join("/");if(rel==="index.html")return "/";if(rel==="404.html")return "/404-file";return `/${rel.replace(/\/index\.html$/,"")}`;};
for(const file of htmlFiles){
  const html=await readFile(file,"utf8");const route=routeFor(file);const admin=route==="/admin"||route.startsWith("/admin/");const redirect=/http-equiv="refresh"/.test(html);const title=html.match(/<title>(.*?)<\/title>/s)?.[1];const description=html.match(/<meta name="description" content="([^"]*)"/)?.[1];const robots=html.match(/<meta name="robots" content="([^"]*)"/)?.[1];const h1=(html.match(/<h1(?:\s|>)/g)||[]).length;
  const privateAuth=route==="/login"||route==="/signup";
  if(!title)errors.push(`${route}: missing title`);if(!admin&&!redirect&&!description)errors.push(`${route}: missing description`);if(!robots)errors.push(`${route}: missing robots`);if(!redirect&&h1!==1)errors.push(`${route}: expected one H1, found ${h1}`);if(!admin&&!privateAuth&&!redirect&&!/<link rel="canonical"/.test(html))errors.push(`${route}: missing canonical`);if(!admin&&!privateAuth&&!redirect&&!/application\/ld\+json/.test(html))errors.push(`${route}: missing structured data`);
  if(admin&&!robots?.startsWith("noindex"))errors.push(`${route}: Admin route must be noindex`);if(mode==="production"&&!admin&&!redirect&&robots?.startsWith("noindex")&&route!=="/404"&&route!=="/404-file"&&route!=="/login"&&route!=="/signup")errors.push(`${route}: production page is noindex`);if(mode!=="production"&&!robots?.startsWith("noindex"))errors.push(`${route}: development page must be noindex`);
  if(title&&!redirect&&route!=="/404-file"){if(titles.has(title))warnings.push(`${route}: title duplicates ${titles.get(title)}`);else titles.set(title,route);}
  for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){const ref=match[1];if(/^(?:https?:|mailto:|tel:|#|data:)/.test(ref))continue;const clean=ref.split(/[?#]/)[0];if(!clean)continue;const target=resolve(dirname(file),clean);if(!target.startsWith(resolve(output)))errors.push(`${route}: reference escapes output: ${ref}`);else try{await stat(target);}catch{errors.push(`${route}: broken reference ${ref}`);}}
  for(const image of html.matchAll(/<img\b[^>]*>/g)){if(!/\bwidth="\d+"/.test(image[0])||!/\bheight="\d+"/.test(image[0]))errors.push(`${route}: image lacks dimensions`);if(!/\balt="[^"]*"/.test(image[0]))errors.push(`${route}: image lacks alt`);}
  const map=/data-heritage-map/.test(html);if(map!==(route==="/"||route==="/heritage-map"))errors.push(`${route}: map loading scope changed`);
}
const home=await readFile(join(output,"index.html"),"utf8");
if(!/<nav id="navigation"[\s\S]*?>[\s\S]*?>Home<\/a>/.test(home))errors.push("/: Home is missing from main navigation");
if(mode==="production"){
  if(/DEV SANDBOX|DEMO CONTENT|demo-badge|\/studio(?:\/|\b)/i.test(home)||files.some(f=>relative(output,f).split(sep).includes("studio")))errors.push("production: Studio/demo material leaked");
  const sitemap=await readFile(join(output,"sitemap.xml"),"utf8");if(/demo|studio/i.test(sitemap))errors.push("production: sitemap contains demo or Studio URL");
  const robots=await readFile(join(output,"robots.txt"),"utf8");if(!/Allow: \//.test(robots)||!/Sitemap:/.test(robots))errors.push("production: robots.txt is incomplete");
}else{
  if(!/DEV SANDBOX/.test(home))errors.push("demo: sandbox bar missing");const robots=await readFile(join(output,"robots.txt"),"utf8");if(!/Disallow: \//.test(robots))errors.push("demo: restrictive robots.txt missing");
  for(const file of ["studio/index.html","studio/studio.js","studio/server.mjs"]){try{await stat(join(root,file));}catch{errors.push(`Studio missing ${file}`);}}
  const studioHtml=await readFile(join(root,"studio","index.html"),"utf8");if(!/noindex,nofollow/.test(studioHtml))errors.push("Studio UI is not noindex");
  for(const feature of ["api/revisions","api/media","api/orders","build.mjs","127.0.0.1"]){const server=await readFile(join(root,"studio","server.mjs"),"utf8");if(!server.includes(feature))errors.push(`Studio server missing ${feature}`);}
}
const stories=JSON.parse(await readFile(join(root,"content","data","stories.json"),"utf8"));const projects=JSON.parse(await readFile(join(root,"content","data","projects.json"),"utf8"));const categories=JSON.parse(await readFile(join(root,"content","data","archive-categories.json"),"utf8"));const collaborators=JSON.parse(await readFile(join(root,"content","data","collaborators.json"),"utf8"));if(stories.length<12)errors.push(`content: the 12 migrated stories were not preserved; found ${stories.length}`);if(projects.length<2)errors.push(`content: the two migrated projects were not preserved; found ${projects.length}`);if(!categories.length)errors.push("content: Archive Categories collection is empty");if(!collaborators.length)errors.push("content: Collaborators collection is empty");
const report={mode,output,htmlFiles:htmlFiles.length,manifestRoutes:manifest.routes.length,indexableRoutes:manifest.routes.filter(r=>r.indexable).length,errors,warnings};console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
