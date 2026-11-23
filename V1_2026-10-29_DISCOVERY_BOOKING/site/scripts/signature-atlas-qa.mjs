import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

const require=createRequire(import.meta.url);
const { chromium }=require("C:/Users/user123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=new URL("..",import.meta.url).pathname.replace(/^\/(.:)/,"$1");
const output=join(root,"qa-artifacts","signature-atlas","final");
const screenshots=join(output,"screenshots");
const recordings=join(output,"recordings");
await mkdir(screenshots,{recursive:true});
await mkdir(recordings,{recursive:true});

const executablePath=process.env.VIRSAPUR_BROWSER_PATH||"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser=await chromium.launch({headless:true,executablePath,args:["--disable-gpu"]});
const report={passName:"Virsapur Signature Interactive Heritage Atlas Pass",startedAt:new Date().toISOString(),screenshots:[],recordings:[],checks:[],consoleErrors:[]};
const check=(name,passed,detail={})=>report.checks.push({name,passed:Boolean(passed),detail});

async function openPage(path,width=1440,height=900){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on("console",message=>{if(message.type()==="error")report.consoleErrors.push({path,width,message:message.text()});});
  const response=await page.goto(`http://127.0.0.1:4173${path}`,{waitUntil:"load"});
  if(!response?.ok())throw new Error(`${path} returned ${response?.status()}`);
  await page.evaluate(async()=>{for(const image of document.images)image.loading="eager";await Promise.all([...document.images].map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.addEventListener("load",resolve,{once:true});image.addEventListener("error",resolve,{once:true});})));document.querySelectorAll(".reveal-item").forEach(item=>item.classList.add("is-revealed"));});
  await page.waitForTimeout(650);
  return page;
}

async function capture(page,name,selector=".map-section"){
  const target=join(screenshots,`${name}.png`);
  const locator=page.locator(selector);
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(380);
  const captureStyle=await page.addStyleTag({content:"html{scroll-behavior:auto!important}.site-header,.dev-bar,.skip-link{visibility:hidden!important}"});
  await locator.screenshot({path:target});
  await captureStyle.evaluate(element=>element.remove());
  report.screenshots.push({name,selector,file:target});
}

async function selectPunjab(page){
  await page.locator(".region-punjab").click();
  await page.waitForFunction(()=>document.querySelector("[data-heritage-map]")?.dataset.mapState==="region:punjab:");
  await page.waitForFunction(()=>document.querySelectorAll(".map-district").length>0);
  await page.mouse.move(4,4);
  await page.waitForTimeout(450);
}

for(const viewport of [{label:"1440x900",width:1440,height:900},{label:"1920x1080",width:1920,height:1080}]){
  const home=await openPage("/preview/",viewport.width,viewport.height);
  await capture(home,`homepage-map-overview-${viewport.label}`,".home-map-section");
  if(viewport.width===1440){
    await home.locator(".home-map-section .region-punjab").hover();
    await home.waitForTimeout(250);
    await capture(home,"homepage-map-hover-punjab-1440x900",".home-map-section .atlas-stage-shell");
    await selectPunjab(home);
    await capture(home,"homepage-map-selected-punjab-1440x900",".home-map-section .atlas-stage-shell");
  }
  await home.close();

  const atlas=await openPage("/preview/heritage-map/",viewport.width,viewport.height);
  await capture(atlas,`heritage-atlas-overview-${viewport.label}`,".map-section-full");
  await atlas.close();
}

