const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

for (const form of document.querySelectorAll('[data-official-trip-booking]')) {
  const tripId = form.dataset.tripId;
  const section = form.closest('.official-trip-booking');
  const status = form.querySelector('[data-trip-booking-message]');
  const availability = section.querySelector('[data-trip-availability]');
  const paymentNote = section.querySelector('[data-trip-payment-note]');
  const totalNote = section.querySelector('[data-trip-total]');
  const privacyNote = form.querySelector('[data-trip-payment-privacy]');
  const signIn = section.querySelector('[data-trip-booking-signin]');
  const signInLink = section.querySelector('[data-trip-signin-link]');
  const requestButton = form.querySelector('[data-booking-action="request"]');
  const payButton = form.querySelector('[data-booking-action="pay"]');
  const actionButtons = [requestButton,payButton].filter(Boolean);
  const select = form.elements.seats;
  let checkoutEnabled=false,seatPrice=null,currency='PKR';
  const showTotal=()=>{
    if(!totalNote||!checkoutEnabled||seatPrice===null)return;
    const total=seatPrice*Number(select.value||1);
    totalNote.textContent=`Total: ${new Intl.NumberFormat('en-PK',{style:'currency',currency,maximumFractionDigits:2}).format(total)}`;
  };
  select.addEventListener('change',showTotal);
  const signInHref = () => {
    const target = new URL(form.dataset.loginUrl, window.location.href);
    target.searchParams.set('next', form.dataset.loginNext || `${form.dataset.tripUrl}#reserve`);
    return target.href;
  };

  const refresh = async () => {
    if (!select.isConnected) return;
    const response = await fetch(`/api/trip-bookings?tripId=${encodeURIComponent(tripId)}`, {headers:{accept:'application/json'}, credentials:'same-origin'});
    const data = await response.json();
    if (!response.ok) throw Error(data.error || 'Availability could not be loaded.');
    if (data.registrationState !== 'open') {
      availability.textContent = 'Reservations are closed for this trip.';
      select.disabled = true;
      actionButtons.forEach(button=>{button.disabled=true;button.textContent='Reservations closed';});
      return;
    }
    if (data.availableSeats === 0) {
      availability.textContent = 'This trip is fully booked.';
      select.disabled = true;
      actionButtons.forEach(button=>{button.disabled=true;button.textContent='Fully booked';});
      return;
    }
    checkoutEnabled=Boolean(data.checkoutEnabled);
    seatPrice=Number.isFinite(Number(data.seatPrice))?Number(data.seatPrice):null;
    currency=data.currency||'PKR';
    select.disabled = false;
    requestButton.disabled = false;
    requestButton.textContent='Request to book';
    if(payButton)payButton.textContent='Pay & book';
    if(payButton){payButton.hidden=!checkoutEnabled;payButton.disabled=!checkoutEnabled;}
    if(paymentNote)paymentNote.textContent=checkoutEnabled?`${new Intl.NumberFormat('en-PK',{style:'currency',currency,maximumFractionDigits:2}).format(seatPrice)} per seat. Pay securely now, or send a request without paying.`:data.paymentRequired?(data.paymentConfigured===false?'Online payment is not configured yet. You can still send a booking request.':'Add a valid seat price in the trip settings to enable online payment. You can still send a booking request.'):'';
    if(totalNote)totalNote.hidden=!checkoutEnabled;
    if(privacyNote)privacyNote.textContent=checkoutEnabled?'Request to book sends a request without payment. Pay & book opens secure Stripe Checkout; its seat hold lasts 30 minutes.':'Request to book sends your request to the trip team without collecting payment.';
    availability.textContent = data.availableSeats === null ? 'Seats are available.' : `${data.availableSeats} seat${data.availableSeats === 1 ? '' : 's'} remaining.`;
    [...select.options].forEach(option => { option.disabled = data.availableSeats !== null && Number(option.value) > data.availableSeats; });
    if (select.selectedOptions[0]?.disabled) select.value = [...select.options].find(option => !option.disabled)?.value || '';
    showTotal();
  };

  try {
    let sessionResponse = await fetch('/api/member-session', {headers:{accept:'application/json'}, credentials:'same-origin', cache:'no-store'});
    if (sessionResponse.status === 404) sessionResponse = await fetch('/api/auth/session', {headers:{accept:'application/json'}, credentials:'same-origin', cache:'no-store'});
    if (sessionResponse.status === 401 || sessionResponse.status === 403) {
      form.hidden = true;
      signIn.hidden = false;
      signInLink.href = signInHref();
    } else if (!sessionResponse.ok) {
      throw Error('Sign-in status could not be checked. Refresh the page to try again.');
    } else {
      const session = await sessionResponse.json();
      form.elements.fullName.value = session.user?.fullName || '';
      form.elements.email.value = session.user?.email || '';
      form.hidden = false;
    }
    await refresh();
  } catch (error) {
    availability.textContent = error.message;
    actionButtons.forEach(button=>button.disabled=true);
  }
  window.setInterval(() => { if (document.visibilityState === 'visible') refresh().catch(() => {}); }, 30000);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const bookingAction=event.submitter?.dataset.bookingAction||'request';
    status.textContent = 'Sending your request…';
    actionButtons.forEach(button=>button.disabled=true);
    try {
      const response = await fetch('/api/trip-bookings', {
        method:'POST',
        headers:{'content-type':'application/json', accept:'application/json'},
        credentials:'same-origin',
        body:JSON.stringify({tripId, fullName:form.elements.fullName.value, email:form.elements.email.value, phone:form.elements.phone.value, seats:Number(select.value),bookingAction})
      });
      const data = await response.json();
      if (response.status === 401) {
        signIn.hidden = false;
        signInLink.href = signInHref();
        status.textContent = 'Your session expired. Sign in again to submit this request.';
        return;
      }
      if (!response.ok) { if(response.status===409) await refresh(); throw Error(data.error || 'Your booking request could not be submitted.'); }
      if(data.checkoutUrl){status.textContent='Opening secure Stripe Checkout…';window.location.assign(data.checkoutUrl);return;}
      availability.textContent = `${data.booking.seats} seat${data.booking.seats===1?'':'s'} held while your request awaits review.`;
      form.innerHTML = `<div class="official-trip-confirmation" role="status"><span class="official-trip-confirmation-mark" aria-hidden="true">✓</span><p class="overline">REQUEST SUBMITTED</p><h3>We’ve received your request</h3><p class="official-trip-confirmation-intro">Your request for <strong>${esc(data.booking.seats)} seat${data.booking.seats === 1 ? '' : 's'}</strong> on <strong>${esc(data.booking.tripTitle)}</strong> is saved and awaiting review.</p><dl><div><dt>Booking reference</dt><dd><code>${esc(data.booking.id)}</code></dd></div><div><dt>Request status</dt><dd><span class="official-trip-confirmation-status">Awaiting approval</span></dd></div><div><dt>Account email</dt><dd>${esc(data.booking.email)}</dd></div></dl><p class="official-trip-confirmation-note">No payment was collected. Track the decision in My bookings.</p><div class="official-trip-confirmation-actions"><a class="button primary" href="${esc(form.dataset.bookingsUrl)}">View my bookings</a><a class="button secondary" href="${esc(form.dataset.returnUrl)}">Back to What’s On</a></div></div>`;
    } catch (error) {
      status.textContent = error.message;
      try { await refresh(); }
      catch { actionButtons.forEach(button=>button.disabled=false); }
    }
  });
}
