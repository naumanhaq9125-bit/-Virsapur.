(async () => {
  const area = document.querySelector('[data-member-area]');
  if (!area) return;
  const session=window.virsapurAuthReady?await window.virsapurAuthReady:await fetch('/api/auth/session',{credentials:'same-origin'}).then(response=>response.ok?response.json():null).then(result=>result?.user||null);
  if (!session) { window.location.replace(area.dataset.loginUrl || '../login/'); return; }
  const showTripError=message=>{const host=document.querySelector('[data-member-trips],[data-member-travel-history],[data-trip-view]');if(host)host.innerHTML=`<p class="profile-empty">${message}</p>`;const status=document.querySelector('[data-trip-form-status]');if(status)status.textContent=message;};
  let tripResponse;
  try{tripResponse=await fetch('/api/member/trips',{credentials:'same-origin',cache:'no-store'});}catch{showTripError('Your trips could not be reached. Refresh after the local server is running.');return;}
  if(!tripResponse.ok){showTripError('Your trips could not be loaded from the database. Please sign in again or restart the local server.');return;}
  let trips=(await tripResponse.json()).items||[];
  const readTrips = () => trips;
  const saveTrips = async nextTrips => {
    const previous=trips;
    for(const trip of nextTrips){const response=await fetch('/api/member/trips',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({trip})});const result=await response.json().catch(()=>({}));if(!response.ok)throw Error(result.error||'Your trip could not be saved.');}
    for(const trip of previous)if(!nextTrips.some(item=>item.id===trip.id)){const response=await fetch(`/api/member/trips/${encodeURIComponent(trip.id)}`,{method:'DELETE',credentials:'same-origin'});if(!response.ok)throw Error('Your trip could not be deleted.');}
    trips=nextTrips;
    document.querySelectorAll('[data-member-trips-count]').forEach(node=>node.textContent=trips.length);
    document.querySelectorAll('[data-completed-trips-count]').forEach(node=>node.textContent=trips.filter(trip=>trip.status==='completed').length);
  };
  const updateHistoryCount = () => document.querySelectorAll("[data-completed-trips-count]").forEach(node=>node.textContent=readTrips().filter(trip=>trip.status==="completed").length);
  const esc = value => String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const displayDate = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}) : 'Date not set';

  const renderTripCard = (trip, viewUrl, editUrl, historyMode=false) => {
    const completed=trip.status==='completed';
    const request=trip.adminRequest,activeRequest=request&&request.status!=='closed';
    const requestLabel=!activeRequest?'Submit to Virsapur':request.status==='new'||request.status==='reviewing'?'Update submitted plan':request.status==='declined'?'Resubmit updated plan':request.status==='quoted'?'Response available':['confirmed','approved'].includes(request.status)?'Plan approved':'Request '+request.status;
    const requestDisabled=activeRequest&&!['new','reviewing','declined'].includes(request.status);
    const requestState={new:'Received',reviewing:'Under review',quoted:'Response available',confirmed:'Approved',approved:'Approved',declined:'Declined',closed:'Closed'}[request?.status]||request?.status;
    const requestNote=activeRequest?`<p class="trip-admin-request-note">Virsapur response: <strong>${esc(requestState)}</strong>${request.id?` · ${esc(request.id)}`:''}</p>`:'';
    const requestAction=!historyMode&&!completed?`<button type="button" class="button primary" data-submit-trip-request="${esc(trip.id)}" ${requestDisabled?'disabled':''}>${requestLabel}</button>`:'';
    const actions=historyMode?`<a class="button primary" href="${esc(viewUrl)}?id=${encodeURIComponent(trip.id)}">View tour</a>`:`<a class="button secondary" href="${esc(viewUrl)}?id=${encodeURIComponent(trip.id)}">View</a><a class="button secondary" href="${esc(editUrl)}?id=${encodeURIComponent(trip.id)}">Edit</a>${requestAction}<button type="button" class="trip-complete-button" data-toggle-trip-complete="${esc(trip.id)}">${completed?'Reopen':'Mark complete'}</button><button type="button" class="trip-delete-button" data-delete-trip="${esc(trip.id)}">Delete</button>`;
    return `<article class="member-trip-card${historyMode?' member-trip-card--history':''}"><div class="member-trip-card-copy"><p class="overline">${historyMode?'COMPLETED TOUR':esc(trip.tripType||trip.travelerGroup||'CUSTOM TRIP')} <span class="trip-status-chip ${completed?'is-completed':''}">${completed?(trip.completedAt?esc(displayDate(trip.completedAt.slice(0,10))):'Completed'):'Planned'}</span></p><h2>${esc(trip.tripName)}</h2><p>${esc(trip.startingLocation)} <span aria-hidden="true">→</span> ${trip.destinations?.length||0} destinations</p><p class="member-trip-dates">${esc(displayDate(trip.startDate))} – ${esc(displayDate(trip.endDate))} · ${Number(trip.travelerCount)||1} travelers</p>${requestNote}</div><div class="member-trip-card-actions">${actions}</div></article>`;
  };

  const list = document.querySelector('[data-member-trips]');
  if (list) {
    const requestStatus=document.querySelector('[data-trip-request-status]');
    const render = () => {
      const trips=readTrips().slice().sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
      list.innerHTML=trips.length?trips.map(trip=>renderTripCard(trip,list.dataset.viewUrl,list.dataset.editUrl)).join(''):'<div class="profile-empty trip-empty"><h2>No trips saved yet</h2><p>Plan a custom tour and mark it complete after you travel to add it to your history.</p><a class="button primary" href="new/index.html">Plan your first trip</a></div>';
    };
    render();
    list.addEventListener('click',async event=>{
      const submit=event.target.closest('[data-submit-trip-request]');
      if(submit){const trip=readTrips().find(item=>item.id===submit.dataset.submitTripRequest);if(!trip)return;submit.disabled=true;submit.textContent='Sending to Virsapur…';if(requestStatus)requestStatus.textContent='Submitting your saved itinerary for admin review…';try{const response=await fetch(`/api/member/trips/${encodeURIComponent(trip.id)}/submit`,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({})});const result=await response.json().catch(()=>({}));if(!response.ok)throw Error(result.error||'Your trip could not be submitted.');trip.adminRequest=result.request;render();if(requestStatus)requestStatus.textContent=result.updated?'Your custom itinerary was sent to Virsapur for review. You can track its status on this card.':`This plan is already in the ${result.request.status} stage. The existing request is shown on the card.`;}catch(error){if(requestStatus)requestStatus.textContent=error.message;submit.disabled=false;submit.textContent='Try submitting again';}return;}
      const toggle=event.target.closest('[data-toggle-trip-complete]');
      if(toggle){const trip=readTrips().find(item=>item.id===toggle.dataset.toggleTripComplete);if(!trip)return;if(trip.status==='completed'){delete trip.status;delete trip.completedAt;}else{trip.status='completed';trip.completedAt=new Date().toISOString();}trip.updatedAt=new Date().toISOString();try{await saveTrips(readTrips());updateHistoryCount();render();}catch(error){window.alert(error.message);}return;}
      const button=event.target.closest('[data-delete-trip]');if(!button)return;if(!window.confirm('Delete this saved trip?'))return;try{await saveTrips(readTrips().filter(trip=>trip.id!==button.dataset.deleteTrip));render();}catch(error){window.alert(error.message);}
    });
  }

  const history=document.querySelector('[data-member-travel-history]');
  if(history){
    const render=()=>{const trips=readTrips().filter(trip=>trip.status==='completed').sort((a,b)=>(b.completedAt||b.updatedAt||'').localeCompare(a.completedAt||a.updatedAt||''));history.innerHTML=trips.length?trips.map(trip=>renderTripCard(trip,history.dataset.viewUrl,'',true)).join(''):'<div class="profile-empty trip-empty"><h2>Your travel history will appear here</h2><p>After completing a saved trip, mark it complete in My trips to keep its itinerary here.</p><a class="button secondary" href="'+esc(history.dataset.tripsUrl)+'">Go to My trips</a></div>';};
    render();
  }
  const planner=document.querySelector('[data-trip-planner]');
  if (planner) {
    const form=planner.querySelector('[data-trip-form]');
    const phaseButtons=[...planner.querySelectorAll('[data-phase-button]')];
    const phases=[...planner.querySelectorAll('[data-trip-phase]')];
    const search=planner.querySelector('[data-trip-place-search]');
    const results=planner.querySelector('[data-trip-search-results]');
    const selectedList=planner.querySelector('[data-trip-selected]');
    const status=planner.querySelector('[data-trip-form-status]');
    const places=JSON.parse(document.getElementById('trip-place-data').textContent);
    const params=new URLSearchParams(location.search);let currentPhase=1;
    let selected=[];
    const id=params.get('id');
    const original=readTrips().find(trip=>trip.id===id);
    if(original){
      form.elements.tripId.value=original.id;
      for(const key of ['tripName','startingLocation','startDate','endDate','travelerGroup','travelerCount','transportation','tripType','budget','travelPace'])if(original[key]!=null)form.elements[key].value=original[key];
      selected=(original.destinations||[]).filter(item=>places.some(place=>place.id===item.id)).map(item=>({id:item.id,day:Number(item.day)||1}));
      planner.querySelector('[data-trip-form-title]').textContent='Update your trip';
      planner.querySelector('[data-trip-save]').textContent='Save changes';
    }
    const dates=()=>{const start=form.elements.startDate.value,end=form.elements.endDate.value;if(start&&end){const diff=Math.floor((Date.parse(`${end}T12:00:00`)-Date.parse(`${start}T12:00:00`))/86400000);return Math.max(1,Math.min(60,diff+1));}return 1;};
    const setPhase=number=>{currentPhase=number;phases.forEach(panel=>panel.hidden=Number(panel.dataset.tripPhase)!==number);phaseButtons.forEach(button=>{const active=Number(button.dataset.phaseButton)===number;button.classList.toggle('is-active',active);if(active)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});if(number===3)renderReview();planner.querySelector(`[data-trip-phase="${number}"] .trip-phase-heading`)?.scrollIntoView({block:'start',behavior:'smooth'});};
    const validatePhase=number=>{const panel=planner.querySelector(`[data-trip-phase="${number}"]`);if(number===1){const start=form.elements.startDate,end=form.elements.endDate;end.setCustomValidity(start.value&&end.value&&end.value<start.value?'End date must be on or after the start date.':'');}if(number===2&&!selected.length){status.textContent='Add at least one destination to continue.';search.focus();return false;}const invalid=[...panel.querySelectorAll('input,select')].find(field=>!field.checkValidity());if(invalid){const label=invalid.closest('label')?.firstChild?.textContent?.trim()||'this field';status.textContent=`Please complete ${label.toLocaleLowerCase()} before continuing.`;invalid.focus();invalid.reportValidity();return false;}status.textContent='';return true;};
    const renderSearch=()=>{const query=search.value.trim().toLocaleLowerCase();if(!query){results.innerHTML='<p class="profile-search-hint">Search for a place by name to add it to your itinerary.</p>';return;}const matches=places.filter(place=>`${place.title} ${place.category} ${place.region}`.toLocaleLowerCase().includes(query)).slice(0,8);results.innerHTML=matches.length?matches.map(place=>`<article class="trip-search-result"><div><span>${esc(place.category)}</span><h3>${esc(place.title)}</h3><p>${esc(place.region)}</p></div><button type="button" data-trip-add-place="${esc(place.id)}" ${selected.some(item=>item.id===place.id)?'disabled':''}>${selected.some(item=>item.id===place.id)?'Added':'Add stop'}</button></article>`).join(''):'<p class="profile-empty">No heritage places match that search.</p>';};
    const renderSelected=()=>{const maxDay=dates();selected=selected.map(item=>({...item,day:Math.max(1,Math.min(maxDay,item.day))}));planner.querySelector('[data-trip-selected-count]').textContent=`${selected.length} ${selected.length===1?'destination':'destinations'}`;selectedList.innerHTML=selected.length?selected.map((item,index)=>{const place=places.find(record=>record.id===item.id);return `<li class="trip-selected-item"><span class="trip-order">${index+1}</span><div class="trip-selected-copy"><strong>${esc(place?.title||'Heritage place')}</strong><small>${esc(place?.region||'Pakistan')}</small></div><label class="trip-day-label">Day<select data-trip-day="${esc(item.id)}">${Array.from({length:maxDay},(_,i)=>`<option value="${i+1}" ${item.day===i+1?'selected':''}>Day ${i+1}</option>`).join('')}</select></label><div class="trip-order-actions"><button type="button" aria-label="Move ${esc(place?.title)} up" data-trip-move="up" data-trip-id="${esc(item.id)}" ${index===0?'disabled':''}>↑</button><button type="button" aria-label="Move ${esc(place?.title)} down" data-trip-move="down" data-trip-id="${esc(item.id)}" ${index===selected.length-1?'disabled':''}>↓</button></div><button type="button" class="trip-remove-stop" data-trip-remove="${esc(item.id)}">Remove</button></li>`;}).join(''):'<li class="profile-empty">No destinations yet. Search above to add your first stop.</li>';renderSearch();};
    const values=()=>Object.fromEntries(['tripName','startingLocation','startDate','endDate','travelerGroup','travelerCount','transportation','tripType','budget','travelPace'].map(key=>[key,form.elements[key].value]));
    const renderReview=()=>{const data=values();const ordered=selected.map((item,index)=>({place:places.find(place=>place.id===item.id),...item,index}));planner.querySelector('[data-trip-review]').innerHTML=`<dl class="trip-review-grid"><div><dt>Trip</dt><dd>${esc(data.tripName||'—')}</dd></div><div><dt>Starting location</dt><dd>${esc(data.startingLocation||'—')}</dd></div><div><dt>Travel dates</dt><dd>${esc(displayDate(data.startDate))} – ${esc(displayDate(data.endDate))}</dd></div><div><dt>Travelers</dt><dd>${esc(data.travelerGroup||'—')} · ${esc(data.travelerCount||'1')}</dd></div><div><dt>Transportation</dt><dd>${esc(data.transportation||'—')}</dd></div><div><dt>Trip type</dt><dd>${esc(data.tripType||'—')}</dd></div><div><dt>Estimated budget</dt><dd>${data.budget?`PKR ${Number(data.budget).toLocaleString()}`:'Not set'}</dd></div><div><dt>Travel pace</dt><dd>${esc(data.travelPace||'—')}</dd></div></dl><h4>Destinations in order</h4><ol class="trip-review-stops">${ordered.length?ordered.map(item=>`<li>Day ${item.day}: ${esc(item.place?.title||'Heritage place')}</li>`).join(''):'<li>No destinations selected yet</li>'}</ol>`;};
    const syncDateRange=()=>{const start=form.elements.startDate,end=form.elements.endDate;end.min=start.value;if(start.value&&(!end.value||end.value<start.value))end.value=start.value;end.setCustomValidity('');renderSelected();};
    form.elements.startDate.addEventListener('change',syncDateRange);
    form.elements.endDate.addEventListener('change',renderSelected);
    search.addEventListener('input',renderSearch);
    planner.addEventListener('click',event=>{const next=event.target.closest('[data-trip-next]');if(next){if(validatePhase(currentPhase))setPhase(Number(next.dataset.tripNext));return;}const previous=event.target.closest('[data-trip-prev]');if(previous){setPhase(Number(previous.dataset.tripPrev));return;}const step=event.target.closest('[data-phase-button]');if(step){const target=Number(step.dataset.phaseButton);if(target<=currentPhase||validatePhase(currentPhase))setPhase(target);return;}const add=event.target.closest('[data-trip-add-place]');if(add&&!selected.some(item=>item.id===add.dataset.tripAddPlace)){selected.push({id:add.dataset.tripAddPlace,day:1});renderSelected();return;}const remove=event.target.closest('[data-trip-remove]');if(remove){selected=selected.filter(item=>item.id!==remove.dataset.tripRemove);renderSelected();return;}const move=event.target.closest('[data-trip-move]');if(move){const index=selected.findIndex(item=>item.id===move.dataset.tripId),target=index+(move.dataset.tripMove==='up'?-1:1);if(index>=0&&target>=0&&target<selected.length){[selected[index],selected[target]]=[selected[target],selected[index]];renderSelected();}}});
    planner.addEventListener('change',event=>{const select=event.target.closest('[data-trip-day]');if(select){const item=selected.find(destination=>destination.id===select.dataset.tripDay);if(item)item.day=Number(select.value);}});
    form.addEventListener('input',()=>{if(currentPhase===3)renderReview();});
    form.addEventListener('change',()=>{if(currentPhase===3)renderReview();});
    form.addEventListener('submit',async event=>{event.preventDefault();if(!validatePhase(1)){setPhase(1);return;}if(!validatePhase(2)){setPhase(2);return;}if(!validatePhase(3)){setPhase(3);return;}const data=values();const trips=readTrips();const editing=trips.find(trip=>trip.id===form.elements.tripId.value);const trip={...(editing||{}),...data,id:editing?.id||crypto.randomUUID?.()||`trip-${Date.now()}`,travelerCount:Number(data.travelerCount)||1,budget:data.budget?Number(data.budget):null,destinations:selected.map(item=>({...item})),createdAt:editing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};const next=editing?trips.map(item=>item.id===trip.id?trip:item):[trip,...trips];const button=planner.querySelector('[data-trip-save]');button.disabled=true;status.textContent='Saving your trip to your account…';try{await saveTrips(next);status.textContent='Trip saved. Opening My trips…';window.location.assign(planner.dataset.tripListUrl);}catch(error){status.textContent=error.message;button.disabled=false;}});
    syncDateRange();
    renderSelected();renderReview();setPhase(1);
  }

  const view=document.querySelector('[data-trip-view]');
  if(view){
    const trip=readTrips().find(item=>item.id===new URLSearchParams(location.search).get('id'));
    if(!trip){view.innerHTML=`<p class="profile-empty">We couldn’t find that trip in your account.</p><a class="button primary" href="${esc(view.dataset.listUrl)}">Back to My trips</a>`;}
    else{const places=(()=>{try{return JSON.parse(document.getElementById('trip-place-data')?.textContent||'[]');}catch{return [];}})();const details=[['Starting location',trip.startingLocation],['Travel dates',`${displayDate(trip.startDate)} – ${displayDate(trip.endDate)}`],['Travelers',`${trip.travelerGroup} · ${trip.travelerCount}`],['Transportation',trip.transportation],['Trip type',trip.tripType],['Estimated budget',trip.budget?`PKR ${Number(trip.budget).toLocaleString()}`:'Not set'],['Travel pace',trip.travelPace]];document.querySelector('[data-trip-view-title]').textContent=trip.tripName;view.innerHTML=`<div class="trip-view-toolbar"><span class="trip-view-status">${trip.status==="completed"?"Completed tour":"Saved itinerary"}</span><div><a class="button secondary" href="${esc(view.dataset.editUrl)}?id=${encodeURIComponent(trip.id)}">Edit trip</a><button class="trip-delete-button" type="button" data-view-delete="${esc(trip.id)}">Delete trip</button></div></div><dl class="trip-review-grid">${details.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><section class="trip-view-destinations"><p class="overline">YOUR ROUTE</p><h2>Destinations in order</h2><ol>${(trip.destinations||[]).map((item,index)=>{const place=places.find(record=>record.id===item.id);return `<li><span>${index+1}</span><div><strong>${esc(place?.title||'Heritage place')}</strong><small>Day ${Number(item.day)||1} · ${esc(place?.region||'Pakistan')}</small></div><a href="${esc(place?.path||'#')}">View place</a></li>`;}).join('')||'<li>No destinations saved.</li>'}</ol></section>`;view.addEventListener('click',async event=>{const button=event.target.closest('[data-view-delete]');if(!button)return;if(!window.confirm('Delete this saved trip?'))return;try{await saveTrips(readTrips().filter(item=>item.id!==button.dataset.viewDelete));window.location.assign(view.dataset.listUrl);}catch(error){window.alert(error.message);}});}
  }
})();
