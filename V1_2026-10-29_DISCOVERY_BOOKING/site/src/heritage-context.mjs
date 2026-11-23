import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
export async function loadHeritageContext(root) {
  const read = async path => JSON.parse((await readFile(join(root,path),'utf8')).replace(/^[^{]+/,'').replace(/;\s*$/,''));
  const districts=(await read('data/districts.js')).districts;
  const regions=Object.fromEntries((await read('assets/maps/pakistan-admin-1.js')).features.map(feature=>[feature.properties.id,feature.properties.name]));
  return {districts,regions};
}
export async function loadHeritageImageDimensions(root,records) {
  const require=createRequire(import.meta.url);let sharp;
  try { sharp=require('sharp'); } catch { sharp=require(join(resolve(process.execPath,'..','..'),'node_modules','sharp')); }
  const dimensions={};
  for(const record of records) {
    const image=typeof record.image==='string'?record.image:record.image?.src;
    if(!image||dimensions[image]||/^https?:\/\//.test(image))continue;
    const meta=await sharp(join(root,image)).metadata();
    dimensions[image]={width:meta.width,height:meta.height};
  }
  return dimensions;
}
