// Unit-test the actual renderer's reduced-motion branches without changing browser preferences.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const renderer=await readFile(root+'components/heritage-map.js','utf8');
const cameraCode=renderer.slice(renderer.indexOf('  const animateViewBox ='),renderer.indexOf('  const applyCamera ='));
const drawerCode=renderer.slice(renderer.indexOf('  const setDrawerOpen ='),renderer.indexOf('  const heritageThumbnail ='));
const checks=[];
for(const reduced of [true,false]){
 let frames=0,applied=null;
 const run=new Function('window','svg','reducedMotionQuery','setSvgViewBox','currentLayout', "const root={dataset:{mapVariant:'full'}};let cameraAnimation=0;"+cameraCode+';animateViewBox([1,2,300,400]);');
 run({cancelAnimationFrame(){},requestAnimationFrame(){frames++;}},{getAttribute:()=> '0 0 100 100'},{matches:reduced},values=>applied=values,{viewBox:[0,0,100,100]});
 checks.push({name:'Camera reduced-motion='+reduced,passed:reduced?frames===0&&applied?.join()==='1,2,300,400':frames===1});
 let animations=0;
 const drawer={hidden:true,animate(){animations++;}};
 const runDrawer=new Function('drawer','root','drawerToggle','drawerAction','drawerContent','renderHeritageContext','reducedMotionQuery','setRailOpen','setContextOpen',drawerCode+';setDrawerOpen(true);');
 runDrawer(drawer,{dataset:{mapVariant:'full'},classList:{toggle(){}}},{setAttribute(){}},{},{children:[1]},()=>{},{matches:reduced},()=>{},()=>{});
 checks.push({name:'Inventory reduced-motion='+reduced,passed:drawer.hidden===false&&animations===(reduced?0:1)});
}
await writeFile(root+'qa-artifacts/atlas-signature-completion/motion-checks.json',JSON.stringify({method:'Unit execution of actual renderer functions with a simulated media-query result; not browser preference emulation.',checks},null,2));
console.log(checks);
if(checks.some(c=>!c.passed))process.exitCode=1;
