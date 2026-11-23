const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=value=>'PKR '+Number(value).toLocaleString('en-PK');
const date=value=>new Date(value).toLocaleString('en-PK',{timeZone:'Asia/Karachi',dateStyle:'long',timeStyle:'short'});
document.querySelectorAll('[data-activity-catalogue]').forEach(catalogue=>{
  const search=catalogue.querySelector('[data-activity-search]'),type=catalogue.querySelector('[data-activity-type]'),rows=[...catalogue.querySelectorAll('[data-activity]')];
  const filter=()=>{const words=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);let count=0;for(const row of rows){row.hidden=!!((type.value&&row.dataset.family!==type.value)||words.some(word=>!row.dataset.search.includes(word)));if(!row.hidden)count++;}catalogue.querySelector('[data-activity-count]').textContent=count+' available '+(count===1?'activity':'activities');catalogue.querySelector('[data-activity-empty]').hidden=count!==0;};
  search.addEventListener('input',filter);type.addEventListener('change',filter);
});
document.querySelectorAll('[data-booking]').forEach(section=>{
  const form=section.querySelector('form'),events=JSON.parse(section.querySelector('[data-booking-events]').textContent),dialog=section.querySelector('dialog'),message=section.querySelector('[data-booking-message]'),payMessage=section.querySelector('[data-payment-message]'),result=section.querySelector('[data-booking-result]');
  let payload=null,requestId=null,busy=false,signature='',ticketUrl=null;
  const event=()=>events.find(e=>e.id===form.elements.eventId.value);
  const update=()=>{
    const qty=Number(form.elements.quantity.value),valid=Number.isInteger(qty)&&qty>=1&&qty<=20;
    const container=section.querySelector('[data-participants]');const old=[...container.querySelectorAll('input')].map(input=>input.value);
    if(valid&&container.children.length!==qty)container.innerHTML=Array.from({length:qty},(_,i)=>`<label>Participant ${i+1}<input name="participant" required maxlength="120" value="${esc(old[i]||'')}" placeholder="Participant name"></label>`).join('');
    section.querySelector('[data-booking-total]').textContent=valid?money(event().amount*qty):'Choose a valid quantity';
    section.querySelector('[data-departure-summary]').textContent=money(event().amount)+' per participant · '+event().duration+' · '+event().location;
  };
  form.elements.quantity.addEventListener('input',update);form.elements.eventId.addEventListener('change',update);update();
  form.addEventListener('submit',e=>{
    e.preventDefault();if(busy||!form.reportValidity())return;
    payload={eventId:event().id,quantity:Number(form.elements.quantity.value),customer:form.elements.customer.value,email:form.elements.email.value,participants:[...form.querySelectorAll('[name=participant]')].map(input=>input.value)};
    const nextSignature=JSON.stringify(payload);if(signature!==nextSignature){requestId=null;signature=nextSignature;}
    section.querySelector('[data-booking-review]').innerHTML=`<h3>${esc(event().title)}</h3><p>${esc(date(event().start))}<br>${esc(event().location)}</p><p>${payload.quantity} participant${payload.quantity===1?'':'s'} · ${money(event().amount)} each</p><ol>${payload.participants.map(name=>`<li>${esc(name)}</li>`).join('')}</ol><p class="booking-total">Total <strong>${money(event().amount*payload.quantity)}</strong></p>`;
    payMessage.textContent='';dialog.showModal();
  });
  section.querySelector('[data-booking-close]').addEventListener('click',()=>{if(!busy)dialog.close();});
  dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
  const ticketHtml=order=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Virsapur sample tickets · ${esc(order.id)}</title><style>body{font-family:Arial,sans-serif;background:#f5f5f3;color:#293036;margin:0;padding:32px}main{max-width:780px;margin:auto}article{padding:32px;background:white;border:1px solid #c7ccd0;margin:24px 0;break-inside:avoid}h1,h2{font-family:Georgia,serif}small{letter-spacing:.15em}dl{display:grid;grid-template-columns:150px 1fr;gap:12px}dd{margin:0}.sample{color:#9a4a30;border-top:1px solid #ddd;padding-top:20px}button{padding:12px} @media print{body{padding:0;background:white}button{display:none}}</style></head><body><main><small>VIRSAPUR · LOCAL BOOKING PREVIEW</small><h1>Your sample tickets</h1><p>Booking ${esc(order.id)} · ${money(order.total)} simulated total</p><button onclick="window.print()">Print / Save as PDF</button>${order.tickets.map(ticket=>`<article><small>SAMPLE · NOT VALID FOR ADMISSION</small><h2>${esc(order.title)}</h2><dl><dt>Participant</dt><dd>${esc(ticket.name)}</dd><dt>Date (Pakistan)</dt><dd>${esc(date(order.start))}</dd><dt>Location</dt><dd>${esc(order.location)}</dd><dt>Ticket reference</dt><dd>${esc(ticket.id)}</dd><dt>Sample price</dt><dd>${money(order.amount)}</dd></dl><p class="sample">Demonstration only. No payment was collected or email sent. Final ticket design and real payment integration are pending.</p></article>`).join('')}</main></body></html>`;
  dialog.querySelectorAll('[data-booking-outcome]').forEach(button=>button.addEventListener('click',async()=>{
    if(busy||!payload)return;const outcome=button.dataset.bookingOutcome;
    if(requestId&&payload.outcome!==outcome){payMessage.textContent='Retry the same payment outcome first: its previous result has not yet been confirmed.';return;}
    payload.outcome=outcome;requestId ||= crypto.randomUUID();busy=true;
    dialog.querySelectorAll('button').forEach(b=>b.disabled=true);payMessage.textContent='Saving the local demonstration…';
    try{
      const response=await fetch('/api/local-bookings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...payload,requestId})});
      const data=await response.json();if(!response.ok)throw Error(data.error||'Could not save this demonstration.');
      requestId=null;const order=data.order;dialog.close();
      if(order.status==='success'){
        if(ticketUrl)URL.revokeObjectURL(ticketUrl);ticketUrl=URL.createObjectURL(new Blob([ticketHtml(order)],{type:'text/html;charset=utf-8'}));
        form.hidden=true;result.hidden=false;result.innerHTML=`<p class="overline">Simulation complete</p><h2>Your sample booking is confirmed</h2><p>${esc(order.title)} · ${esc(date(order.start))}</p><p>${order.quantity} participants · ${money(order.total)} simulated</p><p>Booking reference: <strong>${esc(order.id)}</strong></p><ol>${order.tickets.map(t=>`<li>${esc(t.name)} <small>${esc(t.id)}</small></li>`).join('')}</ol><a class="button primary" href="${ticketUrl}" download="Virsapur-${esc(order.id)}-tickets.html">Download sample tickets →</a><p>Open the downloaded file to print or save as PDF. No real payment was made and no email was sent.</p><button class="text-action" type="button" data-book-again>Try another booking</button>`;
        result.querySelector('[data-book-again]').addEventListener('click',()=>{result.hidden=true;form.hidden=false;message.textContent='';form.elements.quantity.focus();});result.focus();
      }else{message.textContent=order.status==='declined'?'Payment declined in this simulation. No places reserved or tickets issued. You can try again.':'Payment cancelled. No places reserved or tickets issued. You can try again.';message.scrollIntoView({block:'center',behavior:'smooth'});}
    }catch(error){payMessage.textContent=error.message+' If the connection was interrupted, retry the same outcome; it will not create a duplicate booking.';}
    finally{busy=false;dialog.querySelectorAll('button').forEach(b=>b.disabled=false);}
  }));
});
