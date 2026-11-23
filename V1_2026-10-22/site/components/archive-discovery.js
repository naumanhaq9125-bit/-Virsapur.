/* Shared, dependency-free Archive query model. This module is also imported by build-time QA. */
export const ARCHIVE_PAGE_SIZE = 12;
const fields = ['q', 'category', 'province', 'district', 'tag', 'type'];
const list = value => [...new Set((Array.isArray(value) ? value : value ? [value] : []).map(String).filter(Boolean))];
const text = value => String(value || '').normalize('NFKC').toLocaleLowerCase('en').replace(/\s+/g, ' ').trim();
export const escapeArchiveHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function archiveState(input = {}, {lockedCategory = ''} = {}) {
  const get = key => input instanceof URLSearchParams ? input.get(key) : input[key];
  const state = Object.fromEntries(fields.map(key => [key, String(get(key) || '').trim().slice(0, 240)]));
  state.category = lockedCategory || state.category;
  const page = Number(get('page'));
  state.page = Number.isSafeInteger(page) && page > 0 ? page : 1;
  return state;
}
export function archiveQuery(state, {lockedCategory = ''} = {}) {
  const value = archiveState(state, {lockedCategory});
  const query = new URLSearchParams();
  for (const key of fields) if (value[key] && !(key === 'category' && lockedCategory)) query.set(key, value[key]);
  if (value.page > 1) query.set('page', String(value.page));
  return query.toString();
}
export function filterArchive(records, state, options = {}) {
  const s = archiveState(state, options);
  const terms = text(s.q).split(' ').filter(Boolean);
  return records.filter(record => (!s.category || list(record.categoryIds).includes(s.category)) &&
    (!s.province || list(record.provinceIds).includes(s.province)) &&
    (!s.district || list(record.districtIds).includes(s.district)) &&
    (!s.tag || list(record.tags).includes(s.tag)) && (!s.type || record.contentType === s.type) &&
    (!terms.length || terms.every(term => text(record.searchText || [record.title,record.summary,...list(record.tags)].join(' ')).includes(term))));
}
export function paginateArchive(records, state = {}, options = {}) {
  const filtered = filterArchive(records, state, options);
  const pages = Math.max(1, Math.ceil(filtered.length / ARCHIVE_PAGE_SIZE));
  const page = Math.min(archiveState(state, options).page, pages);
  return {records:filtered.slice((page - 1) * ARCHIVE_PAGE_SIZE, page * ARCHIVE_PAGE_SIZE), total:filtered.length, pages, page, pageSize:ARCHIVE_PAGE_SIZE};
}
export function archiveDistrictOptions(records, state, districts = [], options = {}) {
  const s = archiveState(state, options);
  // Only geography and the locked category constrain these options; keyword/tag changes must not erase valid selections.
  const scoped = filterArchive(records, {province:s.province, category:options.lockedCategory || ''}, options);
  const used = new Set(scoped.flatMap(record => list(record.districtIds)));
  return districts.filter(d => used.has(d.id) && (!s.province || !list(d.provinceIds).length || list(d.provinceIds).includes(s.province)));
}
export function rankRelatedStories(story, candidates, {limit = 4, includeUnpublished = false} = {}) {
  const explicit = list(story.relatedStoryIds);
  const shared = (a,b) => list(a).filter(value => list(b).includes(value)).length;
  const seen = new Set([story.id]);
  return candidates.filter(candidate => {
    if (seen.has(candidate.id) || (!includeUnpublished && candidate.status !== 'published')) return false;
    seen.add(candidate.id); return true;
  }).map((candidate, index) => {
    const explicitOrder = explicit.indexOf(candidate.id);
    const score = (explicitOrder < 0 ? 0 : 10000 - explicitOrder) + 30 * shared(story.relatedHeritageIds, candidate.relatedHeritageIds) +
      6 * shared(story.categoryIds, candidate.categoryIds) + 2 * shared(story.tags, candidate.tags);
    return {candidate, score, index};
  }).filter(item => item.score > 0).sort((a,b) => b.score - a.score || a.index - b.index).slice(0, Math.min(12, Math.max(0, Math.floor(Number(limit) || 0)))).map(item => item.candidate);
}
export function safeArchiveUrl(value) {
  const url = String(value || '').trim();
  if (!url || /[\u0000-\u0020<>"'`\\]/.test(url) || /^(?:javascript|data|vbscript):/i.test(url) || url.startsWith('//')) return '';
  return /^(?:https?:\/\/|\/?[\w./?%#-])/i.test(url) && !/^[a-z][a-z0-9+.-]*:/i.test(url.replace(/^https?:/i, '')) ? url : '';
}
export function sanitizeArchiveImage(image) {
  // The caller must positively clear usage rights for this environment; raw featuredImage is never implicitly trusted.
  if (!image || image.allowed !== true) return null;
  const src = safeArchiveUrl(image.src); if (!src) return null;
  const width = Math.max(1, Math.min(20000, Math.round(Number(image.width) || 1280)));
  const height = Math.max(1, Math.min(20000, Math.round(Number(image.height) || 720)));
  const sources = Array.isArray(image.sources) ? image.sources.map(s => ({src:safeArchiveUrl(s.src), width:Math.round(Number(s.width))})).filter(s => s.src && s.width > 0 && s.width <= 20000) : [];
  const focal=value=>Number.isFinite(Number(value))&&value!=null?Math.max(0,Math.min(100,Number(value))):50;
  return {src, sources, width, height, alt:String(image.alt || ''), focalX:focal(image.focalX), focalY:focal(image.focalY), sizes:'(max-width:700px) 86vw,(max-width:1000px) 44vw,30vw'};
}
export function renderArchiveCard(record) {
  const e = escapeArchiveHtml, image = record.image;
  const ratio = image ? image.width / image.height : 1;
  const shape = ratio >= 2 ? 'panoramic' : ratio >= 1.12 ? 'landscape' : ratio <= .86 ? 'portrait' : 'square';
  const media = image ? `<picture class="editorial-panel-image"><img src="${e(image.src)}"${image.sources?.length ? ` srcset="${e(image.sources.map(s=>`${s.src} ${s.width}w`).join(', '))}" sizes="${e(image.sizes)}"` : ''} width="${image.width}" height="${image.height}" alt="${e(image.alt)}" loading="lazy" decoding="async" style="object-position:${image.focalX}% ${image.focalY}%"></picture>` : '<div class="editorial-panel-image archive-discovery-placeholder" aria-hidden="true"><span>Virsapur Archive</span></div>';
  const date = /^\d{4}-\d{2}-\d{2}/.test(record.publishedAt || '') && !Number.isNaN(Date.parse(record.publishedAt)) ? new Date(record.publishedAt).toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}) : '';
  return `<article class="editorial-panel editorial-panel--story editorial-panel--portrait editorial-panel--media-${shape}"><a href="${e(safeArchiveUrl(record.url) || '#')}">${media}<div class="editorial-panel-body">${record.badge ? `<span class="status-badge">${e(record.badge)}</span>` : ''}<p class="overline">${e([record.categoryLabel,record.location].filter(Boolean).join(' · '))}</p><h3>${e(record.title)}</h3>${record.summary ? `<p class="editorial-panel-summary">${e(record.summary)}</p>` : ''}${date ? `<p class="editorial-panel-facts">${e(date)}</p>` : ''}<span class="editorial-panel-action">Read story <span aria-hidden="true">→</span></span></div></a><button class="save-article-button save-article-button--card" type="button" data-save-article="${e(record.id)}" data-article-title="${e(record.title)}" aria-pressed="false" aria-label="Save ${e(record.title)} to My Saved Articles"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 3.75h12a1 1 0 0 1 1 1v15.5L12 16l-7 4.25V4.75a1 1 0 0 1 1-1Z"/></svg><span>Save article</span></button></article>`;
}
export function renderArchivePagination(result, state, options = {}) {
  if (result.pages <= 1) return '';
  const e = escapeArchiveHtml;
  const link = (page,label,current=false) => `<a href="?${e(archiveQuery({...state,page},options))}" data-archive-page="${page}"${current ? ' aria-current="page"' : ''}>${e(label)}</a>`;
  const pages = [...new Set([1,result.pages,result.page-1,result.page,result.page+1])].filter(p=>p>0&&p<=result.pages).sort((a,b)=>a-b);
  let prior = 0;
  return (result.page > 1 ? link(result.page-1,'Previous') : '') + pages.map(page=>{const gap=prior&&page-prior>1?'<span aria-hidden="true">…</span>':'';prior=page;return gap+link(page,page,page===result.page);}).join('') + (result.page < result.pages ? link(result.page+1,'Next') : '');
}
export function initArchiveDiscovery(root) {
  if (root.dataset.archiveReady) return;
  const payload = root.querySelector('[data-archive-index]'); if (!payload) return;
  let data; try { data = JSON.parse(payload.textContent); } catch { return; }
  if (!Array.isArray(data.records)) return;
  const form = root.querySelector('[data-archive-form]'), grid = root.querySelector('[data-archive-grid]');
  const count = root.querySelector('[data-archive-count]'), pagination = root.querySelector('[data-archive-pagination]');
  if (!form || !grid || !count || !pagination) return;
  root.dataset.archiveReady='true';
  const options = {lockedCategory:data.lockedCategory || ''};
  let state, timer;
  const readUrl = () => archiveState(new URLSearchParams(window.location.search),options);
  function render({historyMode='', focus=false} = {}) {
    const districts = archiveDistrictOptions(data.records,state,data.facets.districts,options);
    if (state.district && !districts.some(d=>d.id===state.district)) state.district='';
    const districtControl = form.elements.namedItem('district');
    districtControl.innerHTML='<option value="">All districts</option>'+districts.map(d=>`<option value="${escapeArchiveHtml(d.id)}">${escapeArchiveHtml(d.label)}</option>`).join('');
    const result=paginateArchive(data.records,state,options);state.page=result.page;
    for (const key of fields) {const control=form.elements.namedItem(key);if(control)control.value=state[key];}
    grid.innerHTML=result.records.map(renderArchiveCard).join('');
    count.textContent=result.total ? `${(result.page-1)*ARCHIVE_PAGE_SIZE+1}–${Math.min(result.page*ARCHIVE_PAGE_SIZE,result.total)} of ${result.total} ${result.total===1?'story':'stories'}` : 'No stories match these filters.';
    const empty=root.querySelector('[data-archive-empty]');if(empty)empty.hidden=!!result.total;
    pagination.innerHTML=renderArchivePagination(result,state,options);
    if (historyMode) {const next=new URL(window.location.href);const query=archiveQuery(state,options);next.search=query;if(next.href!==window.location.href)window.history[historyMode](null,'',next);}
    if(focus)count.focus({preventScroll:true});
  }
  function apply(historyMode='pushState') {clearTimeout(timer);state=archiveState(Object.fromEntries(new FormData(form)),options);state.page=1;render({historyMode});}
  form.addEventListener('submit',event=>{event.preventDefault();apply();});
  form.addEventListener('change',event=>{if(event.target.name!=='q')apply();});
  form.addEventListener('input',event=>{if(event.target.name==='q'){clearTimeout(timer);timer=setTimeout(()=>apply(),250);}});
  form.addEventListener('reset',()=>{clearTimeout(timer);state=archiveState({},options);render({historyMode:'pushState'});queueMicrotask(()=>{for(const key of fields){const control=form.elements.namedItem(key);if(control)control.value=state[key];}});});
  pagination.addEventListener('click',event=>{const link=event.target.closest('[data-archive-page]');if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;event.preventDefault();clearTimeout(timer);state.page=Number(link.dataset.archivePage);render({historyMode:'pushState',focus:true});});
  window.addEventListener('popstate',()=>{clearTimeout(timer);state=readUrl();render();});
  state=readUrl();render({historyMode:'replaceState'});
}
if(typeof document!=='undefined'){
 const start=()=>document.querySelectorAll('[data-archive-discovery]').forEach(initArchiveDiscovery);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
