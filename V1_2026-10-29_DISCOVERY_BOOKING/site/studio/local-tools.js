// Pure helpers shared by the local-only UI and its regression checks.
(() => {
  const clone=value=>structuredClone(value);
  const terms=value=>[...new Set(String(value||'').split(/[,\n]/).map(x=>x.trim()).filter(Boolean))];
  const regionNames={'punjab':'Punjab','sindh':'Sindh','balochistan':'Balochistan','khyber-pakhtunkhwa':'Khyber Pakhtunkhwa','khyber pakhtunkhwa':'Khyber Pakhtunkhwa','kp':'Khyber Pakhtunkhwa','gilgit-baltistan':'Gilgit-Baltistan','gb':'Gilgit-Baltistan','azad-kashmir':'Azad Jammu and Kashmir','azad kashmir':'Azad Jammu and Kashmir','azad jammu and kashmir':'Azad Jammu and Kashmir','ajk':'Azad Jammu and Kashmir','islamabad':'Islamabad Capital Territory','islamabad capital territory':'Islamabad Capital Territory'};
  const regionName=value=>regionNames[String(value).trim().toLowerCase()]||String(value).trim();
  // Normalize filter labels only; never rewrite authored geography/source metadata.
  const regions=record=>[...new Set([record.province,...record.provinceRegionIds||[],...record.relatedProvinceIds||[]].filter(Boolean).flatMap(value=>String(value).split(/[;,]/)).map(regionName).filter(Boolean))];
  const categories=record=>[record.primaryCategoryId,record.heritageCategory,...record.categoryIds||[]].filter(Boolean);
  function filter(records,state){
    const words=String(state.q||'').trim().toLowerCase().split(/\s+/).filter(Boolean);
    return records.filter(r=>(!state.status||r.status===state.status)&&(!state.region||regions(r).includes(regionName(state.region)))&&(!state.category||categories(r).includes(state.category))&&(!state.tag||(r.tags||[]).includes(state.tag))&&(!state.mapDisplay||(r.mapDisplay||(r.featured?'featured':'listed'))===state.mapDisplay)&&words.every(w=>[r.id,r.title,r.shortTitle,r.slug,r.summary,r.province,r.district,...r.aliases||[],...r.tags||[],...r.districtIds||[],...regions(r)].join(' ').toLowerCase().includes(w)));
  }
  function page(records,number,size=25){const pages=Math.max(1,Math.ceil(records.length/size)),index=Math.min(pages,Math.max(1,Number(number)||1));return {items:records.slice((index-1)*size,index*size),page:index,pages,total:records.length};}
  function bulk(records,ids,patch){
    const chosen=new Set(ids);if(patch.status&&!['draft','review','published','archived'].includes(patch.status))throw Error('Unknown publication state.');
    if(patch.status==='published'&&records.some(r=>chosen.has(r.id)&&r.editorialReviewRequired))throw Error('Some selected stories still require editorial review. Clear the review flag only after reviewing each story.');
    return records.map(r=>{if(!chosen.has(r.id))return r;const next=clone(r);if(patch.status)next.status=patch.status;if(patch.category){next.primaryCategoryId ||= patch.category;next.categoryIds=[...new Set([next.primaryCategoryId,...next.categoryIds||[],patch.category])];}if(patch.tags?.length){const tags=new Set(next.tags||[]);for(const t of patch.tags)patch.tagAction==='remove'?tags.delete(t):tags.add(t);next.tags=[...tags];}return next;});
  }
  function csv(records){
    const keys=['id','title','slug','status','primaryCategoryId','province','district','tags','aiAssisted','editorialReviewRequired','mapDisplay'];
    const cell=v=>{let text=Array.isArray(v)?v.join('; '):String(v??'');if(/^\s*[=+\-@]/.test(text)||/^[\t\r]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};
    return [keys,...records.map(r=>keys.map(k=>r[k]))].map(row=>row.map(cell).join(',')).join('\r\n');
  }
  function component(original,values){return {...clone(original||{}),...values,latitude:values.latitude===''?null:Number(values.latitude),longitude:values.longitude===''?null:Number(values.longitude)};}
  function source(original,values){if(typeof original==='string'&&values.title===original&&!values.url&&!values.publisher&&!values.accessDate)return original;return {...(typeof original==='object'&&original?clone(original):{}),...values};}
  globalThis.VirsapurStudioTools={clone,terms,regions,categories,filter,page,bulk,csv,component,source};
})();
