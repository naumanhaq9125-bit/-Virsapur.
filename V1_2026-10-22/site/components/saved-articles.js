(() => {
  const root=document.querySelector('[data-saved-articles]');if(!root)return;
  const headers={};
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const articles=JSON.parse(document.getElementById('saved-article-data').textContent);
  const status=root.querySelector('[data-saved-articles-status]');
  const count=document.querySelectorAll('[data-saved-articles-count]');
  let items=[];
  const updateCount=()=>count.forEach(node=>node.textContent=items.length);
  const render=()=>{
    const byId=new Map(articles.map(article=>[article.id,article]));
    const selected=items.map(item=>byId.get(item.articleId)).filter(Boolean);
    root.querySelector('[data-saved-articles-grid]').innerHTML=selected.length?selected.map(article=>`<article class="saved-article-card">${article.image?`<a class="saved-article-image" href="${escapeHtml(article.path)}"><img src="${escapeHtml(article.image.src)}" alt="${escapeHtml(article.image.alt||article.title)}" loading="lazy" decoding="async"></a>`:'<div class="saved-article-image saved-article-image--empty" aria-hidden="true"><span>Virsapur Archive</span></div>'}<div class="saved-article-copy"><p class="overline">${escapeHtml(article.category||'Story')}${article.date?` · ${escapeHtml(article.date)}`:''}</p><h2><a href="${escapeHtml(article.path)}">${escapeHtml(article.title)}</a></h2><p>${escapeHtml(article.summary)}</p><div class="saved-article-actions"><a class="button primary" href="${escapeHtml(article.path)}">Read Article</a><button type="button" class="saved-article-remove" data-remove-saved-article="${escapeHtml(article.id)}">Remove bookmark</button></div></div></article>`).join(''):'<div class="profile-empty saved-articles-empty"><h2>No saved articles yet</h2><p>Bookmark a story from Archives & Stories and it will appear here.</p><a class="button primary" href="../../archives/index.html">Explore Archives & Stories</a></div>';
    updateCount();
  };
  root.addEventListener('click',async event=>{
    const button=event.target.closest('[data-remove-saved-article]');if(!button)return;
    button.disabled=true;status.textContent='Removing bookmark…';
    try{const response=await fetch(`/api/saved-articles/${encodeURIComponent(button.dataset.removeSavedArticle)}`,{method:'DELETE',credentials:'same-origin',headers});if(!response.ok){const result=await response.json().catch(()=>({}));throw new Error(result.error||'The bookmark could not be removed.');}items=items.filter(item=>item.articleId!==button.dataset.removeSavedArticle);status.textContent='Bookmark removed.';render();}
    catch(error){button.disabled=false;status.textContent=error.message;}
  });
  fetch('/api/saved-articles',{headers,credentials:'same-origin',cache:'no-store'}).then(async response=>{const result=await response.json().catch(()=>({}));if(response.status===401){window.location.replace(root.dataset.loginUrl||'../login/');return;}if(!response.ok)throw new Error(result.error||'Saved articles could not be loaded.');items=(result.items||[]).filter(item=>articles.some(article=>article.id===item.articleId));status.textContent='';render();}).catch(error=>{status.textContent=error.message;root.querySelector('[data-saved-articles-grid]').innerHTML='<p class="profile-empty">Saved articles could not be loaded. Refresh to try again.</p>';});
})();
