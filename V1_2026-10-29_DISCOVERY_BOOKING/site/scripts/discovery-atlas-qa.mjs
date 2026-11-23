import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const require=createRequire(import.meta.url);
const { chromium }=require("C:/Users/user123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=new URL("..",import.meta.url).pathname.replace(/^\/(.:)/,"$1");
const output=join(root,"qa-artifacts","discovery-atlas");
const screenshots=join(output,"screenshots");
await mkdir(screenshots,{recursive:true});

const protectedHashes={
  "assets/maps/pakistan-admin-1.js":"4A54A5D5304B9230FB901C561AFC531A3219D1F57CE1D5199AC478867F5E14F6",
  "data/administrative-snapshot.js":"EAFDD66A42275F4F8BE407DE7AF8D00D4B1D698948BA9D4D1C4B99A4F025A5DF",
  "data/regions.js":"8FCE201999BECD939D1D7D9BAF4FA4DDA7776829616960A42287580937546CDF",
  "data/districts.js":"17F5C76DA3B9166719DE234B816127328E43F4A4B8E8287703F09E86CBA6343D",
  "components/heritage-map.js":"7E6367682E33DCF8642DCC7719491DAF7588CE6C6BAEC8E53AF92658A1CAC1AA",
  "app.js":"BF42ECBDA9CE13F8DC2B90274EE25997B58ACC82830FCCBA668490842EA7C52E"
};

const executablePath=process.env.VIRSAPUR_BROWSER_PATH||"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser=await chromium.launch({headless:true,executablePath,args:["--disable-gpu"]});
const report={passName:"Virsapur Discovery & Atlas Stage Finesse Pass",startedAt:new Date().toISOString(),screenshots:[],checks:[],consoleErrors:[]};

async function openPage(path,width,height){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on("console",message=>{if(message.type()==="error")report.consoleErrors.push({path,width,message:message.text()});});
  const response=await page.goto(`http://127.0.0.1:4173${path}`,{waitUntil:"load"});
  if(!response?.ok())throw new Error(`${path} returned ${response?.status()}`);
  await page.evaluate(async()=>{for(const image of document.images)image.loading="eager";await Promise.all([...document.images].map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.addEventListener("load",resolve,{once:true});image.addEventListener("error",resolve,{once:true});})));document.querySelectorAll(".reveal-item").forEach(item=>item.classList.add("is-revealed"));});
  await page.waitForTimeout(650);
  return page;
}

async function captureSelector(page,name,path,selector,width,height){
  const target=join(screenshots,`${name}.png`);
  const locator=page.locator(selector);
  const captureStyle=await page.addStyleTag({content:"html{scroll-behavior:auto!important}.site-header,.dev-bar,.skip-link{visibility:hidden!important}"});
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await locator.screenshot({path:target});
  await captureStyle.evaluate(element=>element.remove());
  report.screenshots.push({name,path,selector,width,height,file:target});
}

async function captureRange(page,name,path,startSelector,endSelector,width,height){
  const target=join(screenshots,`${name}.png`);
  const captureStyle=await page.addStyleTag({content:`html{scroll-behavior:auto!important}.site-header,.dev-bar,.skip-link{display:none!important}${endSelector}~*{display:none!important}`});
  await page.evaluate(()=>scrollTo(0,0));
  await page.waitForTimeout(900);
  await page.locator("main").screenshot({path:target});
  await captureStyle.evaluate(element=>element.remove());
  report.screenshots.push({name,path,selector:`${startSelector} → ${endSelector}`,width,height,file:target});
}

for(const viewport of [{label:"1440x900",width:1440,height:900},{label:"1920x1080",width:1920,height:1080}]){
  const home=await openPage("/preview/",viewport.width,viewport.height);
  await captureRange(home,`home-hero-discovery-${viewport.label}`,"/preview/",".discovery-hero",".discovery-shelf",viewport.width,viewport.height);
  await captureSelector(home,`discovery-shelf-${viewport.label}`,"/preview/",".discovery-shelf",viewport.width,viewport.height);
  await captureSelector(home,`homepage-map-intro-${viewport.label}`,"/preview/",".home-map-section .atlas-intro-band",viewport.width,viewport.height);
  await captureSelector(home,`homepage-atlas-stage-${viewport.label}`,"/preview/",".home-map-section .atlas-stage-shell",viewport.width,viewport.height);
  await captureRange(home,`home-hero-through-map-${viewport.label}`,"/preview/",".discovery-hero",".home-map-section",viewport.width,viewport.height);
  await captureSelector(home,`theme-index-${viewport.label}`,"/preview/",".theme-index",viewport.width,viewport.height);
  await home.close();

  const atlas=await openPage("/preview/heritage-map/",viewport.width,viewport.height);
  await captureSelector(atlas,`explore-map-intro-${viewport.label}`,"/preview/heritage-map/",".atlas-page-intro",viewport.width,viewport.height);
  await captureSelector(atlas,`explore-map-atlas-stage-${viewport.label}`,"/preview/heritage-map/",".map-section-full",viewport.width,viewport.height);
  await atlas.close();
}

