import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const require=createRequire(import.meta.url);
const { chromium }=require("C:/Users/user123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=new URL("..",import.meta.url).pathname.replace(/^\/(.:)/,"$1");
const output=join(root,"qa-artifacts","archive-architecture","screenshots");
await mkdir(output,{recursive:true});
const executablePath=process.env.VIRSAPUR_BROWSER_PATH||"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser=await chromium.launch({headless:true,executablePath,args:["--disable-gpu"]});
const report={startedAt:new Date().toISOString(),screenshots:[],responsive:[],interactions:[],consoleErrors:[]};

async function openPage(path,width=1440,height=1000){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on("console",message=>{const text=message.text();if(message.type()==="error"&&!/^Failed to load resource: the server responded with a status of 404 \(Not Found\)$/.test(text))report.consoleErrors.push({path,width,message:text});});
  const response=await page.goto(`http://127.0.0.1:4173${path}`,{waitUntil:"load"});
  if(!response?.ok())throw new Error(`${path} returned ${response?.status()}`);
  return page;
}
async function capture(name,path,{width=1440,height=1000,selector,fullPage=true}={}){
  const page=await openPage(path,width,height);const target=join(output,`${name}.png`);
  await page.evaluate(async()=>{const images=[...document.images];for(const image of images)image.loading="eager";await Promise.all(images.map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.addEventListener("load",resolve,{once:true});image.addEventListener("error",resolve,{once:true});})));});
  await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=Math.max(300,innerHeight*.72)){scrollTo(0,y);await new Promise(resolve=>setTimeout(resolve,55));}scrollTo(0,0);await new Promise(resolve=>setTimeout(resolve,80));});
  await page.evaluate(()=>document.querySelectorAll(".reveal-item").forEach(item=>item.classList.add("is-revealed")));
  await page.waitForTimeout(700);
  if(selector){await page.locator(selector).scrollIntoViewIfNeeded();await page.waitForTimeout(120);}
  if(selector)await page.locator(selector).screenshot({path:target});else await page.screenshot({path:target,fullPage});
  report.screenshots.push({name,path,width,height,selector:selector||null,file:target});await page.close();
}

await capture("01-home-desktop-full","/preview/",{height:1100});
await capture("02-archives-desktop-full","/preview/archives/",{height:1000});
await capture("03-category-desktop-full","/preview/archives/category/archaeology-and-ancient-civilisations/",{height:1000});
await capture("04-archives-all-desktop-full","/preview/archives/all/",{height:1000});
await capture("05-story-desktop-full","/preview/archives/demo-courtyard-notes/",{height:1000});
await capture("06-programmes-desktop-full","/preview/programmes/",{height:1000});
await capture("07-programmes-mobile-full","/preview/programmes/",{width:375,height:812});
await capture("08-home-themes-desktop","/preview/",{selector:".theme-band",fullPage:false});
await capture("09-home-purpose-desktop","/preview/",{selector:".home-purpose",fullPage:false});
await capture("10-global-header-desktop","/preview/",{selector:".site-header",fullPage:false});
await capture("11-cultural-events-mobile","/preview/programmes/",{width:375,height:812,selector:".editorial-panel--programme:last-child",fullPage:false});

const routes=["/preview/","/preview/archives/","/preview/archives/all/","/preview/archives/category/archaeology-and-ancient-civilisations/","/preview/archives/demo-courtyard-notes/","/preview/programmes/","/preview/service/cultural-events-and-collaborations/","/preview/whats-on/","/preview/our-work/","/preview/why-virsapur/","/preview/contact/"];
for(const width of [320,360,375,390,430,768,1024,1280,1440,1920]){
  for(const path of routes){
    const page=await openPage(path,width,width<600?812:900);
    const metrics=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,h1s:document.querySelectorAll("h1").length,header:Boolean(document.querySelector(".site-header"))}));
    report.responsive.push({path,width,passed:metrics.documentWidth<=metrics.viewport+1&&metrics.bodyWidth<=metrics.viewport+1&&metrics.h1s===1&&metrics.header,metrics});
    await page.close();
  }
}