{
  const page=await openPage("/preview/heritage-map/",1440,900);
  const initial=await page.evaluate(()=>({
    regions:[...document.querySelectorAll(".region-path")].map(path=>path.id.replace("region-","")).sort(),
    state:document.querySelector("[data-heritage-map]")?.dataset.mapState,
    worldReady:document.querySelector("[data-heritage-map]")?.classList.contains("map-world-ready"),
    worldPointerEvents:getComputedStyle(document.querySelector(".map-world-context")).pointerEvents,
    worldCountries:window.VIRSAPUR_WORLD_CONTEXT?.countries?.length,
    svgTitleCount:document.querySelectorAll("#pakistan-map title").length,
    svgLabel:document.querySelector("#pakistan-map")?.getAttribute("aria-label"),
    controls:document.querySelectorAll(".map-control-rail button").length,
    panControl:Boolean(document.querySelector(".map-pan-disclosure")),
    layerControl:Boolean(document.querySelector(".map-layer-control")),
  }));
  const expectedRegions=["azad-kashmir","balochistan","gilgit-baltistan","islamabad","khyber-pakhtunkhwa","punjab","sindh"].sort();
  check("Authoritative Pakistan region identities preserved",JSON.stringify(initial.regions)===JSON.stringify(expectedRegions),initial);
  check("Natural Earth context is separate and non-interactive",initial.worldReady&&initial.worldPointerEvents==="none"&&initial.worldCountries===177,initial);
  check("Map avoids native SVG title tooltips and retains an accessible name",initial.svgTitleCount===0&&Boolean(initial.svgLabel),initial);
  check("Full atlas exposes supported controls",initial.controls===4&&initial.panControl&&initial.layerControl,initial);

  await page.locator(".region-punjab").hover();
  await page.waitForTimeout(200);
  const hovered=await page.evaluate(()=>({state:document.querySelector("[data-heritage-map]")?.dataset.mapState,summary:document.querySelector(".map-summary h3")?.textContent}));
  check("Punjab hover previews without changing geographic state",hovered.state==="country::"&&hovered.summary==="Punjab",hovered);
  await capture(page,"heritage-atlas-hover-punjab-1440x900",".map-section-full .map-workspace");

  await selectPunjab(page);
  const punjab=await page.evaluate(()=>({
    state:document.querySelector("[data-heritage-map]")?.dataset.mapState,
    districts:document.querySelectorAll(".map-district").length,
    kotAddu:Boolean(document.querySelector("#district-punjab-kot-addu")),
    muzaffargarh:Boolean(document.querySelector("#district-punjab-muzaffargarh")),
    summary:document.querySelector(".map-summary h3")?.textContent,
    related:[...document.querySelectorAll(".map-related-content a")].map(link=>link.textContent),
  }));
  check("Punjab district data and required identities preserved",punjab.state==="region:punjab:"&&punjab.districts===41&&punjab.kotAddu&&punjab.muzaffargarh,punjab);
  check("Context panel uses existing linked content",punjab.summary==="Punjab"&&punjab.related.length===3,punjab);
  await capture(page,"heritage-atlas-selected-punjab-1440x900",".map-section-full .map-workspace");
  await capture(page,"heritage-atlas-context-panel-1440x900",".map-summary");

  await page.locator("#district-punjab-kot-addu").click();
  await page.waitForTimeout(450);
  await page.mouse.move(4,4);
  const district=await page.evaluate(()=>({state:document.querySelector("[data-heritage-map]")?.dataset.mapState,hash:location.hash,summary:document.querySelector(".map-summary h3")?.textContent}));
  check("Kot Addu district selection and route preserved",district.state==="district:punjab:punjab-kot-addu"&&district.hash==="#map/punjab/kot-addu"&&district.summary==="Kot Addu District",district);
  await capture(page,"heritage-atlas-kot-addu-district-1440x900",".map-section-full .map-workspace");

  await page.getByRole("button",{name:"Zoom in"}).click();
  await page.getByRole("button",{name:"Zoom in"}).click();
  await page.waitForTimeout(420);
  const zoomed=await page.evaluate(()=>({scale:Number(document.querySelector("[data-heritage-map]")?.dataset.cameraScale),viewBox:document.querySelector("#pakistan-map")?.getAttribute("viewBox")}));
  check("Bounded zoom changes the map camera",zoomed.scale>1&&Number(zoomed.viewBox.split(" ")[2])<960,zoomed);
  await capture(page,"heritage-atlas-zoomed-district-1440x900",".map-stage");

  await page.locator("#pakistan-map").focus();
  const beforePan=await page.locator("#pakistan-map").getAttribute("viewBox");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(420);
  const afterPan=await page.locator("#pakistan-map").getAttribute("viewBox");
  check("Keyboard panning changes the map camera",beforePan!==afterPan,{beforePan,afterPan});
  await capture(page,"heritage-atlas-keyboard-panned-1440x900",".map-stage");

  await page.locator(".map-layer-control summary").click();
  await page.locator('[data-map-layer="labels"]').uncheck();
  await page.locator('[data-map-layer="boundaries"]').uncheck();
  const layers=await page.evaluate(()=>({labels:document.querySelector("[data-heritage-map]").classList.contains("map-labels-hidden"),boundaries:document.querySelector("[data-heritage-map]").classList.contains("map-boundaries-muted")}));
  check("Supported label and boundary layers toggle genuinely",layers.labels&&layers.boundaries,layers);
  await page.locator('[data-map-layer="labels"]').check();
  await page.locator('[data-map-layer="boundaries"]').check();

  await page.getByRole("button",{name:"Return to Pakistan overview"}).first().click();
  await page.waitForTimeout(500);
  const overview=await page.evaluate(()=>({state:document.querySelector("[data-heritage-map]")?.dataset.mapState,scale:document.querySelector("[data-heritage-map]")?.dataset.cameraScale,viewBox:document.querySelector("#pakistan-map")?.getAttribute("viewBox")}));
  check("Overview restores the country map and camera",overview.state==="country::"&&overview.scale==="1.00"&&overview.viewBox==="0.000 0.000 960.000 720.000",overview);
  await capture(page,"heritage-atlas-world-reset-1440x900",".map-section-full .map-workspace");
  await capture(page,"heritage-atlas-controls-1440x900",".map-controls");
  await page.close();
}

