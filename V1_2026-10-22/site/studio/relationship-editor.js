// Shared relationship UI. The existing controller supplies local or authenticated hosted transport.
window.VirsapurRelationshipEditor = function(form,type,item,data) {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const definitions=[{field:'relatedHeritageIds',title:'Heritage Places',records:data.heritagePlaces||[],heritage:true}];
  const existing={stories:[['relatedStoryIds','Related Stories','stories'],['relatedProgrammeIds','Related Programmes','programmes'],['relatedProjectIds','Related Projects','projects']],programmes:[['relatedStoryIds','Related Stories','stories']],projects:[['relatedProgrammeIds','Related Programmes','programmes'],['relatedStoryIds','Related Stories','stories']],events:[]};
  definitions.push(...(existing[type]||[]).map(([field,title,collection])=>({field,title,records:data[collection]||[]})));
  const wrapper=document.createElement('div');wrapper.className='wide relationship-editors';
  const before=form.querySelector('[data-block-editor]');before.parentNode.insertBefore(wrapper,before);
  const collectors={};
  for(const definition of definitions){
    let selectedIds=[...(item[definition.field]||[])];
    const byId=new Map(definition.records.map(record=>[record.id,record]));
    const describe=record=>{
      if(!definition.heritage)return record.status||'';
      const context=data.heritageContext||{};
      const districts=(record.districtIds||[]).map(id=>context.districts?.[id]?.name||id);
      const regions=(record.provinceRegionIds||[]).map(id=>context.regions?.[id]||id);
      return [districts.join(' / '),regions.join(' / '),record.designationName||record.heritageCategory,record.status!=='published'?record.status:''].filter(Boolean).join(' · ');
    };
    const fieldset=document.createElement('fieldset');fieldset.className='relationship-picker';fieldset.dataset.relationship=definition.field;
    fieldset.innerHTML='<legend>'+esc(definition.title)+'</legend><p>'+(definition.heritage?'Choose exact places, not every place in a district. Selection order is preserved.':'Choose existing records. These are intentional editorial connections.')+'</p><label>Search '+esc(definition.title)+'<input type="search" data-relation-query autocomplete="off"></label><div class="relationship-results" data-relation-results></div><h3>Selected '+esc(definition.title)+'</h3><ol data-relation-selected></ol><p class="relationship-feedback" aria-live="polite"></p>';
    wrapper.append(fieldset);
    const query=fieldset.querySelector('[data-relation-query]'),results=fieldset.querySelector('[data-relation-results]'),selection=fieldset.querySelector('[data-relation-selected]'),feedback=fieldset.querySelector('.relationship-feedback');
    const notify=message=>{feedback.textContent=message;form.dispatchEvent(new Event('input',{bubbles:true}));};
    const drawResults=()=>{
      const words=query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const matches=definition.records.filter(record=>record.id!==item.id&&!selectedIds.includes(record.id)&&record.status!=='archived'&&(!definition.heritage||(record.recordType==='place'&&record.heritageDomain==='cultural-tangible'))&&words.every(word=>[record.title,record.shortTitle,record.heritageCategory,record.designationName,...record.aliases||[],describe(record)].join(' ').toLowerCase().includes(word)));
      results.innerHTML=matches.slice(0,20).map(record=>'<button type="button" data-relation-add="'+esc(record.id)+'" aria-label="Add '+esc(record.shortTitle||record.title)+'"><strong>'+esc(record.shortTitle||record.title)+'</strong><small>'+esc(describe(record))+'</small><span>Add +</span></button>').join('')||'<p>No matching records.</p>';
      if(matches.length>20)results.insertAdjacentHTML('beforeend','<p>Showing 20 matches. Refine your search.</p>');
      results.querySelectorAll('[data-relation-add]').forEach(button=>button.addEventListener('click',()=>{selectedIds.push(button.dataset.relationAdd);drawSelection();drawResults();notify('Selection added. Save this record to retain changes.');query.focus();}));
    };
    const drawSelection=()=>{
      selection.innerHTML=selectedIds.map((id,index)=>{const record=byId.get(id),name=record?.shortTitle||record?.title||('Missing record: '+id);return '<li><span><strong>'+esc(name)+'</strong><small>'+esc(record?describe(record):'Unknown reference — remove or correct before saving')+'</small></span><div><button type="button" data-relation-up="'+index+'" '+(index===0?'disabled':'')+' aria-label="Move '+esc(name)+' up">↑</button><button type="button" data-relation-down="'+index+'" '+(index===selectedIds.length-1?'disabled':'')+' aria-label="Move '+esc(name)+' down">↓</button><button type="button" data-relation-remove="'+index+'" aria-label="Remove '+esc(name)+'">Remove</button></div></li>';}).join('')||'<li>No places or records selected.</li>';
      const change=(button,kind)=>{const index=Number(button.dataset[kind]);if(kind==='relationRemove')selectedIds.splice(index,1);else{const next=index+(kind==='relationUp'?-1:1);[selectedIds[index],selectedIds[next]]=[selectedIds[next],selectedIds[index]];}drawSelection();drawResults();notify('Selection updated. Save this record to retain the order.');query.focus();};
      for(const [attr,key]of [['up','relationUp'],['down','relationDown'],['remove','relationRemove']])selection.querySelectorAll('[data-relation-'+attr+']').forEach(button=>button.addEventListener('click',()=>change(button,key)));
    };
    query.addEventListener('input',drawResults);drawSelection();drawResults();
    collectors[definition.field]=()=>[...selectedIds];
  }
  form._collectRelationships=()=>Object.fromEntries(Object.entries(collectors).map(([field,collect])=>[field,collect()]));
};
