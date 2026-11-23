import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const require=createRequire(import.meta.url);
const { chromium }=require("C:/Users/user123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=new URL("..",import.meta.url).pathname.replace(/^\/(.:)/,"$1");
const output=join(root,"qa-artifacts","geographic-alignment");
const after=join(output,"after");
await mkdir(after,{recursive:true});

const executablePath=process.env.VIRSAPUR_BROWSER_PATH||"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser=await chromium.launch({headless:true,executablePath,args:["--disable-gpu"]});
const report={passName:"Virsapur Heritage Atlas Geographic Alignment Correction",startedAt:new Date().toISOString(),screenshots:[],checks:[],consoleErrors:[]};
const check=(name,passed,detail={})=>report.checks.push({name,passed:Boolean(passed),detail});

async function openPage(path,width,height){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on("console",message=>{if(message.type()==="error")report.consoleErrors.push({path,width,message:message.text()});});
  const response=await page.goto(`http://127.0.0.1:4173${path}`,{waitUntil:"load"});
  if(!response?.ok())throw new Error(`${path} returned ${response?.status()}`);
  await page.locator("[data-heritage-map]").scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector("[data-heritage-map]")?.classList.contains("map-world-ready"));
  await page.waitForTimeout(350);
  return page;
}

async function capture(page,name,selector){
  const target=join(after,`${name}.png`);
  const locator=page.locator(selector);
  await locator.scrollIntoViewIfNeeded();
  const style=await page.addStyleTag({content:"html{scroll-behavior:auto!important}.site-header,.dev-bar,.skip-link{visibility:hidden!important}"});
  await page.waitForTimeout(300);
  await locator.screenshot({path:target});
  await style.evaluate(element=>element.remove());
  report.screenshots.push({name,file:target});
}

for(const viewport of [{label:"1440x900",width:1440,height:900},{label:"1920x1080",width:1920,height:1080},{label:"430x932",width:430,height:932}]){
  const home=await openPage("/preview/",viewport.width,viewport.height);
  await capture(home,`homepage-map-${viewport.label}-after`,".home-map-section");
  await home.close();
  const atlas=await openPage("/preview/heritage-map/",viewport.width,viewport.height);
  await capture(atlas,`heritage-map-${viewport.label}-after`,".map-section-full");
  await atlas.close();
}

