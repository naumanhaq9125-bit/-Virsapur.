(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const siteHeader = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#navigation");
  let lastFocus = null;

  const closeMenu = ({ restoreFocus = false } = {}) => {
    if (!menuButton || !navigation) return;
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    if (restoreFocus && lastFocus) lastFocus.focus();
  };

  menuButton?.addEventListener("click", () => {
    const opening = menuButton.getAttribute("aria-expanded") !== "true";
    lastFocus = document.activeElement;
    navigation?.classList.toggle("open", opening);
    menuButton.setAttribute("aria-expanded", String(opening));
    document.body.classList.toggle("menu-open", opening);
    if (opening) navigation?.querySelector("a")?.focus();
  });
  navigation?.addEventListener("click", event => event.target.closest("a") && closeMenu());
  document.addEventListener("keydown", event => event.key === "Escape" && closeMenu({ restoreFocus: true }));
  window.addEventListener("resize", () => window.innerWidth > 1000 && closeMenu());

  if (siteHeader) {
    let headerFrame = 0;
    const updateHeader = () => {
      headerFrame = 0;
      siteHeader.classList.toggle("is-scrolled", window.scrollY > 36);
    };
    window.addEventListener("scroll", () => {
      if (!headerFrame) headerFrame = window.requestAnimationFrame(updateHeader);
    }, { passive: true });
    updateHeader();
  }

  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    document.documentElement.classList.add("motion-ready");
    const revealSelectors = [
      ".discovery-hero-content > *",
      ".editorial-panel-grid > .editorial-panel",
      ".home-about .about-mosaic",
      ".home-final-action > div",
      ".page-hero.has-image .page-hero-image",
      ".work-opening-image, .work-method-image",
      ".programme-opening-image"
    ];
    const revealItems = [...new Set(document.querySelectorAll(revealSelectors.join(",")))];
    revealItems.forEach(item => {
      const siblings = [...item.parentElement.children].filter(sibling => revealItems.includes(sibling));
      item.classList.add("reveal-item");
      item.style.setProperty("--reveal-delay", `${Math.min(siblings.indexOf(item) * 60, 300)}ms`);
    });
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .1, rootMargin: "0px 0px -7%" });
    revealItems.forEach(item => revealObserver.observe(item));

    const mapShells = document.querySelectorAll("[data-heritage-map]");
    const mapObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-map-visible");
        mapObserver.unobserve(entry.target);
      });
    }, { threshold: .16 });
    mapShells.forEach(shell => mapObserver.observe(shell));
  }

  const map = document.querySelector("[data-heritage-map][data-map-scripts]");
  if (map) {
    const loadMap = async () => {
      if (map.dataset.mapLoading) return;
      map.dataset.mapLoading = "true";
      let scripts = [];
      try { scripts = JSON.parse(map.dataset.mapScripts); } catch { return; }
      for (const src of scripts) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.body.append(script);
        });
      }
    };
    if (location.hash.startsWith("#map/")) {
      loadMap().catch(() => { map.dataset.mapError = "true"; });
    } else if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer.disconnect();
          loadMap().catch(() => { map.dataset.mapError = "true"; });
        }
      }, { rootMargin: "500px" });
      observer.observe(map);
    } else {
      loadMap().catch(() => { map.dataset.mapError = "true"; });
    }
  }

  const form = document.querySelector("[data-contact-form]");
  if (form) {
    const note = form.querySelector("[data-form-note]");
    const type = new URLSearchParams(location.search).get("type");
    const select = form.querySelector("select[name='type']");
    if (type && select && [...select.options].some(option => option.value === type)) select.value = type;
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        if (note) note.textContent = "Please complete the required fields. Nothing has been sent.";
        return;
      }
      const connected = document.body.dataset.contactConnected === "true";
      if (!connected && note) {
        note.innerHTML = 'Online submissions are temporarily unavailable. Please email <a href="mailto:virsapur@gmail.com">virsapur@gmail.com</a>.';
      }
    });
  }

  const archiveSearch = document.querySelector("[data-archive-search]");
  const archiveGrid = document.querySelector("[data-archive-grid]");
  const archiveResults = document.querySelector("[data-archive-results]");
  if (archiveSearch && archiveGrid) {
    const cards = [...archiveGrid.querySelectorAll("[data-search]")];
    archiveSearch.addEventListener("input", () => {
      const query = archiveSearch.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach(card => {
        const match = !query || card.dataset.search.includes(query);
        card.hidden = !match;
        if (match) visible += 1;
      });
      if (archiveResults) archiveResults.textContent = `${visible} ${visible === 1 ? "story" : "stories"}`;
    });
  }

  const collection = document.querySelector("[data-collection]");
  if (collection) {
    const records = [...collection.children];
    const search = document.querySelector("[data-collection-search]");
    const filters = [...document.querySelectorAll("[data-filter]")];
    const count = document.querySelector("[data-collection-count]");
    const pagination = document.querySelector("[data-pagination]");
    const pageSize = 9;
    let page = 1;
    const params = new URLSearchParams(location.search);
    if (search) search.value = params.get("q") || "";
    filters.forEach(input => { if (params.has(input.name || input.dataset.filter)) input.value = params.get(input.name || input.dataset.filter); });
    const update = () => {
      const query = search?.value.trim().toLowerCase() || "";
      const matches = records.filter(card => {
        const text = `${card.dataset.title || ""} ${card.textContent}`.toLowerCase();
        return (!query || text.includes(query)) && filters.every(input => !input.value || (card.dataset[input.dataset.filter] || "").toLowerCase().includes(input.value.toLowerCase()));
      });
      const pages = Math.max(1, Math.ceil(matches.length / pageSize)); page = Math.min(page, pages);
      records.forEach(card => card.hidden = true);
      matches.slice((page - 1) * pageSize, page * pageSize).forEach(card => card.hidden = false);
      if (count) count.textContent = `${matches.length} ${matches.length === 1 ? "result" : "results"}`;
      if (pagination) {
        pagination.replaceChildren(...Array.from({ length: pages }, (_, index) => {
          const button = document.createElement("button"); button.type = "button"; button.textContent = String(index + 1);
          if (index + 1 === page) button.setAttribute("aria-current", "page");
        button.addEventListener("click", () => { page = index + 1; update(); pagination.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "nearest" }); });
          return button;
        }));
      }
      const next = new URLSearchParams(); if (query) next.set("q", search.value.trim());
      filters.forEach(input => input.value && next.set(input.name || input.dataset.filter, input.value));
      history.replaceState(null, "", `${location.pathname}${next.size ? `?${next}` : ""}${location.hash}`);
    };
    search?.addEventListener("input", () => { page = 1; update(); });
    filters.forEach(input => input.addEventListener("input", () => { page = 1; update(); }));
    document.querySelector("[data-collection-filters]")?.addEventListener("reset", () => setTimeout(() => { page = 1; update(); }));
    update();
  }

  const escapeResult = value => String(value ?? "").replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
  const siteSearch = document.querySelector("[data-site-search]");
  if (siteSearch) {
    const records = JSON.parse(document.querySelector("#search-index")?.textContent || "[]");
    const results = document.querySelector("[data-search-results]"); const count = document.querySelector("[data-search-count]");
    let page=1;const pageSize=20;const pages=document.createElement('nav');pages.className='pagination';pages.setAttribute('aria-label','Search result pages');results.after(pages);
    siteSearch.value = new URLSearchParams(location.search).get("q") || "";
    const update = () => {
      const query = siteSearch.value.trim().toLowerCase();
      const matches = query ? records.filter(item => `${item.title} ${item.summary} ${item.typeLabel||item.type} ${item.searchText||""}`.toLowerCase().includes(query)) : [];
      const pageCount=Math.max(1,Math.ceil(matches.length/pageSize));page=Math.min(page,pageCount);
      if(count)count.textContent=query?`${matches.length} results${matches.length?` · Page ${page} of ${pageCount}`:''}`:'Enter a word or phrase.';
      if (results) results.innerHTML = matches.slice((page-1)*pageSize,page*pageSize).map(item => `<a class="search-result" href="${escapeResult(item.url)}"><small>${escapeResult(item.typeLabel||item.type)}</small><strong>${escapeResult(item.title)}</strong><span>${escapeResult(item.summary || "")}</span></a>`).join("");
      pages.replaceChildren();if(pageCount>1)for(const [label,delta]of [['Previous',-1],['Next',1]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=page+delta<1||page+delta>pageCount;button.addEventListener('click',()=>{page+=delta;update();results.querySelector('a')?.focus();});pages.append(button);}
      history.replaceState(null, "", `${location.pathname}${query ? `?q=${encodeURIComponent(siteSearch.value.trim())}` : ""}`);
    };
    siteSearch.addEventListener("input",()=>{page=1;update();}); update();
  }

  const checkoutDialog = document.querySelector("[data-checkout-dialog]");
  if (checkoutDialog) {
    let current = null;
    const qty = checkoutDialog.querySelector("[data-checkout-qty]"); const total = checkoutDialog.querySelector("[data-checkout-total]");
    const updateTotal = () => total.textContent = `PKR ${Number(current?.amount || 0) * Number(qty.value || 1)}`;
    document.querySelectorAll("[data-checkout]").forEach(button => button.addEventListener("click", () => {
      current = { id: button.dataset.eventId, title: button.dataset.title, amount: Number(button.dataset.amount) };
      checkoutDialog.querySelector("[data-checkout-title]").textContent = current.title; qty.value = "1"; updateTotal(); checkoutDialog.showModal();
    }));
    qty.addEventListener("input", updateTotal);
    checkoutDialog.querySelectorAll("[data-checkout-result]").forEach(button => button.addEventListener("click", async event => {
      event.preventDefault(); const status = button.dataset.checkoutResult;
      const order = { eventId: current.id, title: current.title, quantity: Number(qty.value), amount: current.amount, total: current.amount * Number(qty.value), customer: checkoutDialog.querySelector("[data-checkout-name]").value, status, createdAt: new Date().toISOString() };
      try { await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(order) }); } catch {}
      checkoutDialog.querySelector("[data-checkout-message]").textContent = status === "success" ? "Demo order recorded. No real payment was processed." : `Demo ${status} result recorded.`;
    }));
  }
})();

