import {archiveState,filterArchive,paginateArchive,archiveDistrictOptions,rankRelatedStories,renderArchiveCard,renderArchivePagination,sanitizeArchiveImage,escapeArchiveHtml} from '../components/archive-discovery.js';
export {archiveState,filterArchive,paginateArchive,archiveDistrictOptions,rankRelatedStories};
const unique = values => [...new Set(values.filter(Boolean).map(String))];
const array = value => Array.isArray(value) ? value : value ? [value] : [];
const entries = value => Array.isArray(value) ? value : (value instanceof Map ? [...value.entries()] : Object.entries(value || {})).map(([id,item])=>typeof item==='string'?{id,name:item}:{id,...item});
const serialize = value => JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');

/** Factory consumes caller-visible stories only. No publication rules or inverse relationships are persisted here.
 * imageForStory(story,route) => {allowed:true,src,sources:[{src,width}],width,height,alt,focalX,focalY} | null.
 * allowed must reflect the existing environment's media-rights policy; omitted/false renders a neutral placeholder.
 * href(route,target) and asset(route,path) are the existing builder helpers.
 */
export function createArchiveDiscovery({stories=[],categories=[],places=[],districts={},regions={},href=(_route,path)=>path,asset=(_route,path)=>path,imageForStory=()=>null,preview=false,esc=escapeArchiveHtml}={}) {
  const categoryById=new Map(categories.map(c=>[c.id,c]));
  const placeById=new Map(places.map(p=>[p.id,p]));
  const districtById=new Map(entries(districts).map(d=>[d.id,d]));
  const regionById=new Map(entries(regions).map(r=>[r.id,r]));
  const resolve=(value,map)=>map.has(value)?value:[...map.values()].find(item=>[item.name,item.title,...array(item.aliases)].some(label=>String(label||'').toLowerCase()===String(value).toLowerCase()))?.id||value;
  const sortLabel=(a,b)=>a.label.localeCompare(b.label,'en');
  function metadata(route,story) {
    const linked=array(story.relatedHeritageIds).map(id=>placeById.get(id)).filter(Boolean);
    const districtIds=unique([...array(story.districtIds||story.relatedDistrictIds).filter(Boolean),...linked.flatMap(p=>array(p.districtIds)),...array(story.district)].map(id=>resolve(id,districtById))).filter(id=>!districtById.size||districtById.has(id));
    const provinceIds=unique([...array(story.provinceIds||story.provinceRegionIds||story.province).flatMap(value=>String(value).split(/[;,]/).map(v=>v.trim())),...array(story.relatedProvinceIds),...linked.flatMap(p=>array(p.provinceRegionIds)),...districtIds.map(id=>districtById.get(id)?.parentRegionId)].map(id=>resolve(id,regionById)));
    const categoryIds=unique(array(story.categoryIds));
    const tags=unique(array(story.tags));
    const categoryLabel=categoryById.get(story.primaryCategoryId)?.title||categoryById.get(categoryIds[0])?.title||story.category||'Story';
    // Deliberate allowlist: no body, blocks, references, internal notes or raw content records in the index.
    return {id:String(story.id),title:String(story.title||''),summary:String(story.summary||''),url:href(route,`/archives/${story.slug}`),categoryIds,categoryLabel,provinceIds,districtIds,tags,contentType:String(story.contentType||story.kind||'story'),location:String(story.location||''),publishedAt:String(story.publishedAt||''),badge:preview?(story.demo?'DEMO':story.status!=='published'?story.status:''):'',image:sanitizeArchiveImage(imageForStory(story,route)),searchText:[story.title,story.summary,story.location,story.author,...tags,...categoryIds.map(id=>categoryById.get(id)?.title||id),...provinceIds.map(id=>regionById.get(id)?.name||id),...districtIds.map(id=>districtById.get(id)?.name||id)].filter(Boolean).join(' ')};
  }
  function index(route,{lockedCategory=''}={}) {
    const records=stories.filter(s=>!lockedCategory||array(s.categoryIds).includes(lockedCategory)).map(s=>metadata(route,s));
    const facet=(field,map)=>unique(records.flatMap(r=>array(r[field]))).map(id=>({id,label:map?.get(id)?.shortTitle||map?.get(id)?.title||map?.get(id)?.name||id})).sort(sortLabel);
    const districtFacets=facet('districtIds',districtById).map(d=>({...d,provinceIds:districtById.has(d.id)?array(districtById.get(d.id).parentRegionId):unique(records.filter(r=>r.districtIds.includes(d.id)).flatMap(r=>r.provinceIds))}));
    return {version:1,pageSize:12,lockedCategory,records,facets:{categories:facet('categoryIds',categoryById),provinces:facet('provinceIds',regionById),districts:districtFacets,tags:facet('tags'),types:facet('contentType')}};
  }
  function render(route,{lockedCategory='',initialState={},id='archive-discovery',includeAssets=true}={}) {
    const data=index(route,{lockedCategory}),options={lockedCategory};
    const state=archiveState(initialState,options),result=paginateArchive(data.records,state,options);state.page=result.page;
    const select=(name,label,values,all,locked=false)=>`<label>${esc(label)}<select name="${name}"${locked?' disabled':''}><option value="">${esc(all)}</option>${values.map(v=>`<option value="${esc(v.id)}"${state[name]===v.id?' selected':''}>${esc(v.label)}</option>`).join('')}</select></label>`;
    const allDistricts=archiveDistrictOptions(data.records,state,data.facets.districts,options);
    const count=result.total?`${(result.page-1)*12+1}–${Math.min(result.page*12,result.total)} of ${result.total} ${result.total===1?'story':'stories'}`:'No stories match these filters.';
    return `<section class="collection-tools archive-collection archive-discovery section" id="${esc(id)}" data-archive-discovery><h2 class="visually-hidden">Archive stories</h2><form class="filters filters--archive" data-archive-form role="search" aria-label="Search Archive stories"><label>Keyword<input name="q" type="search" value="${esc(state.q)}" autocomplete="off" placeholder="Search places, objects, stories"></label>${select('category','Category',data.facets.categories,'All categories',!!lockedCategory)}${select('province','Province / region',data.facets.provinces,'All regions')}${select('district','District',allDistricts,'All districts')}${select('tag','Theme / tag',data.facets.tags,'All tags')}${select('type','Content type',data.facets.types,'All types')}<button class="button" type="submit">Search</button><button class="filter-reset" type="reset">Clear filters</button></form><div class="archive-result-line"><p data-archive-count role="status" aria-live="polite" aria-atomic="true" tabindex="-1">${esc(count)}</p><span>Explore researched places, objects and cultural memory</span></div><div class="editorial-panel-grid editorial-panel-grid--stories archive-collection-grid" data-archive-grid>${result.records.map(renderArchiveCard).join('')}</div><p class="archive-discovery-empty" data-archive-empty${result.total?' hidden':''}>Try another keyword, or clear a filter to explore more stories.</p><nav class="pagination" aria-label="Archive pages" data-archive-pagination>${renderArchivePagination(result,state,options)}</nav><noscript><p>Interactive search and pagination require JavaScript. The first twelve stories are available above; individual story links remain usable.</p></noscript><script type="application/json" data-archive-index>${serialize(data)}</script></section>${includeAssets?`<link rel="stylesheet" href="${esc(asset(route,'archive-discovery.css'))}"><script type="module" src="${esc(asset(route,'components/archive-discovery.js'))}"></script>`:''}`;
  }
  return {index,render,relatedStories:(story,options={})=>rankRelatedStories(story,stories,{includeUnpublished:preview,...options})};
}
