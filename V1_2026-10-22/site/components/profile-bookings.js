const host=document.querySelector('[data-member-bookings]');
if(host){
  const loginUrl=host.dataset.loginUrl||'/login/';
  const whatsOnUrl=host.dataset.whatsOnUrl||'/whats-on/';
  const session=window.virsapurAuthReady?await window.virsapurAuthReady:await fetch('/api/auth/session',{credentials:'same-origin',cache:'no-store'}).then(response=>response.ok?response.json():null).then(result=>result?.user||null);
  if(!session){window.location.replace(loginUrl);}
  else{
    const status=host.querySelector('[data-member-bookings-status]'),list=host.querySelector('[data-member-bookings-list]');
    const labels={pending:'Awaiting review',confirmed:'Confirmed',declined:'Declined',cancelled:'Cancelled'};
    try{
      const checkoutReturned=new URLSearchParams(window.location.search).get('checkout')==='success';
      let data;
      for(let attempt=0;;attempt++){
        const response=await fetch('/api/member/trip-bookings',{credentials:'same-origin',cache:'no-store'});
        data=await response.json();
        if(!response.ok)throw Error(data.error||'Your booking requests could not be loaded.');
        const checkoutPending=checkoutReturned&&(data.items||[]).some(item=>item.paymentStatus==='checkout_pending');
        if(!checkoutPending||attempt>=5)break;
        await new Promise(resolve=>window.setTimeout(resolve,2000));
      }
      const items=data.items||[];
      document.querySelectorAll('[data-member-bookings-count]').forEach(node=>node.textContent=items.length);
      list.innerHTML=items.length?items.map(item=>{const paid=item.paymentStatus==='paid',paymentPending=item.paymentStatus==='checkout_pending',needsReview=item.paymentStatus==='paid_needs_review';const paidTotal=(paid||needsReview)&&item.paymentAmount?new Intl.NumberFormat('en-PK',{style:'currency',currency:item.paymentCurrency||'PKR',maximumFractionDigits:2}).format(item.paymentAmount/100):'';return `<article class="member-booking-card"><div class="member-booking-heading"><div><p class="overline">OFFICIAL HERITAGE TRIP</p><h2>${esc(item.tripTitle)}</h2></div><span class="member-booking-status member-booking-status--${esc(item.status)}">${labels[item.status]||esc(item.status)}</span></div><dl><div><dt>Booking reference</dt><dd><code>${esc(item.id)}</code></dd></div><div><dt>Travelers</dt><dd>${Number(item.seats)} ${Number(item.seats)===1?'seat':'seats'}</dd></div>${item.paymentStatus&&item.paymentStatus!=='not_required'?`<div><dt>Payment</dt><dd>${paid?`Paid${paidTotal?` · ${esc(paidTotal)}`:''}`:needsReview?`Under review${paidTotal?` · ${esc(paidTotal)}`:''}`:paymentPending?'Checkout pending':esc(item.paymentStatus)}</dd></div>`:''}<div><dt>Request sent</dt><dd>${esc(new Date(item.createdAt).toLocaleString())}</dd></div></dl><p class="member-booking-note">${paid?'Your payment is confirmed and your seats are reserved. Keep this reference for your trip.':needsReview?'Your payment was received and is being checked by the Virsapur team. We will contact you about your seat confirmation.':paymentPending?'Complete checkout in the open Stripe tab. The seat hold expires after 30 minutes.':item.status==='pending'?'Your request has been received. The Virsapur team will review it and update the status here.':item.status==='confirmed'?'Your seats are confirmed. Keep this reference for your trip.':item.status==='declined'?'This request was declined. Contact Virsapur if you need help.':'This booking request was cancelled.'}</p><a class="text-action" href="${esc(whatsOnUrl)}">Browse official trips</a></article>`;}).join(''):`<div class="profile-empty"><h2>No booking requests yet</h2><p>When you request seats on an official heritage trip, its approval status will appear here.</p><a class="button primary" href="${esc(whatsOnUrl)}">Explore official trips</a></div>`;
      status.textContent=checkoutReturned?(items.some(item=>item.paymentStatus==='paid')?'Payment confirmed. Your seats are reserved.':items.some(item=>item.paymentStatus==='paid_needs_review')?'Payment received. The trip team is checking your booking.':items.some(item=>item.paymentStatus==='checkout_pending')?'Payment return received. Booking confirmation updates after Stripe verifies it.':'No active Stripe checkout was found for this account.'):(items.length?`${items.length} booking ${items.length===1?'request':'requests'} on your account.`:'');
    }catch(error){status.textContent=error.message;list.innerHTML='<div class="profile-empty"><p>Booking requests could not be loaded. Please refresh and try again.</p></div>';}
  }
}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
