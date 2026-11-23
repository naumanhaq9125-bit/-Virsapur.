// Exact-site catalogue photography is a TEMPORARY LOCAL PREVIEW reference, not licensed production media.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const require=createRequire(import.meta.url);
let sharp;
try {sharp=require('sharp');} catch {sharp=require(join(process.env.ATLAS_NODE_PACKAGES || 'C:/Users/user123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules','sharp'));}
const root=fileURLToPath(new URL('../',import.meta.url));
const qa=join(root,'qa-artifacts/atlas-signature-completion');
const selection=JSON.parse(await readFile(join(root,'content/atlas-major-selection.json')));
const ids=[...new Set([...selection.doam.map(x=>x[0]),4870,9752,4624,6502,5527,6537,7804,8911,4696])];
const media={};
if(process.argv.includes('--alternatives')) {
 const tiles=[]; let index=0;
 for(const id of [6959,6710,5499,5504,6423,8229,8278,9752,6233]) {
  const source=JSON.parse(await readFile(join(qa,`research/doam-${id}.json`)));
  for(const [photo,url] of source.images.entries()) {
   const input=Buffer.from(await(await fetch(url)).arrayBuffer());
   const thumb=await sharp(input).resize(220,145,{fit:'contain',background:'#faf9f5'}).toBuffer();
   const caption=Buffer.from(`<svg width="220" height="25"><rect width="220" height="25" fill="white"/><text x="6" y="18" font-size="13">${id} · index ${photo}</text></svg>`);
   const left=(index%5)*220,top=Math.floor(index/5)*170;tiles.push({input:thumb,left,top},{input:caption,left,top:top+145});index++;
  }
 }
 await sharp({create:{width:1100,height:Math.ceil(index/5)*170,channels:3,background:'#fff'}}).composite(tiles).jpeg({quality:85}).toFile(join(qa,'image-alternatives.jpg'));
 process.exit(0);
}
await mkdir(join(root,'assets/optimized'),{recursive:true});
for(const id of ids){
 const source=JSON.parse(await readFile(join(qa,`research/doam-${id}.json`)));
 const reviewedImageIndex={6959:3,6710:2,5499:3,5504:2,6423:1,8229:1,8278:2,9752:1,6233:2};
 const url=source.images[reviewedImageIndex[id] || 0];
 if(!url){media[id]={missing:true,reason:'No record-specific catalogue photograph'};continue;}
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok) throw Error(`HTTP ${response.status}`);
  const buffer=Buffer.from(await response.arrayBuffer());
  const meta=await sharp(buffer).metadata();
  if(meta.width<100||meta.height<100) throw Error('Source is too small');
  const image=`assets/optimized/atlas-doam-${id}-640.webp`;
  const output=await sharp(buffer).rotate().resize({width:640,withoutEnlargement:true}).webp({quality:78}).toBuffer();
  await writeFile(join(root,image),output);
  media[id]={image,imageAlt:source.title,imageCredit:'Department of Archaeology & Museums catalogue; individual photographer not credited',imageSourceUrl:source.url,imageOriginalUrl:url,imageLicense:'Reuse permission not established. Temporary local Preview reference only; obtain permission or replace before public release.',imageTemporary:true,bytes:output.length,sourceWidth:meta.width,sourceHeight:meta.height};
 }catch(error){media[id]={missing:true,reason:error.message};}
}
await writeFile(join(qa,'media.json'),JSON.stringify(media,null,2));
// Review sheet labels identify the catalogue image; no site photo is generated or altered beyond resizing.
const tiles=[]; let index=0;
for(const [id,item] of Object.entries(media).filter(([,v])=>v.image)){
 const thumb=await sharp(join(root,item.image)).resize(180,120,{fit:'contain',background:'#faf9f5'}).toBuffer();
 const caption=Buffer.from(`<svg width="180" height="25"><rect width="180" height="25" fill="white"/><text x="6" y="18" font-size="13" fill="#30333a">DOAM ${id}</text></svg>`);
 const left=(index%7)*180,top=Math.floor(index/7)*145;
 tiles.push({input:thumb,left,top},{input:caption,left,top:top+120});index++;
}
await sharp({create:{width:1260,height:Math.ceil(index/7)*145,channels:3,background:'#fff'}}).composite(tiles).jpeg({quality:85}).toFile(join(qa,'image-review-sheet.jpg'));
console.log(JSON.stringify({temporary:Object.values(media).filter(v=>v.image).length,missing:Object.entries(media).filter(([,v])=>!v.image),totalBytes:Object.values(media).reduce((s,v)=>s+(v.bytes||0),0)}));