(() => {
  const cards = [...document.querySelectorAll('[data-trip-card-id]')];
  if (!cards.length) return;
  const refreshAvailability = async () => {
    await Promise.all(cards.map(async card => {
      const label = card.querySelector('[data-trip-card-availability]');
      if (!label) return;
      try {
        const response = await fetch(`/api/trip-bookings?tripId=${encodeURIComponent(card.dataset.tripCardId)}`, {
          headers: { accept: 'application/json' },
          credentials: 'same-origin',
          cache: 'no-store'
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.availableSeats === 0 || data.registrationState !== 'open') {
          label.textContent = 'Fully booked';
        } else if (data.availableSeats === null) {
          label.textContent = 'Places available';
        } else {
          label.textContent = `${data.availableSeats} ${data.availableSeats === 1 ? 'seat' : 'seats'} remaining`;
        }
      } catch {}
    }));
  };
  refreshAvailability();
  window.setInterval(() => {
    if (document.visibilityState === 'visible') refreshAvailability();
  }, 30000);
})();


/* ============================================================
   AUTH MODULE — Server-backed Login, Sign Up, Session Management
   Accounts and password hashes live in the local Studio SQLite database.
   The server returns the member session from an HttpOnly cookie; account data is not cached in Web Storage.
   ============================================================ */
(() => {
  /* ---------- helpers ---------- */
  const $ = id => document.getElementById(id);
  const authRequest = async (path,payload) => { const response=await fetch(path,{method:payload?(path==='/api/auth/profile'?'PATCH':'POST'):'GET',credentials:'same-origin',cache:'no-store',headers:payload?{'content-type':'application/json'}:{},...(payload?{body:JSON.stringify(payload)}:{})});const result=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(Error(result.error||'The account service could not complete that request.'),{status:response.status});return result; };
  const memberPlacesRequest = async (method='GET',payload) => { const response=await fetch('/api/member/places',{method,credentials:'same-origin',cache:'no-store',headers:payload?{'content-type':'application/json'}:{},...(payload?{body:JSON.stringify(payload)}:{})});const result=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(Error(result.error||'Your saved places could not be updated.'),{status:response.status});return result; };
  const signOut = async redirect => {try{await authRequest('/api/auth/logout',{});}finally{window.location.assign(redirect||'/');}};

  /* ---------- validation rules ---------- */
  const validators = {
    fullName(v) {
      if (!v.trim()) return 'Full name is required.';
      if (v.trim().length < 2) return 'Name must be at least 2 characters.';
      if (v.trim().length > 80) return 'Name must be 80 characters or fewer.';
      if (!/^[\p{L}\p{M}]+(?:[ .'’\-][\p{L}\p{M}]+)*\.?$/u.test(v.trim())) return 'Use letters, spaces, apostrophes, periods or hyphens in the name.';
      return '';
    },
    email(v) {
      if (!v.trim()) return 'Email address is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'Please enter a valid email address.';
      return '';
    },
    password(v) {
      if (!v) return 'Password is required.';
      if (v.length < 8) return 'Password must be at least 8 characters.';
      if (v.length > 128) return 'Password is too long.';
      if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter.';
      if (!/[0-9]/.test(v)) return 'Include at least one number.';
      return '';
    },
    confirmPassword(v, password) {
      if (!v) return 'Please confirm your password.';
      if (v !== password) return 'Passwords do not match.';
      return '';
    },
    loginEmail(v) {
      if (!v.trim()) return 'Email address is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'Please enter a valid email address.';
      return '';
    },
    loginPassword(v) {
      if (!v) return 'Password is required.';
      return '';
    }
  };

  /* ---------- password strength ---------- */
  function passwordStrength(v) {
    let score = 0;
    if (v.length >= 8) score++;
    if (v.length >= 12) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    if (score <= 1) return { level: 1, label: 'Weak' };
    if (score === 2) return { level: 2, label: 'Fair' };
    if (score === 3) return { level: 3, label: 'Good' };
    return { level: 4, label: 'Strong' };
  }

  /* ---------- field helpers ---------- */
  function setFieldError(fieldEl, message) {
    if (!fieldEl) return;
    const input = fieldEl.querySelector('input');
    const errEl = fieldEl.querySelector('.auth-field-error');
    fieldEl.classList.toggle('has-error', !!message);
    if (input) {
      input.classList.toggle('is-invalid', !!message);
      input.classList.toggle('is-valid', !message && input.value.length > 0);
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (message && errEl) input.setAttribute('aria-describedby', errEl.id || '');
    }
    if (errEl) errEl.textContent = message || '';
  }

  function clearFieldError(fieldEl) {
    setFieldError(fieldEl, '');
  }

  function showStatus(statusEl, message, type) {
    if (!statusEl) return;
    statusEl.textContent = '';
    statusEl.className = `auth-status is-visible is-${type}`;
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 20 20');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    if (type === 'error') {
      path.setAttribute('d', 'M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4a1 1 0 011 1v3a1 1 0 11-2 0V7a1 1 0 011-1zm0 7a1.25 1.25 0 110 2.5A1.25 1.25 0 0110 13z');
    } else {
      path.setAttribute('d', 'M10 2a8 8 0 100 16A8 8 0 0010 2zm4.03 6.03l-4.5 4.5a.75.75 0 01-1.06 0l-2-2a.75.75 0 111.06-1.06L9 10.94l3.97-3.97a.75.75 0 111.06 1.06z');
    }
    path.setAttribute('fill', 'currentColor');
    icon.appendChild(path);
    const span = document.createElement('span');
    span.textContent = message;
    statusEl.appendChild(icon);
    statusEl.appendChild(span);
    statusEl.setAttribute('role', 'alert');
  }

  function hideStatus(statusEl) {
    if (!statusEl) return;
    statusEl.className = 'auth-status';
    statusEl.textContent = '';
  }

  /* ---------- password toggle ---------- */
  document.querySelectorAll('.auth-password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.auth-input-wrap')?.querySelector('input');
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      const eyeShow = btn.querySelector('.icon-eye-show');
      const eyeHide = btn.querySelector('.icon-eye-hide');
      if (eyeShow) eyeShow.style.display = show ? 'none' : '';
      if (eyeHide) eyeHide.style.display = show ? '' : 'none';
    });
  });

  /* ============================================================
     SIGN UP FORM
  ============================================================ */
  const signupForm = $('virsapur-signup-form');
  if (signupForm) {
    const nameField   = $('signup-field-name');
    const emailField  = $('signup-field-email');
    const passField   = $('signup-field-password');
    const confField   = $('signup-field-confirm');
    const termsField  = $('signup-field-terms');
    const passInput   = $('signup-password');
    const confInput   = $('signup-confirm');
    const strengthBar = signupForm.querySelector('.auth-strength-fill');
    const strengthLbl = signupForm.querySelector('.auth-strength-label');
    const statusEl    = $('signup-status');
    const submitBtn   = $('signup-submit');

    /* Live password strength */
    passInput?.addEventListener('input', () => {
      const val = passInput.value;
      if (val.length > 0) {
        passField.classList.add('show-strength');
        const { level, label } = passwordStrength(val);
        if (strengthBar) strengthBar.setAttribute('data-level', level);
        if (strengthLbl) strengthLbl.textContent = label;
      } else {
        passField.classList.remove('show-strength');
      }
      if (passField.classList.contains('has-error')) {
        setFieldError(passField, validators.password(val));
      }
    });

    /* Live confirm match */
    confInput?.addEventListener('input', () => {
      if (confField.classList.contains('has-error')) {
        setFieldError(confField, validators.confirmPassword(confInput.value, passInput?.value || ''));
      }
    });

    /* Blur validation */
    [
      { field: nameField,  input: $('signup-name'),  rule: v => validators.fullName(v) },
      { field: emailField, input: $('signup-email'), rule: v => validators.email(v) },
      { field: passField,  input: passInput,          rule: v => validators.password(v) },
      { field: confField,  input: confInput,          rule: v => validators.confirmPassword(v, passInput?.value || '') },
    ].forEach(({ field, input, rule }) => {
      input?.addEventListener('blur', () => setFieldError(field, rule(input.value)));
      input?.addEventListener('input', () => { if (field.classList.contains('has-error')) setFieldError(field, rule(input.value)); });
    });

    signupForm.addEventListener('submit', async e => {
      e.preventDefault();
      hideStatus(statusEl);
      const nameVal=nameField?.querySelector('input')?.value.trim()||'';
      const emailVal=$('signup-email')?.value.trim().toLowerCase()||'';
      const passVal=passInput?.value||'';
      const confVal=confInput?.value||'';
      const nameErr=validators.fullName(nameVal),emailErr=validators.email(emailVal),passErr=validators.password(passVal),confErr=validators.confirmPassword(confVal,passVal);
      setFieldError(nameField,nameErr);setFieldError(emailField,emailErr);setFieldError(passField,passErr);setFieldError(confField,confErr);
      if(nameErr||emailErr||passErr||confErr){showStatus(statusEl,'Please fix the errors above before continuing.','error');signupForm.querySelector('.has-error input')?.focus();return;}
      submitBtn.classList.add('is-loading');submitBtn.disabled=true;
      try{
        const result=await authRequest('/api/auth/signup',{fullName:nameVal,email:emailVal,password:passVal});
        showStatus(statusEl,`Welcome to Virsapur, ${result.user.fullName.split(' ')[0]}! Your account has been created.`,'success');
        setTimeout(()=>{window.location.href=signupForm.dataset.redirect||'../profile/index.html';},900);
      }catch(error){showStatus(statusEl,error.message,'error');if(error.status===409){setFieldError(emailField,error.message);$('signup-email')?.focus();}}
      finally{submitBtn.classList.remove('is-loading');submitBtn.disabled=false;}
    });
  }

  /* ============================================================
     LOGIN FORM
  ============================================================ */
  const loginForm = $('virsapur-login-form');
  if (loginForm) {
    const requestedNext = new URLSearchParams(window.location.search).get('next');
    if (requestedNext) {
      try {
        const target = new URL(requestedNext, window.location.href);
        if (target.origin === window.location.origin && target.pathname.startsWith('/') && !target.pathname.startsWith('//')) loginForm.dataset.redirect = `${target.pathname}${target.search}${target.hash}`;
      } catch {}
    }
    const emailField = $('login-field-email');
    const passField  = $('login-field-password');
    const statusEl   = $('login-status');
    const submitBtn  = $('login-submit');
    const emailInput = $('login-email');
    const passInput  = $('login-password');

    /* Blur validation */
    emailInput?.addEventListener('blur', () => setFieldError(emailField, validators.loginEmail(emailInput.value)));
    emailInput?.addEventListener('input', () => { if (emailField.classList.contains('has-error')) setFieldError(emailField, validators.loginEmail(emailInput.value)); });
    passInput?.addEventListener('blur', () => setFieldError(passField, validators.loginPassword(passInput.value)));
    passInput?.addEventListener('input', () => { if (passField.classList.contains('has-error')) setFieldError(passField, validators.loginPassword(passInput.value)); });

    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      hideStatus(statusEl);
      const emailVal=emailInput?.value.trim().toLowerCase()||'';
      const passVal=passInput?.value||'';
      const emailErr=validators.loginEmail(emailVal),passErr=validators.loginPassword(passVal);
      setFieldError(emailField,emailErr);setFieldError(passField,passErr);
      if(emailErr||passErr){loginForm.querySelector('.has-error input')?.focus();return;}
      const remember=!!loginForm.querySelector('[name="remember"]')?.checked;
      submitBtn.classList.add('is-loading');submitBtn.disabled=true;
      try{
        const result=await authRequest('/api/auth/login',{email:emailVal,password:passVal,remember});
        showStatus(statusEl,`Welcome back, ${result.user.fullName.split(' ')[0]}!`,'success');
        setTimeout(()=>{window.location.href=loginForm.dataset.redirect||'../profile/index.html';},750);
      }catch(error){showStatus(statusEl,error.message,'error');if(error.status===401){setFieldError(passField,'Incorrect email or password.');passInput?.select();}}
      finally{submitBtn.classList.remove('is-loading');submitBtn.disabled=false;}
    });
  }

  /* ============================================================
     HEADER SESSION STATE — show user pill or sign-in link
  ============================================================ */
  let resolveAuthReady;
  window.virsapurAuthReady=new Promise(resolve=>{resolveAuthReady=resolve;});
  (async()=>{
  let session=null;
  try{session=(await authRequest('/api/auth/session')).user;}catch{}
  resolveAuthReady(session);
  // Every dashboard page renders the same sidebar, so load its badges from
  // the account APIs on every route (the overview page is not the source of
  // truth for counts).
  const setMemberCount=(selector,value)=>document.querySelectorAll(selector).forEach(node=>{node.textContent=String(value);});
  if(session){
    const countRequest=async(path)=>{const response=await fetch(path,{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw new Error(`Could not load ${path}`);return response.json();};
    Promise.allSettled([countRequest('/api/member/places'),countRequest('/api/member/trips'),countRequest('/api/saved-articles'),countRequest('/api/member/trip-bookings')]).then(([placesResult,tripsResult,articlesResult,bookingsResult])=>{
      if(placesResult.status==='fulfilled'){
        setMemberCount('[data-wishlist-count]',placesResult.value.wishlist?.length||0);
        setMemberCount('[data-visited-count]',placesResult.value.visited?.length||0);
      }
      if(tripsResult.status==='fulfilled'){
        const trips=tripsResult.value.items||[];
        setMemberCount('[data-member-trips-count]',trips.length);
        setMemberCount('[data-completed-trips-count]',trips.filter(trip=>trip.status==='completed').length);
      }
      if(articlesResult.status==='fulfilled')setMemberCount('[data-saved-articles-count]',(articlesResult.value.items||[]).length);
      if(bookingsResult.status==='fulfilled')setMemberCount('[data-member-bookings-count]',(bookingsResult.value.items||[]).length);
    });
  }else{
    setMemberCount('[data-wishlist-count], [data-visited-count], [data-member-trips-count], [data-completed-trips-count], [data-saved-articles-count], [data-member-bookings-count]','0');
  }
  const savedArticleIds = new Set();
  const bookmarkHeaders = {};
  const updateBookmarkButton = button => {
    const saved=savedArticleIds.has(button.dataset.saveArticle);
    button.classList.toggle('is-saved',saved);button.setAttribute('aria-pressed',String(saved));
    const label=button.querySelector('span');if(label)label.textContent=saved?'Saved':'Save article';
    button.setAttribute('aria-label',`${saved?'Remove':'Save'} ${button.dataset.articleTitle||'article'} ${saved?'from':'to'} My Saved Articles`);
  };
  const updateBookmarkButtons = root => root.querySelectorAll?.('[data-save-article]').forEach(updateBookmarkButton);
  if(session){
    fetch('/api/saved-articles',{headers:bookmarkHeaders}).then(response=>response.ok?response.json():Promise.reject(new Error('Saved articles could not be loaded.'))).then(result=>{for(const item of result.items||[])savedArticleIds.add(item.articleId);updateBookmarkButtons(document);document.querySelectorAll('[data-saved-articles-count]').forEach(node=>node.textContent=savedArticleIds.size);}).catch(()=>{});
  }
  const bookmarkObserver=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1){if(node.matches?.('[data-save-article]'))updateBookmarkButton(node);updateBookmarkButtons(node);}});
  if(document.body)bookmarkObserver.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',async event=>{
    const target=event.target instanceof Element?event.target:null;
    const button=target?.closest('[data-save-article]');if(!button)return;event.preventDefault();event.stopPropagation();
    if(!session){const signIn=document.querySelector('.auth-header-link');window.location.assign(signIn?.href||'/login/');return;}
    const articleId=button.dataset.saveArticle,saved=savedArticleIds.has(articleId);button.disabled=true;
    try{
      const response=await fetch(saved?`/api/saved-articles/${encodeURIComponent(articleId)}`:'/api/saved-articles',{method:saved?'DELETE':'POST',headers:{...bookmarkHeaders,...(saved?{}:{'content-type':'application/json'})},...(saved?{}:{body:JSON.stringify({articleId})})});
      if(!response.ok){const result=await response.json().catch(()=>({}));throw new Error(result.error||'Bookmark could not be updated.');}
      if(saved)savedArticleIds.delete(articleId);else savedArticleIds.add(articleId);
      document.querySelectorAll('[data-save-article]').forEach(updateBookmarkButton);
      document.querySelectorAll('[data-saved-articles-count]').forEach(node=>node.textContent=savedArticleIds.size);
    }catch(error){button.setAttribute('aria-label',error.message);button.title=error.message;const label=button.querySelector('span');if(label)label.textContent='Could not save';}
    finally{button.disabled=false;}
  },true);
  document.querySelectorAll('[data-member-area]').forEach(area=>{if(!session)window.location.replace(area.dataset.loginUrl||'../login/');});
  const profileDashboard = document.querySelector('[data-profile-dashboard]');
  if (profileDashboard) {
    if (!session) { window.location.replace('../login/'); }
    else {
      const displayName = session.fullName || 'Traveller';
      profileDashboard.querySelector('[data-profile-greeting]').textContent = displayName.split(' ')[0];
      const form = profileDashboard.querySelector('[data-profile-form]');
      form.elements.fullName.value = displayName; form.elements.email.value = session.email || '';
      const places = JSON.parse(document.getElementById('profile-places').textContent);
      let state = {wishlist:[],visited:[]};
      let placesReady = false;
      const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
      const render = (key,selector,empty,action) => { const list=profileDashboard.querySelector(selector); const selected=places.filter(p=>state[key].includes(p.id)); list.innerHTML=selected.length?selected.map(p=>`<article class="profile-place-card"><a href="${escapeHtml(p.path)}"><span>${escapeHtml(p.category)}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.region)}</p></a><button type="button" data-remove-place="${escapeHtml(p.id)}" data-list="${key}">${action}</button></article>`).join(''):`<p class="profile-empty">${empty}</p>`; };
      const searchInput=profileDashboard.querySelector('[data-profile-place-search]');
      const searchResults=profileDashboard.querySelector('[data-profile-search-results]');
      const renderSearch=()=>{
        const query=searchInput.value.trim().toLocaleLowerCase();
        if(!query){searchResults.innerHTML='<p class="profile-search-hint">Search by destination name to add it to your wishlist or mark it as visited.</p>';return;}
        const matches=places.filter(place=>`${place.title} ${place.category} ${place.region}`.toLocaleLowerCase().includes(query));
        const shown=matches.slice(0,12);
        searchResults.innerHTML=shown.length?`<div class="profile-search-grid">${shown.map(place=>{const wished=state.wishlist.includes(place.id),visited=state.visited.includes(place.id);return `<article class="profile-search-result"><a href="${escapeHtml(place.path)}"><span>${escapeHtml(place.category)}</span><h3>${escapeHtml(place.title)}</h3><p>${escapeHtml(place.region)}</p></a><div class="profile-search-actions"><button type="button" class="profile-search-add-wishlist" data-add-wishlist="${escapeHtml(place.id)}" ${wished||!placesReady?'disabled':''}>${wished?'In wishlist':'Add to wishlist'}</button><button type="button" class="profile-search-add-visited" data-add-visited="${escapeHtml(place.id)}" ${visited||!placesReady?'disabled':''}>${visited?'Visited':'Add to visited'}</button></div></article>`;}).join('')}</div>${matches.length>12?`<p class="profile-search-hint">Showing 12 of ${matches.length} matches. Refine the destination name to narrow results.</p>`:''}`:'<p class="profile-empty">No destinations match that search. Try another name.</p>';
      };
      const update=()=>{state.wishlist=state.wishlist.filter(id=>places.some(p=>p.id===id));state.visited=state.visited.filter(id=>places.some(p=>p.id===id));render('wishlist','[data-wishlist-list]',placesReady?'Your wishlist is empty. Search for a destination above or save one from its heritage page.':'Loading your wishlist…','Remove');render('visited','[data-visited-list]',placesReady?'No visited places yet. Search above to add a place you have already visited.':'Loading visited places…','Remove');for(const key of ['wishlist','visited']){profileDashboard.querySelector(`[data-${key}-count]`).textContent=state[key].length;profileDashboard.querySelector(`[data-stat-${key}]`).textContent=state[key].length;profileDashboard.querySelector(`[data-${key}-heading-count]`).textContent=`${state[key].length} ${state[key].length===1?'place':'places'}`;}renderSearch();};
      searchInput.addEventListener('input',renderSearch);
      update();
      const syncPlaces=async()=>{
        try{
          const saved=await memberPlacesRequest();
          state={wishlist:saved.wishlist||[],visited:saved.visited||[]};
          placesReady=true;
          update();
        }catch(error){
          placesReady=true;
          update();
          searchResults.innerHTML=`<p class="profile-empty" role="status">Your saved places could not be loaded: ${escapeHtml(error.message)}. Try refreshing the page.</p>`;
        }
      };
      profileDashboard.addEventListener('click',async e=>{
        const visited=e.target.closest('[data-add-visited]');const wishlist=e.target.closest('[data-add-wishlist]');const add=visited||wishlist;
        if(add){
          if(!placesReady){searchResults.querySelector('[data-place-save-status]')?.remove();searchResults.insertAdjacentHTML('afterbegin','<p class="profile-search-hint" role="status" data-place-save-status>Loading your saved places. Try again in a moment.</p>');return;}
          const listType=visited?'visited':'wishlist',placeId=visited?visited.dataset.addVisited:wishlist.dataset.addWishlist;
          if(state[listType].includes(placeId))return;
          add.disabled=true;
          try{const saved=await memberPlacesRequest('POST',{placeId,listType});state={wishlist:saved.wishlist||[],visited:saved.visited||[]};update();}
          catch(error){searchResults.querySelector('[data-place-save-status]')?.remove();searchResults.insertAdjacentHTML('afterbegin',`<p class="profile-empty" role="status" data-place-save-status>${escapeHtml(error.message)}</p>`);add.disabled=false;}
          return;
        }
        const remove=e.target.closest('[data-remove-place]');
        if(remove){
          if(!placesReady)return;
          const listType=remove.dataset.list,placeId=remove.dataset.removePlace;remove.disabled=true;
          try{const saved=await memberPlacesRequest('DELETE',{placeId,listType});state={wishlist:saved.wishlist||[],visited:saved.visited||[]};update();}
          catch(error){searchResults.querySelector('[data-place-save-status]')?.remove();searchResults.insertAdjacentHTML('afterbegin',`<p class="profile-empty" role="status" data-place-save-status>${escapeHtml(error.message)}</p>`);remove.disabled=false;}
        }
      });
      syncPlaces();
      form.addEventListener('submit',async e=>{e.preventDefault();const nextName=form.elements.fullName.value.trim(),message=profileDashboard.querySelector('[data-profile-message]');try{const result=await authRequest('/api/auth/profile',{fullName:nextName});Object.assign(session,result.user);form.elements.fullName.value=result.user.fullName;profileDashboard.querySelector('[data-profile-greeting]').textContent=result.user.fullName.split(' ')[0];message.textContent='Your details have been saved to your account.';}catch(error){message.textContent=error.message;}});
    }
  }
  document.querySelectorAll('[data-profile-logout]').forEach(button=>button.addEventListener('click',()=>signOut(button.dataset.homeUrl||'/')));
  document.querySelectorAll('[data-place-action]').forEach(button=>{
    const listType=button.dataset.placeAction,placeId=button.dataset.placeId;
    let saved=false,ready=!session;
    const label=()=>{button.textContent=saved?(listType==='wishlist'?'Saved to wishlist':'Marked as visited'):(listType==='wishlist'?'Add to wishlist':'Mark as visited');};
    label();
    const loadPlaces=session?(async()=>{const result=await memberPlacesRequest();saved=(result[listType]||[]).includes(placeId);ready=true;label();})().catch(error=>{button.title=error.message;button.disabled=true;}):Promise.resolve();
    button.addEventListener('click',async()=>{
      if(!session){window.location.assign(button.dataset.loginUrl||'/login/');return;}
      button.disabled=true;
      try{
        await loadPlaces;
        if(!ready)throw new Error('Sign in again to manage your saved places.');
        const result=await memberPlacesRequest(saved?'DELETE':'POST',{placeId,listType});
        saved=(result[listType]||[]).includes(placeId);label();button.title='';
      }catch(error){button.title=error.message;}
      finally{button.disabled=false;}
    });
  });
  const signInLink = document.querySelector('.auth-header-link');
  const userPill   = document.querySelector('.auth-user-pill');

  if (session && signInLink && userPill) {
    signInLink.style.display = 'none';
    userPill.style.display = 'flex';
    const avatarEl = userPill.querySelector('.auth-avatar');
    const nameEl   = userPill.querySelector('.auth-user-name');
    if (avatarEl) avatarEl.textContent = session.avatar || session.fullName?.[0]?.toUpperCase() || 'U';
    if (nameEl)   nameEl.textContent   = session.fullName?.split(' ')[0] || 'User';

    /* Dropdown toggle */
    userPill.addEventListener('click', e => {
      e.stopPropagation();
      userPill.classList.toggle('is-open');
    });
    document.addEventListener('click', () => userPill.classList.remove('is-open'));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') userPill.classList.remove('is-open'); });

    /* Sign out */
    const signOutBtn = userPill.querySelector('.is-signout');
    signOutBtn?.addEventListener('click', () => signOut(signOutBtn.dataset.homeUrl||'/'));
  } else if (!session && userPill) {
    userPill.style.display = 'none';
  }
  })();
})();