for(const viewport of [{label:"430x932",width:430,height:932},{label:"375x812",width:375,height:812}]){
  const home=await openPage("/preview/",viewport.width,viewport.height);
  await captureSelector(home,`mobile-discovery-shelf-${viewport.label}`,"/preview/",".discovery-shelf",viewport.width,viewport.height);
  await captureSelector(home,`mobile-theme-index-${viewport.label}`,"/preview/",".theme-index",viewport.width,viewport.height);
  await captureSelector(home,`mobile-homepage-map-stage-${viewport.label}`,"/preview/",".home-map-section",viewport.width,viewport.height);
  const metrics=await home.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,shelfItems:document.querySelectorAll(".discovery-shelf a").length,themeItems:document.querySelectorAll(".theme-index a").length,themeDescriptions:document.querySelectorAll(".theme-index-copy small").length,labelSizes:[...document.querySelectorAll(".map-label")].map(label=>parseFloat(getComputedStyle(label).fontSize))}));
  report.checks.push({name:`Homepage responsive structure at ${viewport.label}`,passed:metrics.documentWidth<=metrics.viewport+1&&metrics.shelfItems===4&&metrics.themeItems===4&&metrics.themeDescriptions===4&&metrics.labelSizes.every(size=>size>=10),detail:metrics});
  await home.close();

  const atlas=await openPage("/preview/heritage-map/",viewport.width,viewport.height);
  await captureSelector(atlas,`mobile-explore-map-page-${viewport.label}`,"/preview/heritage-map/","main",viewport.width,viewport.height);
  const atlasMetrics=await atlas.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,h1s:document.querySelectorAll("h1").length,regions:document.querySelectorAll(".region-path").length,labels:document.querySelectorAll(".map-label").length}));
  report.checks.push({name:`Explore Map responsive structure at ${viewport.label}`,passed:atlasMetrics.documentWidth<=atlasMetrics.viewport+1&&atlasMetrics.h1s===1&&atlasMetrics.regions===7&&atlasMetrics.labels===7,detail:atlasMetrics});
  await atlas.close();
}

{
  const page=await openPage("/preview/heritage-map/",1440,900);
  const before=await page.evaluate(()=>({regions:document.querySelectorAll(".region-path").length,labels:document.querySelectorAll(".map-label").length,summary:document.querySelector("#map-summary-heading")?.textContent?.trim(),state:document.querySelector("[data-heritage-map]")?.dataset.mapState}));
  await page.locator(".region-path").first().click();
  await page.waitForTimeout(850);
  const selected=await page.evaluate(()=>({districts:document.querySelectorAll(".map-district").length,parentHidden:document.querySelector(".map-district-viewport")?.hasAttribute("hidden"),backVisible:!document.querySelector(".map-prev")?.hasAttribute("hidden"),summary:document.querySelector("#map-summary-heading")?.textContent?.trim(),state:document.querySelector("[data-heritage-map]")?.dataset.mapState}));
  await page.locator(".map-prev").click();
  await page.waitForTimeout(700);
  const restored=await page.evaluate(()=>({regions:document.querySelectorAll(".region-path").length,vectorHidden:document.querySelector(".map-vector-viewport")?.hasAttribute("hidden"),summary:document.querySelector("#map-summary-heading")?.textContent?.trim(),state:document.querySelector("[data-heritage-map]")?.dataset.mapState}));
  report.checks.push({name:"Map interaction freeze",passed:before.regions===7&&before.labels===7&&before.summary==="Pakistan"&&before.state==="country::"&&selected.districts>0&&selected.parentHidden===false&&selected.backVisible===true&&selected.state?.startsWith("region:")&&restored.regions===7&&restored.vectorHidden===false&&restored.state==="country::",detail:{before,selected,restored}});
  await page.close();
}

for(const [path,expected] of Object.entries(protectedHashes)){
  const actual=createHash("sha256").update(await readFile(join(root,path))).digest("hex").toUpperCase();
  report.checks.push({name:`Protected map source unchanged: ${path}`,passed:actual===expected,detail:{expected,actual}});
}

report.consoleErrors=report.consoleErrors.filter(item=>!/^Failed to load resource: the server responded with a status of 404/.test(item.message));
report.finishedAt=new Date().toISOString();
report.passed=report.checks.every(check=>check.passed)&&report.consoleErrors.length===0;
await writeFile(join(output,"report.json"),`${JSON.stringify(report,null,2)}\n`);
await browser.close();
console.log(JSON.stringify({passed:report.passed,screenshots:report.screenshots.length,checks:report.checks,consoleErrors:report.consoleErrors},null,2));
if(!report.passed)process.exitCode=1;