{
  const page=await openPage("/preview/heritage-map/",1440,900);
  const alignment=await page.evaluate(()=>{
    const root=document.querySelector("[data-heritage-map]");
    const active=document.querySelector(".map-region-paths").getBBox();
    const mask=document.querySelector("[data-world-pakistan]").getBBox();
    const reference=document.querySelector("[data-world-pakistan-reference]").getBBox();
    const labels=Object.fromEntries([...document.querySelectorAll(".map-world-label")].map(label=>[label.textContent,{x:Number(label.getAttribute("x")),y:Number(label.getAttribute("y"))}]));
    const near=(a,b,tolerance=.03)=>Math.abs(a-b)<=tolerance;
    return {
      projection:root.dataset.regionalProjection,
      scale:root.dataset.regionalScale,
      translation:root.dataset.regionalTranslation,
      extent:root.dataset.regionalExtent,
      sameSvg:document.querySelector("#pakistan-map > .map-world-context")?.parentElement?.id==="pakistan-map",
      transforms:{context:document.querySelector(".map-world-context").getAttribute("transform"),pakistan:document.querySelector(".map-vector-viewport").getAttribute("transform")},
      active:{x:active.x,y:active.y,width:active.width,height:active.height},
      mask:{x:mask.x,y:mask.y,width:mask.width,height:mask.height},
      reference:{x:reference.x,y:reference.y,width:reference.width,height:reference.height},
      exactAuthoritativeFootprint:near(active.x,mask.x)&&near(active.y,mask.y)&&near(active.width,mask.width)&&near(active.height,mask.height),
      labels,
    };
  });
  check("World context and interactive Pakistan share one SVG projection",alignment.sameSvg&&alignment.projection==="equirectangular"&&!alignment.transforms.context&&!alignment.transforms.pakistan,alignment);
  check("Background cutout exactly matches the authoritative interactive footprint",alignment.exactAuthoritativeFootprint,alignment);
  check("Neighbour labels have truthful cardinal relationships",alignment.labels.Iran.x<alignment.active.x&&alignment.labels.Afghanistan.x<alignment.active.x+alignment.active.width/2&&alignment.labels.China.x>alignment.active.x+alignment.active.width&&alignment.labels.India.x>alignment.active.x+alignment.active.width&&alignment.labels["Arabian Sea"].y>alignment.active.y+alignment.active.height,alignment.labels);

  await page.evaluate(()=>{
    const root=document.querySelector("[data-heritage-map]");
    root.classList.add("map-debug-alignment");
    const key=document.createElement("div");
    key.id="alignment-debug-key";
    key.textContent="TERRACOTTA — VIRSAPUR AUTHORITATIVE FOOTPRINT   ·   BLUE DASH — NATURAL EARTH REFERENCE";
    Object.assign(key.style,{position:"absolute",zIndex:"20",left:"18px",top:"18px",padding:"9px 12px",background:"rgba(255,255,255,.95)",border:"1px solid rgba(48,51,58,.2)",font:"700 9px Inter, sans-serif",letterSpacing:".08em",color:"#30333a"});
    root.querySelector(".map-stage").append(key);
  });
  await capture(page,"debug-shared-projection-alignment-1440x900",".map-workspace");
  await page.evaluate(()=>{document.querySelector("[data-heritage-map]").classList.remove("map-debug-alignment");document.querySelector("#alignment-debug-key")?.remove();});

  const expectedRegions=["azad-kashmir","balochistan","gilgit-baltistan","islamabad","khyber-pakhtunkhwa","punjab","sindh"].sort();
  const regions=await page.evaluate(()=>[...document.querySelectorAll(".region-path")].map(path=>path.id.replace("region-","")).sort());
  check("All seven province and region identities remain present",JSON.stringify(regions)===JSON.stringify(expectedRegions),{regions});
  await page.locator(".region-punjab").click();
  await page.waitForFunction(()=>document.querySelector("[data-heritage-map]")?.dataset.mapState==="region:punjab:");
  await page.waitForFunction(()=>document.querySelectorAll(".map-district").length===41);
  await page.waitForTimeout(650);
  let state=await page.evaluate(()=>({state:document.querySelector("[data-heritage-map]").dataset.mapState,districts:document.querySelectorAll(".map-district").length,kotAddu:Boolean(document.querySelector("#district-punjab-kot-addu")),muzaffargarh:Boolean(document.querySelector("#district-punjab-muzaffargarh")),contextOpacity:getComputedStyle(document.querySelector(".map-world-context")).opacity}));
  check("Pakistan to Punjab district layer remains unchanged",state.state==="region:punjab:"&&state.districts===41&&state.kotAddu&&state.muzaffargarh&&Number(state.contextOpacity)===0,state);
  await page.locator("#district-punjab-kot-addu").click();
  await page.waitForTimeout(350);
  state=await page.evaluate(()=>({state:document.querySelector("[data-heritage-map]").dataset.mapState,hash:location.hash}));
  check("Kot Addu drill-down remains unchanged",state.state==="district:punjab:punjab-kot-addu"&&state.hash==="#map/punjab/kot-addu",state);
  await page.locator(".map-prev").click();
  await page.waitForFunction(()=>document.querySelector("[data-heritage-map]")?.dataset.mapState==="region:punjab:");
  await page.locator("#district-punjab-muzaffargarh").click();
  await page.waitForTimeout(350);
  state=await page.evaluate(()=>({state:document.querySelector("[data-heritage-map]").dataset.mapState,hash:location.hash}));
  check("Muzaffargarh drill-down remains unchanged",state.state==="district:punjab:punjab-muzaffargarh"&&state.hash==="#map/punjab/muzaffargarh",state);
  await page.locator(".map-prev").click();
  await page.waitForFunction(()=>document.querySelector("[data-heritage-map]")?.dataset.mapState==="region:punjab:");
  await page.locator(".map-prev").click();
  await page.waitForFunction(()=>document.querySelector("[data-heritage-map]")?.dataset.mapState==="country::");
  state=await page.evaluate(()=>({state:document.querySelector("[data-heritage-map]").dataset.mapState,viewBox:document.querySelector("#pakistan-map").getAttribute("viewBox")}));
  check("Back navigation restores Pakistan overview",state.state==="country::"&&state.viewBox==="0.000 0.000 960.000 720.000",state);
  await page.close();
}

{
  const page=await openPage("/preview/heritage-map/",430,932);
  const mobile=await page.evaluate(()=>{
    const root=document.querySelector("[data-heritage-map]");
    const active=document.querySelector(".map-region-paths").getBBox();
    const mask=document.querySelector("[data-world-pakistan]").getBBox();
    const stage=document.querySelector(".map-stage").getBoundingClientRect();
    return {projection:root.dataset.regionalProjection,extent:root.dataset.regionalExtent,scale:root.dataset.regionalScale,active:{x:active.x,y:active.y,width:active.width,height:active.height},mask:{x:mask.x,y:mask.y,width:mask.width,height:mask.height},stageWidth:stage.width,documentWidth:document.documentElement.scrollWidth,viewport:innerWidth};
  });
  const mobileAligned=["x","y","width","height"].every(key=>Math.abs(mobile.active[key]-mobile.mask[key])<.03);
  check("Mobile uses a tighter but still shared geographic projection",mobile.projection==="equirectangular"&&mobile.extent==="57 83 20.5 40"&&mobileAligned&&mobile.documentWidth<=mobile.viewport+1,mobile);
  await page.close();
}

const baseline=JSON.parse(await readFile(join(root,"qa-artifacts","signature-atlas","geography-baseline.json"),"utf8"));
for(const [path,expected] of Object.entries(baseline.hashes)){
  const actual=createHash("sha256").update(await readFile(join(root,path))).digest("hex");
  check(`Protected geography unchanged: ${path}`,actual===expected,{expected,actual});
}

report.consoleErrors=report.consoleErrors.filter(item=>!/^Failed to load resource: the server responded with a status of 404/.test(item.message));
report.finishedAt=new Date().toISOString();
report.passed=report.checks.every(item=>item.passed)&&report.consoleErrors.length===0;
await writeFile(join(output,"report.json"),`${JSON.stringify(report,null,2)}\n`);
await browser.close();
console.log(JSON.stringify({passed:report.passed,screenshots:report.screenshots.length,failedChecks:report.checks.filter(item=>!item.passed),consoleErrors:report.consoleErrors},null,2));
if(!report.passed)process.exitCode=1;
