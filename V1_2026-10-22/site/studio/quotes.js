// Shared private request console; hosted transport remains gated and authenticated server-side.
window.VirsapurQuotesView = async function (panel, request, data, { hosted = false } = {}) {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
  const statuses = ['new', 'reviewing', 'quoted', 'confirmed', 'approved', 'declined', 'closed'];
  const labels = {new:'New request',reviewing:'Under review',quoted:'Response available',confirmed:'Approved',approved:'Approved',declined:'Declined',closed:'Closed'};
  const places = new Map((data.heritagePlaces || []).map(place => [place.id, place.title]));
  const endpoint = id => hosted ? '/api/admin-custom-tour-quotes?id=' + encodeURIComponent(id) : '/api/admin/custom-tour-quotes/' + encodeURIComponent(id);
  let page = 1, items = [], selectedId = '';
  panel.innerHTML = '<section class="quote-console">' +
    '<header class="quote-console-header"><div><p class="overline">TRAVELER SUBMISSIONS</p><h2>Custom tour requests</h2><p>Review the proposed route, contact the traveler, then approve or decline the plan.</p></div></header>' +
    '<p class="quote-console-note">Approval records your decision and updates the traveler’s dashboard. Contact the traveler separately to discuss logistics; this does not book official trip seats or collect payment.</p>' +
    '<form data-quote-filters class="quote-filters"><label>Search by traveler, trip or reference<input name="query" type="search" placeholder="Name, email, trip or reference"></label><label>Request status<select name="status"><option value="">All statuses</option>' + statuses.map(status => '<option value="' + status + '">' + labels[status] + '</option>').join('') + '</select></label><button class="primary" type="submit">Search requests</button></form>' +
    '<div class="quote-console-layout"><section class="quote-inbox" aria-label="Custom tour requests"><p class="quote-result-count" role="status" data-quote-count>Loading requests…</p><div class="quote-request-list" data-quote-list></div><nav class="quote-pagination" data-quote-pages aria-label="Request pages"></nav></section>' +
    '<section class="quote-detail" data-quote-editor aria-live="polite"><div class="quote-detail-empty"><h3>Select a request</h3><p>Traveler and itinerary details will appear here.</p></div></section></div></section>';
  const filters = panel.querySelector('[data-quote-filters]');
  const list = panel.querySelector('[data-quote-list]');
  const count = panel.querySelector('[data-quote-count]');
  const pages = panel.querySelector('[data-quote-pages]');
  const editor = panel.querySelector('[data-quote-editor]');

  async function load() {
    try {
      const query = new URLSearchParams({[hosted ? 'q' : 'query']:filters.elements.query.value,status:filters.elements.status.value,page});
      const result = await request((hosted ? '/api/admin-custom-tour-quotes?' : '/api/admin/custom-tour-quotes?') + query);
      if (!panel.isConnected) return;
      items = result.items || [];
      page = result.page;
      count.textContent = result.total + ' ' + (result.total === 1 ? 'request' : 'requests') + ' · Page ' + page + ' of ' + result.pages;
      list.innerHTML = items.length ? items.map(item => {
        const active = item.id === selectedId;
        return '<button type="button" data-open-quote="' + esc(item.id) + '" class="quote-request-card' + (active ? ' is-selected' : '') + '" aria-pressed="' + active + '">' +
          '<span class="quote-request-card-top"><span class="quote-status quote-status--' + esc(item.status) + '">' + esc(labels[item.status] || item.status) + '</span><small>' + esc(item.id) + '</small></span>' +
          '<strong>' + esc(item.customTrip?.tripName || item.customerName || 'Custom tour request') + '</strong>' +
          '<span class="quote-request-meta">' + esc(item.customerName || 'Traveler') + ' · ' + esc(item.requestedDate || 'Date flexible') + ' · ' + Number(item.groupSize || 0) + ' travelers</span>' +
          '<span class="quote-request-email">' + esc(item.email) + '</span></button>';
      }).join('') : '<p class="quote-empty">No requests match these filters.</p>';
      pages.innerHTML = result.pages > 1 ? '<button type="button" data-page="' + (page - 1) + '" ' + (page === 1 ? 'disabled' : '') + '>Previous</button><span>' + page + ' / ' + result.pages + '</span><button type="button" data-page="' + (page + 1) + '" ' + (page === result.pages ? 'disabled' : '') + '>Next</button>' : '';
      if (selectedId && !items.some(item => item.id === selectedId)) {
        selectedId = '';
        editor.innerHTML = '<div class="quote-detail-empty"><h3>Select a request</h3><p>Traveler and itinerary details will appear here.</p></div>';
      } else if (selectedId) renderDetail(selectedId);
    } catch (error) { count.textContent = error.message; }
  }

  function renderDetail(id) {
    const item = items.find(record => record.id === id);
    if (!item) return;
    const trip = item.customTrip;
    const destinations = trip?.destinations || item.heritagePlaceIds.map(placeId => ({id:placeId,day:null}));
    const itinerary = destinations.length ? '<ol class="quote-itinerary">' + destinations.map((stop,index) =>
      '<li><span class="quote-stop-number">' + (index + 1) + '</span><div><strong>' + esc(places.get(stop.id) || stop.title || stop.id) + '</strong><small>' + (stop.day ? 'Day ' + Number(stop.day) : 'Destination') + '</small></div></li>'
    ).join('') + '</ol>' : '<p class="quote-empty">No destinations were included.</p>';
    let decision = '';
    if (item.status === 'declined' || item.status === 'closed') decision = '<p class="quote-terminal-note">This request is closed. The traveler can submit an updated plan to reopen review.</p>';
    else if (item.status === 'approved' || item.status === 'confirmed') decision = '<p class="quote-terminal-note">This plan is approved. Contact the traveler to coordinate details and confirm arrangements.</p>';
    else decision = '<div class="quote-decision-actions">' + (item.status === 'new' ? '<button type="button" class="button secondary" data-quick-status="reviewing">Start review</button>' : '') +
      '<button type="button" class="button primary" data-quick-status="approved">Approve plan</button><button type="button" class="button danger" data-quick-status="declined">Decline request</button></div>';
    const tripDetails = trip
      ? '<section class="quote-detail-section"><div class="quote-detail-section-heading"><div><p class="overline">PROPOSED ITINERARY</p><h3>' + esc(trip.tripName || 'Custom trip') + '</h3></div></div>' +
        '<dl class="quote-facts"><div><dt>Starting location</dt><dd>' + esc(trip.startingLocation) + '</dd></div><div><dt>Travel dates</dt><dd>' + esc(trip.startDate) + ' – ' + esc(trip.endDate) + '</dd></div><div><dt>Travel group</dt><dd>' + esc(trip.travelerGroup) + ' · ' + Number(trip.travelerCount) + ' travelers</dd></div><div><dt>Transportation</dt><dd>' + esc(trip.transportation) + '</dd></div><div><dt>Trip type</dt><dd>' + esc(trip.tripType) + '</dd></div><div><dt>Travel pace</dt><dd>' + esc(trip.travelPace) + '</dd></div><div><dt>Estimated budget</dt><dd>' + (trip.budget == null ? 'Not set' : 'PKR ' + Number(trip.budget).toLocaleString()) + '</dd></div></dl><h4>Destinations in visiting order</h4>' + itinerary + '</section>'
      : '<section class="quote-detail-section"><p class="overline">CUSTOM TOUR REQUEST</p><h3>' + Number(item.groupSize) + ' travelers · ' + esc(item.durationPreference) + '</h3><p>' + esc(item.specialRequirements || 'No additional preferences supplied.') + '</p>' + itinerary + '</section>';
    editor.innerHTML = '<header class="quote-detail-header"><div><p class="overline">REQUEST DETAILS</p><h2>' + esc(item.customerName || 'Traveler') + '</h2><span class="quote-status quote-status--' + esc(item.status) + '">' + esc(labels[item.status] || item.status) + '</span></div><small>' + esc(item.id) + '</small></header>' +
      '<section class="quote-detail-section"><h3>Traveler contact</h3><dl class="quote-facts"><div><dt>Email</dt><dd><a href="mailto:' + esc(item.email) + '">' + esc(item.email) + '</a></dd></div><div><dt>Phone</dt><dd>' + esc(item.phone || 'Not provided') + '</dd></div><div><dt>Preferred date</dt><dd>' + esc(item.requestedDate || 'Flexible') + '</dd></div><div><dt>Group / transport</dt><dd>' + Number(item.groupSize || 0) + ' travelers · ' + esc(item.transportPreference || 'Not specified') + '</dd></div></dl>' + (item.notes ? '<p class="quote-traveler-note"><strong>Traveler note</strong>' + esc(item.notes) + '</p>' : '') + '</section>' +
      tripDetails + '<section class="quote-decision-panel"><div><p class="overline">ADMIN DECISION</p><h3>Review this request</h3></div>' + decision +
      '<a class="button secondary" href="mailto:' + esc(item.email) + '?subject=' + encodeURIComponent('Virsapur trip request ' + item.id) + '">Contact traveler by email</a><p class="quote-action-feedback" role="status" data-quote-feedback></p></section>' +
      '<details class="quote-edit-details"><summary>Advanced update: quote and internal notes</summary><form data-quote-edit class="quote-edit-form"><label>Status<select name="status">' +
      statuses.map(status => '<option value="' + status + '" ' + (status === item.status ? 'selected' : '') + '>' + esc(labels[status] || status) + '</option>').join('') +
      '</select></label><label>Manual quote amount (optional)<input name="quotedAmount" type="number" min="0" max="100000000" step=".01" value="' + esc(item.quotedAmount ?? '') + '"></label><label>Currency<input name="quoteCurrency" maxlength="3" pattern="[A-Z]{3}" value="' + esc(item.quoteCurrency || 'PKR') + '" required></label><label class="wide">Internal notes<textarea name="internalNotes" maxlength="10000" rows="4">' + esc(item.internalNotes || '') + '</textarea></label><button class="button secondary" type="submit">Save advanced update</button></form></details>';
    const feedback = editor.querySelector('[data-quote-feedback]');
    async function updateRequest(values, message) {
      editor.querySelectorAll('button').forEach(button => { button.disabled = true; });
      feedback.textContent = 'Saving decision…';
      try {
        await request(endpoint(id), {method:'PATCH',body:JSON.stringify(values)});
        feedback.textContent = message;
        await load();
      } catch (error) {
        feedback.textContent = error.message;
        editor.querySelectorAll('button').forEach(button => { button.disabled = false; });
      }
    }
    editor.querySelectorAll('[data-quick-status]').forEach(button => button.addEventListener('click', () => {
      const status = button.dataset.quickStatus;
      updateRequest({status}, status === 'approved' ? 'Plan approved. Contact the traveler to coordinate next steps.' : status === 'declined' ? 'Request declined. The traveler can submit an updated plan.' : 'Request marked as under review.');
    }));
    editor.querySelector('[data-quote-edit]').addEventListener('submit', event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      values.quotedAmount = values.quotedAmount === '' ? null : Number(values.quotedAmount);
      updateRequest(values, 'Advanced request details saved.');
    });
  }
  filters.addEventListener('submit', event => { event.preventDefault(); page = 1; selectedId = ''; load(); });
  list.addEventListener('click', event => {
    const button = event.target.closest('[data-open-quote]');
    if (!button) return;
    selectedId = button.dataset.openQuote;
    load();
  });
  pages.addEventListener('click', event => {
    const button = event.target.closest('[data-page]');
    if (button) { page = Number(button.dataset.page); load(); }
  });
  await load();
};