{
  const page=await openPage("/preview/archives/all/",1440,900);
  await page.locator("[data-collection-search]").fill("wells");
  await page.waitForTimeout(100);
  const result=await page.locator("[data-collection-count]").innerText();
  const visible=await page.locator("[data-record]").evaluateAll(nodes=>nodes.filter(node=>getComputedStyle(node).display!=="none").map(node=>node.getAttribute("data-title")));
  report.interactions.push({name:"Archive keyword filter",passed:visible.length>0&&visible.every(title=>title.includes("well")),result,visible});
  await page.locator('[data-filter="category"]').selectOption("archive-category-sacred-heritage");
  await page.waitForTimeout(100);
  const sacredVisible=await page.locator("[data-record]").evaluateAll(nodes=>nodes.filter(node=>getComputedStyle(node).display!=="none").length);
  report.interactions.push({name:"Archive category filter",passed:sacredVisible===0,detail:"Keyword and category filters combine predictably."});
  await page.locator(".filter-reset").click();await page.waitForTimeout(100);
  const resetCount=await page.locator("[data-collection-count]").innerText();
  report.interactions.push({name:"Archive filter reset",passed:/18 (?:stories|results)/i.test(resetCount),detail:resetCount});
  await page.close();
}
{
  const page=await openPage("/preview/programmes/",375,812);
  const longCard=page.locator(".editorial-panel--programme").last();
  const titleMetrics=await longCard.locator("h3").evaluate(element=>({clientWidth:element.clientWidth,scrollWidth:element.scrollWidth,height:element.getBoundingClientRect().height,lineHeight:getComputedStyle(element).lineHeight,overflowWrap:getComputedStyle(element).overflowWrap}));
  const imageMetrics=await longCard.locator("img").evaluate(element=>{const box=element.getBoundingClientRect();return {width:box.width,height:box.height,ratio:box.width/box.height,objectFit:getComputedStyle(element).objectFit};});
  report.interactions.push({name:"Long programme title wraps safely",passed:titleMetrics.scrollWidth<=titleMetrics.clientWidth+1&&titleMetrics.height>50,detail:titleMetrics});
  report.interactions.push({name:"Programme portrait aperture",passed:imageMetrics.ratio>.70&&imageMetrics.ratio<.80&&imageMetrics.objectFit==="cover",detail:imageMetrics});
  await page.close();
}
{
  const page=await openPage("/preview/programmes/",1440,900);
  const titleMetrics=await page.locator(".editorial-panel--programme").last().locator("h3").evaluate(element=>({clientWidth:element.clientWidth,scrollWidth:element.scrollWidth,height:element.getBoundingClientRect().height,text:element.textContent}));
  report.interactions.push({name:"Long programme title stays inside its desktop panel",passed:titleMetrics.scrollWidth<=titleMetrics.clientWidth+1,detail:titleMetrics});
  await page.close();
}
{
  const page=await openPage("/preview/",1440,900);
  const imageSources=await page.locator("main img").evaluateAll(images=>images.map(image=>image.currentSrc||image.src).filter(source=>!source.includes("collaborators/")));
  const duplicates=[...new Set(imageSources.filter((source,index)=>imageSources.indexOf(source)!==index))];
  report.interactions.push({name:"Homepage editorial photography does not repeat",passed:duplicates.length===0,detail:{images:imageSources.length,duplicates}});
  await page.close();
}
{
  const page=await openPage("/preview/whats-on/",375,812);
  const cards=await page.locator("[data-record]").count();
  await page.locator("[data-collection-search]").fill("architecture");await page.waitForTimeout(100);
  const count=await page.locator("[data-collection-count]").innerText();
  report.interactions.push({name:"What’s On remains data-driven and filterable",passed:cards===3&&/^1 (?:activity|result)/i.test(count),detail:{cards,count}});
  await page.close();
}

report.finishedAt=new Date().toISOString();
const substantiveConsoleErrors=report.consoleErrors.filter(item=>!/^Failed to load resource: the server responded with a status of 404 \(Not Found\)$/.test(item.message));
report.passed=report.responsive.every(item=>item.passed)&&report.interactions.every(item=>item.passed)&&substantiveConsoleErrors.length===0;
await writeFile(join(root,"qa-artifacts","archive-architecture","visual-responsive-report.json"),`${JSON.stringify(report,null,2)}\n`);
await browser.close();
console.log(JSON.stringify({passed:report.passed,screenshots:report.screenshots.length,responsiveChecks:report.responsive.length,interactionChecks:report.interactions,consoleErrors:report.consoleErrors},null,2));
if(!report.passed)process.exitCode=1;
