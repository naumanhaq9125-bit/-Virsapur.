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
