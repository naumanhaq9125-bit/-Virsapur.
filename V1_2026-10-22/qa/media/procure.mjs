import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const root=fileURLToPath(new URL('../../../',import.meta.url));
const qa=join(root,'qa-artifacts/final-build-2026-10-22/media');
const require=createRequire(import.meta.url);
let sharp;try{sharp=require('sharp')}catch{sharp=require('C:/Users/user123/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')}
const selection=[
 ['release-shah-jahan-portrait','Shah Jahan Mosque.jpg'],
 ['release-shah-jahan-courtyard','Shahjahan Mosque.jpg'],
 ['release-mohenjodaro','Moen jo daro ruins.jpg'],
 ['release-badshahi-courtyard','Badshahi mosque (49145).jpg'],
 ['release-baltit-rakaposhi','A side view of Baltit Fort and Rakaposhi.jpg'],
 ['release-rohtas','Rohtas fort front.JPG'],
 ['release-takht-i-bahi','Takht-e-bahi.jpg'],
 ['release-shalimar','Shalimar Garden Lahore.jpg'],
 ['release-badshahi-prayer-hall','Badshahi MOSQUE.jpg'],
 ['release-badshahi-night','Badshahi Mosque 2024.jpg']
];
for(const d of ['assets/cleared','assets/optimized','qa-artifacts/final-build-2026-10-22/media/sources'])await mkdir(join(root,d),{recursive:true});
const results=[];
const verified=[['Sadiasarfraz','4.0',3192,4928],['Umair Ulhaque','4.0',1600,1068],['Solophar','4.0',3264,2448],['Khan.gesta','4.0',4624,3472],['Aamir Fawad','4.0',4032,3024],['moeed faisal','4.0',6016,4000],['Asif Nawaz','3.0',4912,3264],['Farhaj124','4.0',2816,2112],['BilalAhmed0000','3.0',5000,3333],['ほっきー','CC0',4032,3024]];
for(const[id,file]of selection){
 try{
 const[creator,version,width,height]=verified[selection.findIndex(x=>x[0]===id)];
 const normalized=file.replaceAll(' ','_'),hash=createHash('md5').update(normalized).digest('hex');
 const info={url:`https://upload.wikimedia.org/wikipedia/commons/${hash[0]}/${hash.slice(0,2)}/${encodeURIComponent(normalized)}`,descriptionurl:'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(normalized)};
 const license=version==='CC0'?'CC0 1.0':`CC BY-SA ${version}`,licenseUrl=version==='CC0'?'https://creativecommons.org/publicdomain/zero/1.0/':`https://creativecommons.org/licenses/by-sa/${version}/`;
 await writeFile(join(qa,'sources',id+'.json'),JSON.stringify({id,file,creator,license,licenseUrl,width,height,sourceUrl:info.descriptionurl,sourceClaim:'Own work',verificationDate:'2026-10-22',verificationMethod:'Commons full file-page content read via web tool; original dimensions verified locally. API unavailable; this is a factual extraction, not an API snapshot.'},null,2));
 const src=`assets/cleared/${id}.jpg`;
 let bytes;try{bytes=await readFile(join(root,src))}catch{await exec('C:/Users/user123/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe',['-NoProfile','-Command',`Invoke-WebRequest -Uri ${quote(info.url)} -OutFile ${quote(join(root,src))} -TimeoutSec 60`],{timeout:70000,windowsHide:true});bytes=await readFile(join(root,src));}
 const dimensions=await sharp(bytes).metadata();
 if(dimensions.width!==width||dimensions.height!==height)throw Error('Dimensions do not match source page');
 for(const width of [640,1280])await sharp(bytes).rotate().resize({width,withoutEnlargement:true}).webp({quality:85}).toFile(join(root,`assets/optimized/${id}-${width}.webp`));
 const sourceUrl=info.descriptionurl;
 results.push({id,src,optimizedStem:id,width:dimensions.width,height:dimensions.height,sourceUrl,originalUrl:info.url,license,licenseUrl,creator,downloadDate:'2026-10-22',sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
 console.log(id,dimensions.width,dimensions.height,license);
 }catch(error){results.push({id,error:error.message});console.log(id,error.message)}
 await writeFile(join(qa,'download-results.json'),JSON.stringify(results,null,2));
}
const tiles=[];let i=0;
for(const item of results.filter(x=>x.src)){
 const thumb=await sharp(join(root,item.src)).resize(400,300,{fit:'contain',background:'#f5f5f5'}).toBuffer();
 const label=Buffer.from(`<svg width="400" height="30"><rect width="400" height="30" fill="white"/><text x="8" y="20" font-size="16">${item.id}</text></svg>`);
 const left=i%3*400,top=Math.floor(i/3)*330;tiles.push({input:thumb,left,top},{input:label,left,top:top+300});i++;
}
if(i)await sharp({create:{width:1200,height:Math.ceil(i/3)*330,channels:3,background:'#fff'}}).composite(tiles).jpeg({quality:90}).toFile(join(qa,'contact-sheet.jpg'));
