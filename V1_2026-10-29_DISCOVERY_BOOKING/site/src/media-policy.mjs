/** Local candidate media policy. Source/editorial Preview records are never changed. */
export const BRAND_MEDIA = new Set(['assets/logo_full_slate.png','assets/logo_full_white.png']);
export function isLocalAsset(value) { return typeof value==='string' && /^assets\/[a-z0-9_./ -]+$/i.test(value) && !value.split('/').includes('..'); }
export function rightsCleared(record) { return !!record && record.productionCleared===true && !!(record.license||record.licence||record.imageLicense) && /^https?:\/\//.test(record.sourceUrl||record.imageSourceUrl||'') && !!(record.creator||record.credit||record.imageCredit); }
const safePaths=item=>isLocalAsset(item.src) && (item.optimizedStem===undefined||typeof item.optimizedStem==='string'&&/^[a-z0-9_-]+$/i.test(item.optimizedStem)) && (!item.derivatives||typeof item.derivatives==='object'&&!Array.isArray(item.derivatives)&&Object.values(item.derivatives).every(isLocalAsset));
export function createMediaPolicy({media=[],overrides={},preview=false,defaultImage=null}) {
  const byId=new Map(media.map(item=>[item.id,item]));
  const forPlace=new Map();
  for(const item of media.filter(rightsCleared)) {
    const resolved=resolve(item);
    if(resolved?.allowed)for(const id of Array.isArray(item.relatedHeritageIds)?item.relatedHeritageIds:[])if(!forPlace.has(id))forPlace.set(id,resolved);
  }
  function resolve(value,{placement}={}) {
    let item=typeof value==='string'?(byId.get(value)||{src:value}):(byId.get(value?.mediaId)||value);
    if(!preview) item=byId.get(overrides.placements?.[placement])||byId.get(overrides.replaces?.[item?.src])||item;
    if(!item)return null;
    const brand=BRAND_MEDIA.has(item.src);
    const allowed=preview||(brand||rightsCleared(item))&&safePaths(item);
    return {...item,allowed,productionCleared:brand||item.productionCleared===true};
  }
  function heritage(records) {
    if(preview){
      const resolved=records.map(record=>{
        const cleared=forPlace.get(record.id);
        if(typeof record.image==='string' && record.image && (!record.imageTemporary || !cleared)) return record;
        const image=cleared || (record.image?resolve(record.image):null);
        return image?.src?{...record,image:image.derivatives?.webp1280||image.src,imageAlt:image.alt||record.imageAlt||record.title,imageCredit:image.credit||record.imageCredit,imageLicense:image.license||record.imageLicense,imageSourceUrl:image.sourceUrl||record.imageSourceUrl,placeholderImage:false}:record;
      });
      return resolved.some((record,index)=>record!==records[index])?resolved:records;
    }
    return records.map(record=>{
      const cleared=forPlace.get(record.id);
      const own=resolve(typeof record.image==='string'?{src:record.image,productionCleared:record.productionCleared,license:record.imageLicense,sourceUrl:record.imageSourceUrl,credit:record.imageCredit}:record.image);
      const image=cleared||own;
      if(!image?.allowed)return {...record,image:null,imageTemporary:false,imageAlt:'',productionCleared:false};
      return {...record,image:image.derivatives?.webp1280||image.src,imageAlt:image.alt||record.title,imageCredit:image.credit||image.creator,imageLicense:image.license,imageSourceUrl:image.sourceUrl,productionCleared:true,imageTemporary:false};
    });
  }
  return {resolve,heritage,byId};
}