{
  const page=await openPage("/preview/heritage-map/#map/punjab/kot-addu",1440,900);
  await page.waitForFunction(()=>document.querySelector("[data-heritage-map]")?.dataset.mapState==="district:punjab:punjab-kot-addu");
  const deepLink=await page.evaluate(()=>({state:document.querySelector("[data-heritage-map]")?.dataset.mapState,summary:document.querySelector(".map-summary h3")?.textContent}));
  check("Existing deep links resolve to the same district",deepLink.state==="district:punjab:punjab-kot-addu"&&deepLink.summary==="Kot Addu District",deepLink);
  await page.close();
}

for(const [label,path] of [["homepage","/preview/"],["heritage-atlas","/preview/heritage-map/"]]){
  const page=await openPage(path,430,932);
  await capture(page,`${label}-mobile-430x932`,label==="homepage"?".home-map-section":".map-section-full");
  const mobile=await page.evaluate(()=>{
    const stage=document.querySelector(".map-stage")?.getBoundingClientRect();
    const summary=document.querySelector(".map-summary")?.getBoundingClientRect();
    const controls=[...document.querySelectorAll(".map-control-rail button")].map(button=>{const box=button.getBoundingClientRect();return {width:box.width,height:box.height};});
    return {viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,stageBottom:stage?.bottom,summaryTop:summary?.top,controls};
  });
  check(`${label} mobile map has no overflow and deliberate control sizing`,mobile.documentWidth<=mobile.viewport+1&&mobile.controls.every(control=>control.width>=44&&control.height>=44),mobile);
  check(`${label} mobile context follows the map`,mobile.summaryTop>=mobile.stageBottom-1,mobile);
  await page.close();
}

const baseline=JSON.parse(await readFile(join(root,"qa-artifacts","signature-atlas","geography-baseline.json"),"utf8"));
for(const [path,expected] of Object.entries(baseline.hashes)){
  const actual=createHash("sha256").update(await readFile(join(root,path))).digest("hex");
  check(`Geography source unchanged: ${path}`,actual===expected,{expected,actual});
}

try{
  const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:recordings,size:{width:1440,height:900}}});
  const page=await context.newPage();
  await page.goto("http://127.0.0.1:4173/preview/heritage-map/",{waitUntil:"load"});
  await page.waitForTimeout(500);
  await page.locator(".region-punjab").hover();
  await page.waitForTimeout(550);
  await page.locator(".region-punjab").click();
  await page.waitForFunction(()=>document.querySelector("[data-heritage-map]")?.dataset.mapState==="region:punjab:");
  await page.mouse.move(4,4);
  await page.waitForTimeout(600);
  await page.locator("#district-punjab-kot-addu").click();
  await page.waitForTimeout(500);
  await page.getByRole("button",{name:"Zoom in"}).click();
  await page.waitForTimeout(500);
  await page.getByRole("button",{name:"Return to Pakistan overview"}).first().click();
  await page.waitForTimeout(600);
  const video=page.video();
  await page.close();
  const recordedPath=await video.path();
  const finalPath=join(recordings,"heritage-atlas-interaction-1440x900.webm");
  await rename(recordedPath,finalPath);
  report.recordings.push({name:"heritage-atlas-interaction-1440x900",file:finalPath});
  await context.close();
}catch(error){
  report.recordingNote=`Video recording was not available: ${error.message}`;
}

report.consoleErrors=report.consoleErrors.filter(item=>!/^Failed to load resource: the server responded with a status of 404/.test(item.message));
report.finishedAt=new Date().toISOString();
report.passed=report.checks.every(item=>item.passed)&&report.consoleErrors.length===0;
await writeFile(join(output,"report.json"),`${JSON.stringify(report,null,2)}\n`);
await browser.close();
console.log(JSON.stringify({passed:report.passed,screenshots:report.screenshots.length,recordings:report.recordings,failedChecks:report.checks.filter(item=>!item.passed),consoleErrors:report.consoleErrors,recordingNote:report.recordingNote},null,2));
if(!report.passed)process.exitCode=1;
