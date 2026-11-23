(() => {
  const root = document.querySelector("[data-heritage-map]");
  const adm1 = window.PAKISTAN_ADMIN_1;
  const config = window.VIRSAPUR_MAP_CONFIG;
  const districtConfig = window.VIRSAPUR_DISTRICT_CONFIG;
  const administrativeSnapshot = window.VIRSAPUR_ADMINISTRATIVE_SNAPSHOT;
  const worldContext = window.VIRSAPUR_WORLD_CONTEXT;
  const heritagePlaces = (window.VIRSAPUR_HERITAGE_PLACES || []).filter((record) => record.status === "published");
  const publicAttribution = document.querySelector("[data-admin-attribution]");
  const siteBaseUrl = new URL("../", document.currentScript?.src || window.location.href);

  if (publicAttribution && administrativeSnapshot?.publicAttribution) {
    publicAttribution.textContent = administrativeSnapshot.publicAttribution;
  }

  if (!root || !adm1 || !config || !districtConfig) return;

  const NS = "http://www.w3.org/2000/svg";
  const mobileQuery = window.matchMedia("(max-width: 680px)");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const svg = root.querySelector("#pakistan-map");
  const description = svg.querySelector("desc");
  const countryViewport = svg.querySelector(".map-vector-viewport");
  const regionPathsLayer = svg.querySelector(".map-region-paths");
  const regionLabelsLayer = svg.querySelector(".map-region-labels");
  const districtViewport = svg.querySelector(".map-district-viewport");
  const parentOutline = svg.querySelector(".map-parent-outline");
  const districtPathsLayer = svg.querySelector(".map-district-paths");
  const districtLabelsLayer = svg.querySelector(".map-district-labels");
  const heritageMarkersLayer = svg.querySelector(".map-heritage-markers");
  const summary = root.querySelector(".map-summary");
  const heritageRail = root.querySelector(".map-heritage-rail");
  const drawerToggle = root.querySelector(".map-drawer-toggle");
  const drawer = root.querySelector(".map-heritage-drawer");
  const drawerContent = root.querySelector(".map-heritage-drawer-content");
  const drawerCount = root.querySelector("[data-heritage-drawer-count]");
  const drawerAction = root.querySelector("[data-heritage-drawer-action]");
  const districtIndex = root.querySelector(".map-district-index");
  const crumbs = root.querySelector(".map-crumbs");
  const layerName = root.querySelector(".layer-name");
  const backButton = root.querySelector(".map-prev");
  const loadStatus = root.querySelector(".map-load-status");
  const loadStatusText = loadStatus.querySelector("p");
  const retryButton = loadStatus.querySelector("button");
  const worldLand = root.querySelector("[data-world-land]");
  const worldPakistan = root.querySelector("[data-world-pakistan]");
  const worldPakistanReference = root.querySelector("[data-world-pakistan-reference]");
  const worldLabels = root.querySelector("[data-world-labels]");
  const worldInsetLand = root.querySelector("[data-world-inset-land]");
  const worldInsetPakistan = root.querySelector("[data-world-inset-pakistan]");
  const zoomInButton = root.querySelector('[data-map-action="zoom-in"]');
  const zoomOutButton = root.querySelector('[data-map-action="zoom-out"]');
  const recenterButtons = [...root.querySelectorAll('[data-map-action="recenter"]')];
  const overviewButtons = [...root.querySelectorAll('[data-map-action="overview"]')];
  const panButtons = [...root.querySelectorAll("[data-map-pan]")];
  const layerInputs = [...root.querySelectorAll("[data-map-layer]")];

  const countryState = { level: "country", regionId: null, districtId: null };
  const renderedRegions = new Map();
  const districtCollections = new Map();
  const districtLoadPromises = new Map();
  const regionById = new Map(adm1.features.map((feature) => [feature.id, feature]));
  const regionalExtents = {
    desktop: { minLongitude: 54, maxLongitude: 85, minLatitude: 20, maxLatitude: 40.5 },
    mobile: { minLongitude: 57, maxLongitude: 83, minLatitude: 20.5, maxLatitude: 40 },
  };
  const contextualLabels = [
    { name: "Iran", coordinate: [56, 31.2], mobileCoordinate: [58, 31.2] },
    { name: "Afghanistan", coordinate: [66.2, 35.2] },
    { name: "China", coordinate: [82, 36.7], mobileCoordinate: [81, 36.7] },
    { name: "India", coordinate: [81.8, 26.2], mobileCoordinate: [80.5, 26.2] },
    { name: "Arabian Sea", coordinate: [66.8, 21.7], mobileCoordinate: [66.8, 22], className: "map-world-label map-world-label-sea" },
  ];

  let mapState = { ...countryState };
  let layoutMode = mobileQuery.matches ? "mobile" : "desktop";
  let currentLayout = config.layouts[layoutMode];
  let countryProject = (coordinate) => coordinate;
  let transitionSequence = 0;
  let loadingRegionId = null;
  let loadError = null;
  let routeNotice = null;
  let lastHistoryHash = "";
  let camera = { scale: 1, offsetX: 0, offsetY: 0 };
  let cameraAnimation = 0;
  let dragState = null;
  let selectedHeritageId = null;
  let lastDistrictRender = null;
  const expandedHeritage = new Set();
  let inventoryFilter = 'all';
  let inventoryQuery = '';
  let canvasObserver;
  let atlasCanvas;
  let contextFacts;
  let panelToggle;
  let selectedNote;
  let railHandle;
  let previewRecordId = null;
  let previewAnchor = null;
  let railMode = 'browse';
  let railScopeKey = '';
  let browseScroll = 0;
  let contextPanel;
  const scopeMedia = window.VIRSAPUR_ATLAS_SCOPE_MEDIA || {};
  const isWorldHeritage = (record) => record.designationType === "unesco-world-heritage";
  const focusFrame = () => {
    if (!atlasCanvas) return currentLayout.provinceFrame;
    const [x, y, width, height] = currentLayout.viewBox;
    return layoutMode === 'mobile'
      ? { x: x + 30, y: y + 95, width: width - 70, height: height - 140 }
      : { x: x + 30, y: y + 30, width: width - 70, height: height - 65 };
  };
  const updateAtlasLayout = () => {
    currentLayout = config.layouts[layoutMode];
    if (!atlasCanvas) return;
    if (contextPanel) {
      const workspace = root.querySelector('.map-workspace');
      if (window.matchMedia('(max-width:760px)').matches) {
        const dock = root.querySelector('.map-heritage-dock');
        const anchor = root.classList.contains('atlas-map-tray') ? workspace : dock;
        if (contextPanel.previousElementSibling !== anchor) anchor.after(contextPanel);
      }
      else if (contextPanel.parentElement !== workspace) workspace.prepend(contextPanel);
    }
    const bounds = atlasCanvas.getBoundingClientRect();
    // Match the SVG coordinate space to its real canvas: no letterboxing, no distortion.
    const width = layoutMode === 'mobile' ? 660 : 960;
    currentLayout = { ...currentLayout, viewBox: [0, 0, width, width * bounds.height / Math.max(1, bounds.width)] };
    root.style.setProperty('--atlas-svg-unit', String(width / Math.max(1, bounds.width)));
  };

  // A dedicated canvas keeps the context header out of the geographic viewport.
  if (root.dataset.mapVariant === "full") {
    const stage = root.querySelector(".map-stage");
    atlasCanvas = document.createElement("div");
    atlasCanvas.className = "map-atlas-canvas";
    [...stage.children].filter(child => child !== summary).forEach(child => atlasCanvas.append(child));
    stage.append(atlasCanvas);
    drawer.id = 'atlas-inventory';
    drawerToggle.setAttribute('aria-controls', drawer.id);
    document.querySelector('.map-methodology')?.removeAttribute('open');
    recenterButtons.forEach(button => button.setAttribute('aria-label', 'Fit current geographic level'));
    const legend = document.createElement('div');
    legend.className = 'atlas-pin-legend';
    legend.innerHTML = '<p>Heritage</p><span><i aria-hidden="true">◇</i> UNESCO World Heritage</span><span><i class="is-major" aria-hidden="true">◇</i> Major Heritage</span>';
    root.querySelector('.map-layer-control>div')?.append(legend);
    const context = document.createElement('section');
    context.className = 'atlas-context-panel';
    contextPanel = context;
    context.setAttribute('aria-label', 'Geographic context');
    const folio = document.createElement('p');
    folio.className = 'atlas-folio';
    folio.innerHTML = '<span>Virsapur · Field guide</span><b data-atlas-level>01</b>';
    contextFacts = document.createElement('div');
    contextFacts.className = 'atlas-context-facts';
    contextFacts.id = 'atlas-context-facts';
    const contextToggle = document.createElement('button');
    contextToggle.type = 'button';
    contextToggle.className = 'atlas-context-toggle';
    contextToggle.textContent = 'About this place +';
    contextToggle.setAttribute('aria-expanded','false');
    contextToggle.setAttribute('aria-controls','atlas-context-description atlas-context-facts');
    contextToggle.addEventListener('click', () => {
      setContextOpen(!root.classList.contains('atlas-context-expanded'));
    });
    const compactContext = document.createElement('div');
    compactContext.className = 'atlas-mobile-context';
    context.append(folio, summary, compactContext, contextToggle, contextFacts);
    root.querySelector('.map-workspace').prepend(context);
    const placeBar=document.createElement('div');
    placeBar.className='atlas-place-bar';
    stage.after(placeBar);
    panelToggle = document.createElement('button');
    panelToggle.type = 'button';
    panelToggle.className = 'atlas-panel-toggle';
    panelToggle.textContent = 'Heritage →';
    panelToggle.setAttribute('aria-expanded', 'false');
    heritageRail.id = 'atlas-heritage-panel';
    panelToggle.setAttribute('aria-controls', heritageRail.id);
    panelToggle.addEventListener('click', () => setRailOpen(heritageRail.hidden));
    root.querySelector('.map-topbar').append(panelToggle);
    railHandle = document.createElement('button');
    railHandle.type = 'button';
    railHandle.className = 'atlas-rail-handle';
    railHandle.innerHTML = '<span>Heritage</span><b aria-hidden="true">‹</b>';
    railHandle.setAttribute('aria-label', 'Open heritage panel');
    railHandle.setAttribute('aria-controls', heritageRail.id);
    railHandle.hidden = false;
    railHandle.addEventListener('click', () => setRailOpen(true));
    heritageRail.before(railHandle);
    heritageRail.hidden = true;
    root.classList.add('atlas-rail-collapsed');
    selectedNote = document.createElement('div');
    selectedNote.className = 'atlas-selection-note';
    selectedNote.setAttribute('role', 'status');
    selectedNote.setAttribute('aria-live', 'polite');
    selectedNote.hidden = true;
    atlasCanvas.append(selectedNote);
    root.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const layers = root.querySelector('.map-layer-control[open]');
      if (layers) { layers.open=false; layers.querySelector('summary').focus({preventScroll:true}); }
      else if (!drawer.hidden) { setDrawerOpen(false); drawerToggle.focus({preventScroll:true}); }
      else if (!heritageRail.hidden) { setRailOpen(false); panelToggle.focus({preventScroll:true}); }
      else if (root.classList.contains('atlas-context-expanded')) { setContextOpen(false); contextToggle.focus({preventScroll:true}); }
      else return;
      event.preventDefault();
      // Dismissing a sheet must not also invoke the map's Back shortcut.
      event.stopImmediatePropagation();
    });
    updateAtlasLayout();
  }

  function setContextOpen(open) {
    if (!contextPanel) return;
    if (open) { setRailOpen(false); setDrawerOpen(false); restoreSummary(); }
    root.classList.toggle('atlas-context-expanded',open);
    const toggle=contextPanel.querySelector('.atlas-context-toggle');
    toggle.setAttribute('aria-expanded',String(open));
    toggle.textContent=open?'Close place guide ×':'About '+heritageScopeLabel()+' →';
  }

  const setRailOpen = (open) => {
    if (!heritageRail || !panelToggle) return;
    if (open) { setContextOpen(false); setDrawerOpen(false); }
    heritageRail.hidden = !open;
    if (open && railMode === 'browse') heritageRail.scrollTop = 0;
    root.classList.toggle('atlas-rail-collapsed', !open);
    panelToggle.textContent = open ? 'Close heritage ×' : 'Heritage · '+heritageInScope().length+' →';
    panelToggle.setAttribute('aria-label',open?'Close heritage panel':'Open heritage in '+heritageScopeLabel());
    panelToggle.setAttribute('aria-expanded', String(open));
    railHandle.hidden = open;
    // Sheets overlay the same canvas: opening a panel must not change its camera.
    renderMarkerPreview();
  };

  const makeSvgElement = (name, attributes = {}) => {
    const element = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    return element;
  };

  const escapeHtml = (value = "") => String(value).replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);

  const coordinatePairs = (geometry) => {
    const pairs = [];
    const visit = (value) => {
      if (typeof value?.[0] === "number" && typeof value?.[1] === "number") {
        pairs.push(value);
        return;
      }
      value?.forEach(visit);
    };
    visit(geometry.coordinates);
    return pairs;
  };

  const geographicBounds = (geometry) =>
    coordinatePairs(geometry).reduce(
      (bounds, [longitude, latitude]) => ({
        minLongitude: Math.min(bounds.minLongitude, longitude),
        maxLongitude: Math.max(bounds.maxLongitude, longitude),
        minLatitude: Math.min(bounds.minLatitude, latitude),
        maxLatitude: Math.max(bounds.maxLatitude, latitude),
      }),
      {
        minLongitude: Infinity,
        maxLongitude: -Infinity,
        minLatitude: Infinity,
        maxLatitude: -Infinity,
      },
    );

  const countryBounds = adm1.features.reduce(
    (bounds, feature) => {
      const next = geographicBounds(feature.geometry);
      return {
        minLongitude: Math.min(bounds.minLongitude, next.minLongitude),
        maxLongitude: Math.max(bounds.maxLongitude, next.maxLongitude),
        minLatitude: Math.min(bounds.minLatitude, next.minLatitude),
        maxLatitude: Math.max(bounds.maxLatitude, next.maxLatitude),
      };
    },
    {
      minLongitude: Infinity,
      maxLongitude: -Infinity,
      minLatitude: Infinity,
      maxLatitude: -Infinity,
    },
  );

  const projectBoundsIntoFrame = (bounds, frame, occupancy = 1, maximumScale = Infinity) => {
    const longitudeSpan = Math.max(bounds.maxLongitude - bounds.minLongitude, 0.00001);
    const latitudeSpan = Math.max(bounds.maxLatitude - bounds.minLatitude, 0.00001);
    const scale = Math.min(
      (frame.width * occupancy) / longitudeSpan,
      (frame.height * occupancy) / latitudeSpan,
      maximumScale,
    );
    const width = longitudeSpan * scale;
    const height = latitudeSpan * scale;
    const offsetX = frame.x + (frame.width - width) / 2;
    const offsetY = frame.y + (frame.height - height) / 2;
    const project = ([longitude, latitude]) => [
      offsetX + (longitude - bounds.minLongitude) * scale,
      offsetY + (bounds.maxLatitude - latitude) * scale,
    ];
    project.meta = { scale, offsetX, offsetY, bounds: { ...bounds }, frame: { ...frame } };
    return project;
  };

  const configureCountryProjection = () => {
    const [viewX, viewY, viewWidth, viewHeight] = currentLayout.viewBox;
    const regionalFrame = atlasCanvas ? { x: viewX + 32, y: viewY + 50, width: viewWidth - 64, height: viewHeight - 100 } : layoutMode === "mobile"
      ? { x: viewX, y: viewY, width: viewWidth, height: viewHeight }
      : { x: 120, y: viewY, width: viewWidth - 120, height: viewHeight };
    const extent = atlasCanvas ? { minLongitude: 60, maxLongitude: 79, minLatitude: 22, maxLatitude: 38 } : regionalExtents[layoutMode];
    countryProject = projectBoundsIntoFrame(extent, regionalFrame);
    root.dataset.regionalProjection = "equirectangular";
    root.dataset.regionalScale = countryProject.meta.scale.toFixed(6);
    root.dataset.regionalTranslation = `${countryProject.meta.offsetX.toFixed(3)} ${countryProject.meta.offsetY.toFixed(3)}`;
    root.dataset.regionalExtent = Object.values(extent).join(" ");
  };

  const ringPath = (ring, project) =>
    ring
      .map((coordinate, index) => {
        const [x, y] = project(coordinate);
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join("") + "Z";

  const geometryPath = (geometry, project) => {
    if (geometry.type === "Polygon") return geometry.coordinates.map((ring) => ringPath(ring, project)).join("");
    if (geometry.type === "MultiPolygon") {
      return geometry.coordinates.flatMap((polygon) => polygon.map((ring) => ringPath(ring, project))).join("");
    }
    return "";
  };

  const worldProject = ([longitude, latitude]) => [
    ((longitude + 180) / 360) * 1000,
    ((90 - latitude) / 180) * 500,
  ];

  const renderWorldContext = () => {
    if (!worldContext?.countries?.length || !worldLand || !worldPakistan) return;
    configureCountryProjection();
    const pakistan = worldContext.countries.find((country) => country.id === "PAK");
    const surrounding = worldContext.countries.filter((country) => country.id !== "PAK");
    // The full Atlas must not leave a coarse Natural Earth Pakistan-shaped hole
    // around the authoritative ADM1 silhouette. Paint the existing context land
    // continuously underneath it; all source geometries remain unchanged.
    const regionalLandPath = (atlasCanvas ? worldContext.countries : surrounding).map((country) => geometryPath(country.geometry, countryProject)).join("");
    const authoritativePakistanPath = adm1.features.map((feature) => geometryPath(feature.geometry, countryProject)).join("");
    const referencePakistanPath = pakistan ? geometryPath(pakistan.geometry, countryProject) : "";
    const insetLandPath = surrounding.map((country) => geometryPath(country.geometry, worldProject)).join("");
    const insetPakistanPath = pakistan ? geometryPath(pakistan.geometry, worldProject) : "";
    worldLand.setAttribute("d", regionalLandPath);
    worldPakistan.setAttribute("d", authoritativePakistanPath);
    worldPakistanReference?.setAttribute("d", referencePakistanPath);
    worldInsetLand?.setAttribute("d", insetLandPath);
    worldInsetPakistan?.setAttribute("d", insetPakistanPath);
    worldLabels?.replaceChildren();
    for (const item of contextualLabels) {
      const [x, y] = countryProject(layoutMode === "mobile" && item.mobileCoordinate ? item.mobileCoordinate : item.coordinate);
      const label = makeSvgElement("text", {
        class: item.className || "map-world-label",
        x: x.toFixed(2),
        y: y.toFixed(2),
        "text-anchor": "middle",
      });
      label.textContent = item.name;
      worldLabels.append(label);
    }
    root.dataset.worldSource = worldContext.source?.title || "Natural Earth";
    root.classList.add("map-world-ready");
  };

  const cameraLimit = () => (mapState.level === "district" ? 5 : mapState.level === "region" ? 4 : 3);

  const cameraViewBox = () => {
    const [baseX, baseY, baseWidth, baseHeight] = currentLayout.viewBox;
    const scale = Math.min(Math.max(camera.scale, 1), cameraLimit());
    const width = baseWidth / scale;
    const height = baseHeight / scale;
    const maximumOffsetX = (baseWidth - width) / 2;
    const maximumOffsetY = (baseHeight - height) / 2;
    camera.scale = scale;
    camera.offsetX = Math.min(Math.max(camera.offsetX, -maximumOffsetX), maximumOffsetX);
    camera.offsetY = Math.min(Math.max(camera.offsetY, -maximumOffsetY), maximumOffsetY);
    return [
      baseX + (baseWidth - width) / 2 + camera.offsetX,
      baseY + (baseHeight - height) / 2 + camera.offsetY,
      width,
      height,
    ];
  };

  const updateCameraControls = () => {
    const atMinimum = camera.scale <= 1.001;
    const atMaximum = camera.scale >= cameraLimit() - 0.001;
    if (zoomOutButton) zoomOutButton.disabled = atMinimum;
    if (zoomInButton) zoomInButton.disabled = atMaximum;
    recenterButtons.forEach((button) => {
      button.disabled = atMinimum && Math.abs(camera.offsetX) < 0.01 && Math.abs(camera.offsetY) < 0.01;
    });
    root.dataset.cameraScale = camera.scale.toFixed(2);
    if (atlasCanvas) root.style.setProperty('--atlas-svg-unit', String(currentLayout.viewBox[2] / Math.max(1, atlasCanvas.getBoundingClientRect().width) / camera.scale));
    root.classList.toggle("map-heritage-expanded", camera.scale >= 1.75);
    updateMarkerCollisions();
    if (layoutMode === "mobile" && mapState.level === "region" && lastDistrictRender) renderDistrictLabels(lastDistrictRender.features, lastDistrictRender.project, null);
  };

  const setSvgViewBox = (values) => {
    svg.setAttribute("viewBox", values.map((value) => value.toFixed(3)).join(" "));
    root.dataset.cameraViewbox = values.map((value) => value.toFixed(2)).join(" ");
    if (selectedNote && !selectedNote.hidden) renderMarkerPreview();
  };

  const animateViewBox = (target, animate = true) => {
    window.cancelAnimationFrame(cameraAnimation);
    const current = (svg.getAttribute("viewBox") || currentLayout.viewBox.join(" "))
      .trim()
      .split(/\s+/)
      .map(Number);
    if (!animate || reducedMotionQuery.matches || current.some(Number.isNaN)) {
      setSvgViewBox(target);
      return;
    }
    const startedAt = performance.now();
    const duration = root.dataset.mapVariant === 'full' ? 220 : 360;
    const step = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setSvgViewBox(current.map((value, index) => value + (target[index] - value) * eased));
      if (progress < 1) cameraAnimation = window.requestAnimationFrame(step);
    };
    cameraAnimation = window.requestAnimationFrame(step);
  };

  const applyCamera = ({ animate = true } = {}) => {
    animateViewBox(cameraViewBox(), animate);
    updateCameraControls();
  };

  const resetCamera = ({ animate = true } = {}) => {
    camera = { scale: 1, offsetX: 0, offsetY: 0 };
    applyCamera({ animate });
  };

  const zoomCamera = (direction) => {
    const factor = direction > 0 ? 1.28 : 1 / 1.28;
    camera.scale = Math.min(Math.max(camera.scale * factor, 1), cameraLimit());
    applyCamera();
  };

  const panCamera = (direction, { animate = true } = {}) => {
    const [, , width, height] = cameraViewBox();
    const stepX = width * 0.16;
    const stepY = height * 0.16;
    if (direction === "left") camera.offsetX -= stepX;
    if (direction === "right") camera.offsetX += stepX;
    if (direction === "up") camera.offsetY -= stepY;
    if (direction === "down") camera.offsetY += stepY;
    applyCamera({ animate });
  };

  const outerRings = (geometry) =>
    geometry.type === "Polygon"
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((polygon) => polygon[0]);

  const signedRingArea = (ring) => {
    let area = 0;
    for (let index = 0; index < ring.length - 1; index += 1) {
      area += ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1];
    }
    return area / 2;
  };

  const ringCentroid = (ring) => {
    let twiceArea = 0;
    let longitude = 0;
    let latitude = 0;
    for (let index = 0; index < ring.length - 1; index += 1) {
      const [x1, y1] = ring[index];
      const [x2, y2] = ring[index + 1];
      const cross = x1 * y2 - x2 * y1;
      twiceArea += cross;
      longitude += (x1 + x2) * cross;
      latitude += (y1 + y2) * cross;
    }
    return Math.abs(twiceArea) < 0.0000001
      ? ring[0]
      : [longitude / (3 * twiceArea), latitude / (3 * twiceArea)];
  };

  const geometryCentroid = (geometry) => {
    const largestRing = outerRings(geometry).reduce((largest, ring) =>
      Math.abs(signedRingArea(ring)) > Math.abs(signedRingArea(largest)) ? ring : largest,
    );
    return ringCentroid(largestRing);
  };

  const pointInRing = (point, ring) => {
    let inside = false;
    for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
      const a = ring[index];
      const b = ring[previous];
      if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  };

  const pointInGeometry = (point, geometry) => {
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    return polygons.some((polygon) => pointInRing(point, polygon[0]) && !polygon.slice(1).some((hole) => pointInRing(point, hole)));
  };

  /* Discovery gestures: inverse projection, focal camera and one-level gesture gate. */
  const inverseProject = ([x,y], project) => {
    const meta = project?.meta;
    if (!meta || !Number.isFinite(meta.scale) || meta.scale <= 0) return null;
    const coordinate = [meta.bounds.minLongitude + (x-meta.offsetX)/meta.scale, meta.bounds.maxLatitude - (y-meta.offsetY)/meta.scale];
    return coordinate.every(Number.isFinite) ? coordinate : null;
  };
  const gestureGate = { lastAt:-Infinity, until:0, locked:false, busy:false, intent:0, direction:0, child:null };
  const beginGesture = (now) => {
    gestureGate.intent=0; gestureGate.direction=0; gestureGate.child=null;
    gestureGate.locked=gestureGate.busy || now<gestureGate.until;
  };
  const gestureChild = (coordinate) => {
    if (!coordinate || mapState.level === 'district') return null;
    const features = mapState.level === 'country' ? adm1.features : districtCollections.get(mapState.regionId)?.features || [];
    // Containment only: never substitute a nearest district or an exterior context feature.
    const matches = features.filter(feature => pointInGeometry(coordinate,feature.geometry));
    if (matches.length !== 1) return null;
    const feature = matches[0];
    if (mapState.level === 'country') return {level:'region',regionId:feature.id,districtId:null};
    const district = districtConfig.districts[feature.id];
    if (!district || ['withheld','retired'].includes(district.publicationStatus)) return null;
    return {level:'district',regionId:mapState.regionId,districtId:feature.id};
  };
  const pointerInSvg = (clientX,clientY) => {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint(); point.x=clientX; point.y=clientY;
    const local = point.matrixTransform(matrix.inverse());
    return [local.x,local.y];
  };
  const focalCamera = (point,u,v,scale) => {
    const [bx,by,bw,bh]=currentLayout.viewBox;
    const next=Math.min(cameraLimit(),Math.max(1,scale));
    return {scale:next,offsetX:point[0]-u*bw/next-bx-(bw-bw/next)/2,offsetY:point[1]-v*bh/next-by-(bh-bh/next)/2};
  };
  const transitionByGesture = async (target,coordinate,u,v) => {
    gestureGate.busy=true; gestureGate.locked=true; gestureGate.intent=0;
    gestureGate.until=performance.now()+500;
    try {
      await setMapState(target,{historyMode:'push',focusId:'',preserveViewport:true});
      if (!sameState(mapState,target)) return;
      const project=mapState.level==='country'?countryProject:lastDistrictRender?.project;
      if (project && coordinate) camera=focalCamera(project(coordinate),u,v,1.08);
      applyCamera({animate:false});
    } finally {
      gestureGate.busy=false;
      gestureGate.until=performance.now()+500;
    }
  };
  const gestureZoom = (delta,clientX,clientY,previousX=clientX,previousY=clientY) => {
    if (gestureGate.locked || gestureGate.busy || loadingRegionId) return;
    const point=pointerInSvg(previousX,previousY);
    if (!point) return;
    const rect=svg.getBoundingClientRect();
    const u=Math.min(1,Math.max(0,(clientX-rect.left)/rect.width));
    const v=Math.min(1,Math.max(0,(clientY-rect.top)/rect.height));
    const coordinate=inverseProject(point,mapState.level==='country'?countryProject:lastDistrictRender?.project);
    const before=camera.scale;
    camera=focalCamera(point,u,v,before*Math.exp(delta));
    applyCamera({animate:false});
    if (Math.abs(delta)<0.001) return;
    const direction=Math.sign(delta);
    const child=direction>0?gestureChild(coordinate):null;
    const key=child?`${child.regionId}:${child.districtId||''}`:null;
    if (direction!==gestureGate.direction || (direction>0 && key!==gestureGate.child)) gestureGate.intent=0;
    gestureGate.direction=direction; gestureGate.child=key;
    gestureGate.intent+=Math.abs(delta);
    if (direction>0 && child && camera.scale >= (mapState.level==='country'?2.4:3.2) && gestureGate.intent>=0.55) {
      void transitionByGesture(child,coordinate,u,v);
    } else if (direction<0) {
      // Outward intent must accumulate beyond minimum, not while merely approaching it.
      if (before>1.001) gestureGate.intent=0;
      if (before<=1.001 && gestureGate.intent>=0.34 && mapState.level!=='country') {
        const parent=mapState.level==='district'?{level:'region',regionId:mapState.regionId,districtId:null}:{...countryState};
        void transitionByGesture(parent,coordinate,u,v);
      }
    }
  };
  const wheelDelta = (event,height) => {
    const unit=event.deltaMode===1?16:event.deltaMode===2?height:1;
    return Math.max(-0.24,Math.min(0.24,-event.deltaY*unit*(event.ctrlKey?0.012:0.002)));
  };
  const installDiscoveryGestures = () => {
    let suppressClickUntil=0;
    svg.addEventListener('wheel',event=>{
      if (event.shiftKey || !event.deltaY) return;
      const now=performance.now();
      if (now-gestureGate.lastAt>280) beginGesture(now);
      gestureGate.lastAt=now;
      const delta=wheelDelta(event,svg.clientHeight);
      // At country minimum, scrolling outward returns naturally to the webpage.
      if (mapState.level==='country' && camera.scale<=1.001 && delta<0 && !gestureGate.locked) return;
      event.preventDefault();
      gestureZoom(delta,event.clientX,event.clientY);
    },{passive:false});
    // Mouse/pen drag can begin over land. A real drag suppresses the subsequent click.
    let pan=null;
    svg.addEventListener('pointerdown',event=>{
      if (event.pointerType==='touch' || event.button!==0 || event.target.closest?.('.map-heritage-marker,.atlas-proximity-cluster')) return;
      pan={id:event.pointerId,x:event.clientX,y:event.clientY,camera:{...camera},box:cameraViewBox(),moved:false};
    });
    svg.addEventListener('pointermove',event=>{
      if (!pan || pan.id!==event.pointerId) return;
      const dx=event.clientX-pan.x,dy=event.clientY-pan.y;
      if (!pan.moved && Math.hypot(dx,dy)<6) return;
      pan.moved=true; svg.setPointerCapture?.(event.pointerId);
      root.classList.add('map-is-panning');
      const rect=svg.getBoundingClientRect();
      camera={...pan.camera,offsetX:pan.camera.offsetX-dx/rect.width*pan.box[2],offsetY:pan.camera.offsetY-dy/rect.height*pan.box[3]};
      applyCamera({animate:false});event.preventDefault();
    });
    const endPan=event=>{
      if (!pan || pan.id!==event.pointerId) return;
      if (pan.moved) suppressClickUntil=performance.now()+400;
      if (svg.hasPointerCapture?.(event.pointerId)) svg.releasePointerCapture(event.pointerId);
      pan=null;root.classList.remove('map-is-panning');
    };
    svg.addEventListener('pointerup',endPan);svg.addEventListener('pointercancel',endPan);
    svg.addEventListener('click',event=>{if(performance.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
    // Touch Events reserve only two-finger gestures; a single finger remains native page scroll.
    // This also covers touch browsers that cancel Pointer Events when native vertical scrolling starts.
    let pinch=null;
    const touchPair=touches=>{
      const [a,b]=touches;
      return {distance:Math.max(1,Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)),x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2};
    };
    svg.addEventListener('touchstart',event=>{
      if(event.touches.length!==2){pinch=null;return;}
      event.preventDefault();pinch=touchPair(event.touches);beginGesture(performance.now());
    },{passive:false});
    svg.addEventListener('touchmove',event=>{
      if(event.touches.length!==2 || !pinch)return;
      event.preventDefault();const next=touchPair(event.touches);
      gestureZoom(Math.max(-0.24,Math.min(0.24,Math.log(next.distance/pinch.distance))),next.x,next.y,pinch.x,pinch.y);
      pinch=next;suppressClickUntil=performance.now()+400;
    },{passive:false});
    const endPinch=event=>{if(event.touches.length<2){pinch=null;gestureGate.lastAt=performance.now();}};
    svg.addEventListener('touchend',endPinch);svg.addEventListener('touchcancel',endPinch);
  };
  /* End discovery gestures. */

  const squaredSegmentDistance = (point, start, end) => {
    let x = start[0];
    let y = start[1];
    let dx = end[0] - x;
    let dy = end[1] - y;
    if (dx || dy) {
      const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) { x = end[0]; y = end[1]; }
      else if (t > 0) { x += dx * t; y += dy * t; }
    }
    dx = point[0] - x;
    dy = point[1] - y;
    return dx * dx + dy * dy;
  };

  const distanceToGeometry = (point, geometry) => {
    let distance = Infinity;
    const visitRing = (ring) => {
      for (let index = 0; index < ring.length - 1; index += 1) distance = Math.min(distance, squaredSegmentDistance(point, ring[index], ring[index + 1]));
    };
    if (geometry.type === "Polygon") geometry.coordinates.forEach(visitRing);
    else geometry.coordinates.forEach((polygon) => polygon.forEach(visitRing));
    return Math.sqrt(distance);
  };

  const interiorLabelPoint = (geometry) => {
    const bounds = geographicBounds(geometry);
    let best = geometryCentroid(geometry);
    if (!pointInGeometry(best, geometry)) best = outerRings(geometry).reduce((largest, ring) => Math.abs(signedRingArea(ring)) > Math.abs(signedRingArea(largest)) ? ring : largest)[0];
    let bestDistance = pointInGeometry(best, geometry) ? distanceToGeometry(best, geometry) : -1;
    let search = { ...bounds };
    for (let pass = 0; pass < 3; pass += 1) {
      const columns = 12;
      const rows = 12;
      for (let column = 0; column <= columns; column += 1) for (let row = 0; row <= rows; row += 1) {
        const point = [search.minLongitude + (search.maxLongitude - search.minLongitude) * column / columns, search.minLatitude + (search.maxLatitude - search.minLatitude) * row / rows];
        if (!pointInGeometry(point, geometry)) continue;
        const distance = distanceToGeometry(point, geometry);
        if (distance > bestDistance) { best = point; bestDistance = distance; }
      }
      const longitudeRadius = (search.maxLongitude - search.minLongitude) / 6;
      const latitudeRadius = (search.maxLatitude - search.minLatitude) / 6;
      search = { minLongitude: best[0] - longitudeRadius, maxLongitude: best[0] + longitudeRadius, minLatitude: best[1] - latitudeRadius, maxLatitude: best[1] + latitudeRadius };
    }
    return best;
  };

  const setSummary = (eyebrow, heading, copy, count = "") => {
    summary.replaceChildren();
    const eyebrowElement = document.createElement("p");
    const headingElement = document.createElement("h3");
    const copyElement = document.createElement("p");
    eyebrowElement.className = "overline";
    eyebrowElement.textContent = eyebrow;
    headingElement.id = "map-summary-heading";
    headingElement.tabIndex = -1;
    headingElement.textContent = heading;
    copyElement.textContent = copy;
    if (atlasCanvas) copyElement.id = 'atlas-context-description';
    summary.append(eyebrowElement, headingElement, copyElement);
    if (count) {
      const countElement = document.createElement("span");
      countElement.className = "map-district-count";
      countElement.textContent = count;
      summary.append(countElement);
    }
  };

  const allRelatedRecords = () => {
    const seen = new Set();
    return Object.values(window.VIRSAPUR_RELATED_CONTENT || {})
      .flat()
      .filter((record) => {
        const key = record.url || `${record.type}:${record.title}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  const relatedRecordsForRegion = (regionId) => {
    const keys = (districtConfig.districtIdsByRegion[regionId] || [])
      .map((districtId) => districtConfig.districts[districtId]?.name?.toLowerCase())
      .filter(Boolean);
    const seen = new Set();
    return keys
      .flatMap((key) => window.VIRSAPUR_RELATED_CONTENT?.[key] || [])
      .filter((record) => {
        const identity = record.url || `${record.type}:${record.title}`;
        if (seen.has(identity)) return false;
        seen.add(identity);
        return true;
      });
  };

  const appendMetrics = (metrics) => {
    const populated = metrics.filter((metric) => Number(metric.value) > 0);
    if (!populated.length) return;
    const container = document.createElement("div");
    container.className = "map-context-metrics";
    populated.forEach((metric) => {
      const item = document.createElement("div");
      const value = document.createElement("strong");
      const label = document.createElement("span");
      value.textContent = String(metric.value);
      label.textContent = metric.label;
      item.append(value, label);
      container.append(item);
    });
    summary.append(container);
  };

  const appendRelatedRecords = (records) => {
    if (!records.length) return;
    const related = document.createElement("div");
    related.className = "map-related-content";
    const label = document.createElement("strong");
    label.textContent = "Explore related Virsapur content";
    related.append(label);
    records.slice(0, 3).forEach((record) => {
      const link = document.createElement("a");
      link.href = record.url;
      const type = `${record.type || "Content"}`;
      const title = `${record.title || "Untitled"}`.replace(/^DEMO\s*[—-]\s*/i, "");
      link.textContent = `${record.demo ? "DEMO · " : ""}${type.charAt(0).toUpperCase()}${type.slice(1)} — ${title}`;
      related.append(link);
    });
    summary.append(related);
  };

  const countrySummary = () => {
    setSummary(atlasCanvas ? 'Country' : config.country.instruction, config.country.name, atlasCanvas ? 'Explore Pakistan through its provinces, districts and heritage places.' : config.country.description);
    if (atlasCanvas) return;
    appendMetrics([
      { value: adm1.features.length, label: "provinces and regions" },
      { value: heritagePlaces.filter(isWorldHeritage).length, label: "World Heritage properties" },
    ]);
  };

  const regionSummary = (regionId) => {
    const region = regionById.get(regionId);
    const count = districtConfig.districtIdsByRegion[regionId]?.length ?? 0;
    const instruction =
      count === 1
        ? "This unit contains one mapped district in the current dataset. Select it to explore."
        : "Select a district to explore it.";
    setSummary(
      "Province / region",
      region.properties.name,
      atlasCanvas ? region.properties.description : `${region.properties.description} ${instruction}`,
      `${count} mapped ${districtConfig.source.date} district boundar${count === 1 ? "y" : "ies"}`,
    );
    appendRelatedRecords(relatedRecordsForRegion(regionId));
  };

  const districtSummary = (district) => {
    const region = regionById.get(district.parentRegionId);
    setSummary(`District · ${region.properties.name}`, district.displayName, atlasCanvas ? `Discover heritage in ${district.name}, within ${region.properties.name}.` : district.summary);
    const records = window.VIRSAPUR_RELATED_CONTENT?.[district.name.toLowerCase()] || [];
    appendRelatedRecords(records);
  };

  const componentsInScope = (record) => (record.components || []).filter((component) => {
    if (mapState.level === "country") return true;
    if (mapState.level === "region") return (component.regionIds || [component.regionId]).includes(mapState.regionId);
    return (component.districtIds || [component.districtId]).includes(mapState.districtId);
  });

  const heritageInScope = () => heritagePlaces.filter((record) => componentsInScope(record).length);

  const heritageScopeLabel = () => {
    if (mapState.level === "country") return "Pakistan";
    if (mapState.level === "region") return regionById.get(mapState.regionId)?.properties.name || "this region";
    return districtConfig.districts[mapState.districtId]?.displayName || "this district";
  };

  const propertyMeta = (record, scopedComponents = componentsInScope(record)) => {
    const regions = [...new Set(scopedComponents.flatMap((component) => component.regionIds || [component.regionId]).filter(Boolean))].map((id) => regionById.get(id)?.properties.name || id);
    const districts = [...new Set(scopedComponents.flatMap((component) => component.districtIds || [component.districtId]).filter(Boolean))].map((id) => districtConfig.districts[id]?.name || id);
    const places = mapState.level === "district" || !isWorldHeritage(record) ? districts : regions;
    return [...places, record.inscriptionYear].filter(Boolean).join(" · ");
  };

  const focusHeritage = (recordId, componentId = null) => {
    if (railMode !== 'selected') browseScroll = heritageRail?.scrollTop || 0;
    railMode = 'selected';
    selectedHeritageId = componentId || recordId;
    previewRecordId = null;
    previewAnchor = null;
    setRailOpen(true);
    renderHeritageContext();
    heritageRail.scrollTop = 0;
    heritageRail.querySelector('.atlas-record-title')?.focus({ preventScroll: true });
    heritageRail.scrollIntoView({ block: "nearest", behavior: "instant" });
  };

  const setDrawerOpen = (open) => {
    if (!drawer || root.dataset.mapVariant !== "full") return;
    if (open) { setRailOpen(false); setContextOpen(false); }
    drawer.hidden = !open;
    drawerToggle.setAttribute("aria-expanded", String(open));
    drawerAction.textContent = open ? "Close inventory −" : "See all heritage sites +";
    root.classList.toggle("map-drawer-open", open);
    if (!open) drawerContent.replaceChildren();
    if (open && !drawerContent.children.length) renderHeritageContext();
    if (open && !reducedMotionQuery.matches) drawer.animate([{ opacity: 0, transform: 'translateY(-5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: 'ease-out' });
  };

  const heritageThumbnail = (record) => {
    if (typeof record.image === "string" && /^(?:assets\/|\/assets\/)/.test(record.image)) {
      return `<img class="map-site-thumbnail" src="${escapeHtml(new URL(record.image.replace(/^\//, ""), siteBaseUrl).href)}" alt="${escapeHtml(record.imageAlt || record.title)}" loading="lazy" width="72" height="88">`;
    }
    return `<span class="map-site-symbol${isWorldHeritage(record) ? "" : " is-curated"}" aria-label="Site photograph not yet available"><span aria-hidden="true">${isWorldHeritage(record) ? "◇" : "○"}</span><small>Image pending</small></span>`;
  };

  const syncHeritageSelection = () => {
    heritageRail?.querySelectorAll("[data-heritage-entry]").forEach(entry => {
      const record = heritagePlaces.find(item => item.id === entry.dataset.heritageEntry);
      entry.classList.toggle("is-selected", record?.id === selectedHeritageId || record?.components.some(component => component.id === selectedHeritageId));
    });
    drawerContent?.querySelectorAll(".map-heritage-card").forEach(card => {
      const record = heritagePlaces.find(item => item.id === card.querySelector("[data-heritage-key]")?.dataset.heritageKey);
      card.classList.toggle("is-selected", record?.id === selectedHeritageId || record?.components.some(component => component.id === selectedHeritageId));
    });
    root.querySelectorAll(".map-heritage-marker").forEach(marker => {
      const active = marker.dataset.componentId === selectedHeritageId || marker.dataset.propertyId === selectedHeritageId;
      marker.classList.toggle("is-selected", active);
      marker.setAttribute("aria-pressed", String(active));
    });
    heritageRail?.querySelectorAll('[data-component-row]').forEach(row => row.classList.toggle('is-selected', row.dataset.componentRow === selectedHeritageId));
    updateMarkerCollisions();
    renderMarkerPreview();
  };

  const previewHeritage = (recordId, anchor = null) => {
    previewRecordId = recordId;
    previewAnchor = anchor;
    root.querySelectorAll('[data-heritage-entry],.map-heritage-card,.map-heritage-marker').forEach(element => {
      const id = element.dataset.heritageEntry || element.dataset.propertyId || element.querySelector('[data-heritage-key]')?.dataset.heritageKey;
      element.classList.toggle('is-previewed', Boolean(recordId) && id === recordId);
    });
    root.querySelectorAll('.atlas-proximity-cluster').forEach(cluster=>cluster.classList.toggle('is-previewed',Boolean(recordId) && cluster.dataset.propertyIds.split(' ').includes(recordId)));
    renderMarkerPreview();
  };

  function renderMarkerPreview() {
    if (!selectedNote) return;
    // Selection belongs exclusively to the detail sheet, never a second floating card.
    if (railMode === 'selected' || !heritageRail.hidden || !drawer.hidden || root.classList.contains('atlas-context-expanded')) { selectedNote.hidden=true; return; }
    const id = previewRecordId;
    const record = heritageInScope().find(item => item.id === id || item.components.some(component => component.id === id));
    const markers = record ? [...root.querySelectorAll(`.map-heritage-marker[data-property-id="${CSS.escape(record.id)}"]`)] : [];
    const visible = marker => marker.isConnected && getComputedStyle(marker).display !== 'none';
    const anchor = previewAnchor && visible(previewAnchor) ? previewAnchor : markers.find(marker => marker.dataset.componentId === selectedHeritageId && visible(marker)) || markers.find(visible);
    selectedNote.hidden = !record || !anchor || mapState.level === 'country';
    if (selectedNote.hidden) return;
    const component = record.components.find(item => item.id === anchor.dataset.componentId);
    const name = component?.name || record.shortTitle || record.title;
    selectedNote.innerHTML = `${atlasCanvas && !record.image ? '' : heritageThumbnail(record)}<span><small>${isWorldHeritage(record) ? 'UNESCO World Heritage' : 'Major Heritage'}</small><strong>${escapeHtml(name)}</strong><em>${escapeHtml(propertyMeta(record))}</em></span><button type="button" aria-label="Open ${escapeHtml(name)} heritage card">↗</button>`;
    selectedNote.querySelector('button').addEventListener('click', () => focusHeritage(record.id, component?.id));
    positionMarkerPreview(anchor);
  }

  function positionMarkerPreview(anchor) {
    if (!selectedNote || selectedNote.hidden || !anchor) return;
    const canvas = atlasCanvas.getBoundingClientRect();
    const marker = anchor.getBoundingClientRect();
    const x = marker.x + marker.width / 2 - canvas.x, y = marker.y + marker.height / 2 - canvas.y;
    if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) { selectedNote.hidden = true; return; }
    const width = Math.min(282, canvas.width - 24);
    selectedNote.style.width = `${width}px`;
    const height = selectedNote.offsetHeight;
    const obstacles = [...atlasCanvas.querySelectorAll('.map-controls,.map-world-inset,.map-scope')].filter(el => getComputedStyle(el).display !== 'none').map(el => { const r=el.getBoundingClientRect(); return {x:r.x-canvas.x,y:r.y-canvas.y,width:r.width,height:r.height}; });
    const candidates = [[x-width/2,y-height-23,'above'],[x-width/2,y+23,'below'],[x-width-24,y-height/2,'left'],[x+24,y-height/2,'right']].map(([left,top,side])=>({left:Math.max(12,Math.min(left,canvas.width-width-12)),top:Math.max(12,Math.min(top,canvas.height-height-12)),side}));
    const collision = p => obstacles.some(o=>p.left<o.x+o.width+8 && p.left+width>o.x-8 && p.top<o.y+o.height+8 && p.top+height>o.y-8);
    const position = candidates.find(p=>!collision(p));
    // Suppress rather than obscure controls if a very small viewport has no safe slot.
    if (!position) { selectedNote.hidden = true; return; }
    selectedNote.style.left = `${position.left}px`; selectedNote.style.top = `${position.top}px`;
    selectedNote.dataset.side = position.side;
  }

  const renderContextFacts = () => {
    if (!contextFacts) return;
    summary.querySelector('.map-context-metrics')?.remove();
    const records = heritageInScope();
    const worldCount=records.filter(isWorldHeritage).length;
    const majorCount=records.length-worldCount;
    const levelName=mapState.level==='country'?'Country':mapState.level==='region'?'Province / region':'District';
    root.querySelector('[data-atlas-level]').textContent=mapState.level==='country'?'01':mapState.level==='region'?'02':'03';
    root.querySelector('.atlas-folio span').textContent=levelName;
    const media=mapState.level==='country'?scopeMedia.country:mapState.level==='region'?scopeMedia.regions?.[mapState.regionId]:scopeMedia.districts?.[mapState.districtId];
    const photo=media?records.find(record=>record.id===media.recordId&&record.image):null;
    const geographicCount=mapState.level==='country'?adm1.features.length:districtConfig.districtIdsByRegion[mapState.regionId]?.length||0;
    const facts=mapState.level==='district'?[[worldCount,'World Heritage'],[majorCount,'Major Heritage']]:[[geographicCount,mapState.level==='country'?'Provinces & regions':'Districts'],[worldCount,'World Heritage'],[records.length,'Mapped places']];
    contextFacts.innerHTML='<dl>'+facts.map(([value,label])=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')+'</dl>'+(photo?'<figure class="atlas-guide-image" style="--atlas-image-position:'+escapeHtml(media.position||'50% 50%')+'">'+heritageThumbnail(photo)+'<figcaption>'+escapeHtml(media.caption)+'</figcaption></figure>':'');
    const compact=root.querySelector('.atlas-mobile-context');
    compact.innerHTML='<strong>'+escapeHtml(heritageScopeLabel())+'</strong><span>'+facts.map(([value,label])=>value+' '+(label==='Provinces & regions'?'regions':label.toLowerCase())).join(' · ')+'</span>';
    root.querySelector('.atlas-place-bar').innerHTML=compact.innerHTML;
    const toggle=contextPanel.querySelector('.atlas-context-toggle');
    toggle.textContent=root.classList.contains('atlas-context-expanded')?'Close place guide ×':'About '+heritageScopeLabel()+' →';
    panelToggle.textContent=heritageRail.hidden?'Heritage · '+records.length+' →':'Close heritage ×';
    panelToggle.setAttribute('aria-label',heritageRail.hidden?'Open heritage in '+heritageScopeLabel():'Close heritage panel');
    railHandle.innerHTML='<span>Heritage in '+escapeHtml(heritageScopeLabel())+'</span><b>'+records.length+' →</b>';
  };

  const renderDistrictIndex = () => {
    if (!districtIndex) return;
    if (mapState.level !== "region") { districtIndex.replaceChildren(); return; }
    const collection = districtCollections.get(mapState.regionId);
    const features = [...(collection?.features || [])].sort((a, b) => districtConfig.districts[a.id].name.localeCompare(districtConfig.districts[b.id].name));
    districtIndex.innerHTML = `<details open><summary>Districts <span>${features.length}</span></summary><div class="map-district-index-list">${features.map((feature) => `<button type="button" data-district-index="${escapeHtml(feature.id)}">${escapeHtml(districtConfig.districts[feature.id].name)}</button>`).join("")}</div></details>`;
    districtIndex.querySelectorAll("[data-district-index]").forEach((button) => {
      const feature = features.find((item) => item.id === button.dataset.districtIndex);
      button.addEventListener("pointerenter", () => document.getElementById(`district-${feature.id}`)?.classList.add("is-index-preview"));
      button.addEventListener("pointerleave", () => document.getElementById(`district-${feature.id}`)?.classList.remove("is-index-preview"));
      button.addEventListener("focus", () => document.getElementById(`district-${feature.id}`)?.classList.add("is-index-preview"));
      button.addEventListener("blur", () => document.getElementById(`district-${feature.id}`)?.classList.remove("is-index-preview"));
      button.addEventListener("click", () => setMapState({ level: "district", regionId: mapState.regionId, districtId: feature.id }, { historyMode: "push" }));
    });
  };

  function renderHeritageContext() {
    if (drawer?.hidden) drawerContent?.replaceChildren();
    const compactTray = Boolean(atlasCanvas && mapState.level !== 'country');
    if (atlasCanvas) {
      root.classList.toggle('atlas-map-tray', compactTray);
      const dock = drawer.closest('.map-heritage-dock');
      const stage = root.querySelector('.map-stage');
      const workspace = root.querySelector('.map-workspace');
      if (compactTray && dock.parentElement !== stage) stage.append(dock);
      else if (!compactTray && dock.previousElementSibling !== workspace) workspace.after(dock);
      if (window.matchMedia('(max-width:760px)').matches) (compactTray ? workspace : dock).after(contextPanel);
      if (compactTray) { inventoryQuery = ''; inventoryFilter = 'all'; }
    }
    const records = heritageInScope();
    const unesco = records.filter(isWorldHeritage);
    const selected = (record) => selectedHeritageId === record.id || record.components.some(component => component.id === selectedHeritageId);
    const major = records.filter(record => !isWorldHeritage(record));
    const scopeKey = [mapState.level,mapState.regionId,mapState.districtId].join(':');
    const scopeChanged = railScopeKey !== scopeKey;
    if (scopeChanged) { railMode='browse'; browseScroll=0; railScopeKey=scopeKey; expandedHeritage.clear(); if(atlasCanvas){setRailOpen(false);setContextOpen(false);setDrawerOpen(false);} }
    const previousScroll = heritageRail?.scrollTop || 0;
    const designation = record => isWorldHeritage(record) ? 'UNESCO World Heritage' : 'Major Heritage';
    const sourceLink = record => /^https:\/\//.test(record.sourceUrl || '') ? '<a href="'+escapeHtml(record.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Source ↗</a>' : '';
    const image = record => atlasCanvas && !record.image ? '' : '<figure class="atlas-record-image">'+heritageThumbnail(record)+'</figure>';
    const componentsMarkup = record => {
      if (record.components.length < 2) return '';
      const scoped = componentsInScope(record);
      const total = record.components.length;
      const counts = [...new Set(record.components.flatMap(component=>component.districtIds || []))].map(id=>({name:districtConfig.districts[id]?.name,count:record.components.filter(c=>c.districtIds?.includes(id)).length})).filter(item=>item.name);
      const context = counts.length>1 ? '<p class="atlas-component-context">'+counts.map(item=>item.count+' in '+escapeHtml(item.name)).join(' · ')+'</p>' : '';
      return '<details class="atlas-component-disclosure"><summary>'+total+' components <span>View components +</span></summary>'+context+'<p class="map-site-note">'+scoped.length+' in this view. Source gaps and shared contexts are retained.</p><ul>'+scoped.map(component=>'<li data-component-row="'+escapeHtml(component.id)+'">'+escapeHtml(component.name)+(component.latitude==null?' <small>Location not supplied by source</small>':!component.districtId?' <small>District association awaiting review</small>':mapState.level!=='country'?' <button type="button" data-component-select="'+escapeHtml(component.id)+'" data-property="'+escapeHtml(record.id)+'" aria-label="Highlight '+escapeHtml(component.name)+' on map">Locate ↗</button>':'')+'</li>').join('')+'</ul></details>';
    };
    const recordBody = record => image(record)+'<p class="atlas-category">'+escapeHtml(designation(record))+'</p><h3 class="atlas-record-title" tabindex="-1">'+escapeHtml(record.shortTitle||record.title)+'</h3><p class="atlas-record-meta">'+escapeHtml(record.heritageCategory)+' · '+escapeHtml(propertyMeta(record))+'</p><p class="atlas-record-summary">'+escapeHtml(record.summary)+'</p>'+(record.designationType==='unesco-tentative-list'?'<p class="atlas-tentative-note">UNESCO Tentative List · Not inscribed on the World Heritage List</p>':'')+componentsMarkup(record)+'<div class="atlas-record-actions"><button type="button" data-record-locate="'+escapeHtml(record.id)+'">Show on map →</button>'+(record.detailsPagePath?'<a href="'+escapeHtml(new URL(record.detailsPagePath.slice(1)+'/index.html',siteBaseUrl).href)+'">Explore this place →</a>':'')+sourceLink(record)+'</div>';
    const entry = (record,index) => atlasCanvas
      ? '<article class="atlas-discovery-card'+(index===0&&record.image?' is-feature':'')+'" data-heritage-entry="'+escapeHtml(record.id)+'"><button type="button" data-atlas-record="'+escapeHtml(record.id)+'">'+(index===0&&record.image?heritageThumbnail(record):'')+'<span><small>'+designation(record)+'</small><strong>'+escapeHtml(record.shortTitle||record.title)+'</strong>'+(index===0?'<em>'+escapeHtml(propertyMeta(record))+'</em>':'')+'</span><b aria-hidden="true">↗</b></button></article>'
      : '<details class="map-site-entry'+(selected(record)?' is-selected':'')+'" data-heritage-entry="'+escapeHtml(record.id)+'"'+(expandedHeritage.has(record.id)?' open':'')+'><summary>'+heritageThumbnail(record)+'<span><small>'+designation(record)+'</small><strong>'+escapeHtml(record.shortTitle||record.title)+'</strong><em>'+escapeHtml(propertyMeta(record))+'</em></span><b aria-hidden="true">+</b></summary><div class="map-site-detail">'+recordBody(record)+'</div></details>';
    // Browse is a curated introduction; the inventory remains complete.
    const ranked = [...major].sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured)) || (a.sortOrder??999)-(b.sortOrder??999));
    const featured = [];
    const districtCoverage = new Set();
    const limit = mapState.level==='country'?0:mapState.level==='district'&&records.length<=6?major.length:4;
    // First give different in-scope districts a voice, then fill remaining slots in editorial order.
    for (const record of ranked) {
      const districts=record.districtIds.filter(id=>mapState.level!=='region'||districtConfig.districts[id]?.parentRegionId===mapState.regionId);
      if(featured.length<limit && districts.some(id=>!districtCoverage.has(id))) {featured.push(record);districts.forEach(id=>districtCoverage.add(id));}
    }
    for(const record of ranked) if(featured.length<limit&&!featured.includes(record))featured.push(record);
    const active = records.find(selected);
    if (railMode==='selected' && !active) railMode='browse';
    if (heritageRail) {
      heritageRail.dataset.railMode=railMode;
      heritageRail.innerHTML=railMode==='selected'
        ? '<button type="button" class="atlas-back-browse">← Heritage in '+escapeHtml(heritageScopeLabel())+'</button><article class="atlas-selected-site" data-heritage-entry="'+escapeHtml(active.id)+'">'+recordBody(active)+'</article>'
        : '<header><p class="overline">'+(mapState.level==='country'?'World Heritage in Pakistan':'Heritage in '+escapeHtml(heritageScopeLabel()))+'</p><h3 tabindex="-1">'+(mapState.level==='country'?unesco.length+' properties':'Discover through place')+'</h3>'+(mapState.level==='country'?'':'<p class="atlas-browse-counts"><span><b>'+unesco.length+'</b> World Heritage</span><span><b>'+major.length+'</b> Major Heritage</span></p>')+'</header><div class="map-rail-entries">'+(unesco.length?'<h4 class="atlas-rail-group">World Heritage <span>'+unesco.length+'</span></h4>'+unesco.map(entry).join(''):'')+(featured.length?'<h4 class="atlas-rail-group">'+(featured.length<major.length?'Featured Major Heritage':'Major Heritage')+' <span>'+featured.length+'</span></h4>'+featured.map(entry).join(''):'')+(!records.length?'<p class="map-rail-caption">No verified records in this view yet. Explore another district or browse the wider region.</p>':'')+'</div><button class="map-browse-all" type="button">Explore all '+records.length+' places <span>→</span></button>';
      heritageRail.scrollTop=scopeChanged?0:previousScroll;
      if(atlasCanvas){
        const close=document.createElement('button');close.type='button';close.className='atlas-sheet-close';close.textContent='Close ×';close.setAttribute('aria-label','Close heritage panel');
        close.addEventListener('click',()=>{setRailOpen(false);panelToggle.focus({preventScroll:true});});
        heritageRail.prepend(close);
        heritageRail.querySelectorAll('[data-atlas-record]').forEach(button=>button.addEventListener('click',()=>focusHeritage(button.dataset.atlasRecord)));
      }
    }
    if (drawerCount) drawerCount.textContent = String(records.length);
    const drawerTitle = root.querySelector("[data-heritage-drawer-title]");
    if (drawerTitle) drawerTitle.textContent = compactTray ? `Heritage in ${heritageScopeLabel()}` : atlasCanvas ? 'Browse all heritage' : `Heritage inventory · ${heritageScopeLabel()}`;
    if (drawerAction && drawer?.hidden) drawerAction.textContent = "See all heritage sites +";
    if (drawerContent && drawer && !drawer.hidden) {
      const groups = [['unesco', 'UNESCO World Heritage', records.filter(isWorldHeritage)], ['curated', 'Major Heritage', records.filter(record => !isWorldHeritage(record))]];
      drawerContent.innerHTML = `<div class="map-drawer-heading">${atlasCanvas ? `<p class="overline">Heritage in ${escapeHtml(heritageScopeLabel())}</p><h3>${records.length} places</h3>` : `<p class="overline">The place index</p><h3>${escapeHtml(heritageScopeLabel())}</h3><p>A growing inventory, not an exhaustive register. Search the places currently mapped here.</p>`}</div><div class="atlas-inventory-body"><div class="atlas-inventory-tools"><label>${atlasCanvas ? '<span class="atlas-search-label">Search heritage inventory</span>' : 'Search this inventory'}<input type="search" data-inventory-search placeholder="${atlasCanvas ? 'Search heritage or component name' : 'Place or component name'}" value="${escapeHtml(inventoryQuery)}"></label><div role="group" aria-label="Filter heritage inventory">${[['all','All'],['unesco','World Heritage'],['curated','Major Heritage']].map(([value,label]) => `<button type="button" data-inventory-filter="${value}" aria-pressed="${inventoryFilter === value}">${label} <span>${value === 'all' ? records.length : groups.find(group => group[0] === value)[2].length}</span></button>`).join('')}</div></div><p class="atlas-inventory-result" role="status" data-inventory-result></p>${groups.filter(group => group[2].length).map(([type,title,items]) => `<section class="atlas-inventory-group" data-inventory-group="${type}"><h4>${title} <span>${items.length}</span></h4><div class="map-heritage-card-list">${items.map(record => `<article class="map-heritage-card${selected(record) ? ' is-selected' : ''}" data-inventory-type="${type}"><button type="button" data-heritage-key="${escapeHtml(record.id)}">${atlasCanvas && !record.image ? (compactTray ? '<span class="atlas-tray-glyph" aria-hidden="true">◇</span>' : '') : heritageThumbnail(record)}<span class="atlas-tray-copy"><small>${isWorldHeritage(record) ? `World Heritage · ${record.inscriptionYear}` : 'Major Heritage'}</small><strong>${escapeHtml(compactTray ? record.shortTitle || record.title : record.title)}</strong><em>${escapeHtml(compactTray ? [...new Set(componentsInScope(record).flatMap(component => component.districtIds || [component.districtId]))].map(id => districtConfig.districts[id]?.name).filter(Boolean).join(' / ') : propertyMeta(record))}</em><span class="map-inventory-summary">${escapeHtml(record.summary)}</span></span><b>Open on map ↗</b></button></article>`).join('')}</div></section>`).join('')}<p class="map-heritage-empty" data-inventory-empty hidden>No matching places in this view. Try another search or explore a neighbouring district.</p></div>`;
      drawerContent.querySelector('[data-inventory-search]').addEventListener('input', event => { inventoryQuery = event.target.value; applyInventoryFilter(); });
      if (compactTray) drawerContent.querySelectorAll('[data-heritage-key]').forEach(button=>{
        const record = records.find(item=>item.id===button.dataset.heritageKey);
        button.setAttribute('aria-label',`Open ${record.shortTitle || record.title} heritage details`);
        button.querySelector('img')?.setAttribute('alt','');
        button.querySelector('b')?.setAttribute('aria-hidden','true');
      });
      drawerContent.querySelectorAll('[data-inventory-filter]').forEach(button => button.addEventListener('click', () => { inventoryFilter = button.dataset.inventoryFilter; applyInventoryFilter(); }));
      applyInventoryFilter();
    }
    heritageRail?.querySelector('.atlas-back-browse')?.addEventListener('click',()=>{
      railMode='browse'; selectedHeritageId=null; previewRecordId=null; previewAnchor=null; expandedHeritage.clear();
      renderHeritageContext(); heritageRail.scrollTop=browseScroll;
      heritageRail.querySelector('header h3')?.focus({preventScroll:true});
    });
    heritageRail?.querySelectorAll('details[data-heritage-entry]').forEach(details=>{
      details.addEventListener('toggle',()=>{
        if(!details.isConnected)return;
        if(details.open){
          expandedHeritage.clear();expandedHeritage.add(details.dataset.heritageEntry);
          heritageRail.querySelectorAll('details[data-heritage-entry]').forEach(other=>{if(other!==details)other.open=false;});
          selectedHeritageId=details.dataset.heritageEntry;
        }else {
          expandedHeritage.delete(details.dataset.heritageEntry);
          if(selectedHeritageId===details.dataset.heritageEntry) {selectedHeritageId=null;previewRecordId=null;previewAnchor=null;}
        }
        railMode=expandedHeritage.size?'expanded':'browse';heritageRail.dataset.railMode=railMode;
        syncHeritageSelection();
      });
    });
    heritageRail?.querySelectorAll('[data-record-locate]').forEach(button=>button.addEventListener('click',async()=>{
      const record=records.find(item=>item.id===button.dataset.recordLocate);
      const component=componentsInScope(record).find(item=>item.latitude!=null&&item.districtId);
      if(!component)return;
      if(mapState.level==='country') await setMapState({level:'region',regionId:component.regionId,districtId:null},{historyMode:'push'});
      focusHeritage(record.id);
      if(lastDistrictRender){
        const [x,y]=lastDistrictRender.project([component.longitude,component.latitude]);
        const [bx,by,bw,bh]=currentLayout.viewBox;camera.offsetX=x-bx-bw/2;camera.offsetY=y-by-bh/2;
        applyCamera({animate:false});
      }
      svg.scrollIntoView({block:'center',behavior:'instant'});
    }));
    heritageRail?.querySelectorAll("[data-component-select]").forEach(button => button.addEventListener("click", () => {
      selectedHeritageId = button.dataset.componentSelect;
      if (camera.scale < 1.75 && root.querySelector(`.is-cluster-component[data-component-id="${CSS.escape(selectedHeritageId)}"]`)) {
        camera.scale = 1.8;
      }
      const component = heritagePlaces.find(record => record.id === button.dataset.property)?.components.find(item => item.id === selectedHeritageId);
      if (component && lastDistrictRender) {
        const [x, y] = lastDistrictRender.project([component.longitude, component.latitude]);
        const [baseX, baseY, baseWidth, baseHeight] = currentLayout.viewBox;
        camera.offsetX = x - baseX - baseWidth / 2;
        camera.offsetY = y - baseY - baseHeight / 2;
        applyCamera({ animate: false });
      }
      syncHeritageSelection();
      const marker = root.querySelector(`.map-heritage-marker[data-component-id="${CSS.escape(selectedHeritageId)}"]`);
      marker?.focus({ preventScroll: true });
      svg.scrollIntoView({ block: "center", behavior: "instant" });
    }));
    heritageRail?.querySelectorAll('[data-property-open]').forEach(button => button.addEventListener('click', async () => {
      const record = records.find(item => item.id === button.dataset.propertyOpen);
      const component = record?.components.find(item => item.regionId);
      if (!component) return;
      await setMapState({level:'region',regionId:component.regionId,districtId:null},{historyMode:'push'});
      focusHeritage(record.id);
    }));
    drawerContent?.querySelectorAll("[data-heritage-key]").forEach(button => button.addEventListener("click", async () => {
      const record = records.find(item => item.id === button.dataset.heritageKey);
      if (mapState.level === "country") {
        const component = record.components.find(item => item.regionId);
        if (component) await setMapState({ level: "region", regionId: component.regionId, districtId: null }, { historyMode: "push" });
      }
      setDrawerOpen(false);
      focusHeritage(record.id);
    }));
    heritageRail?.querySelector(".map-browse-all")?.addEventListener("click", () => {
      setDrawerOpen(true);
      drawerToggle?.focus({ preventScroll: true });
      drawer?.scrollIntoView({ block: "nearest", behavior: "instant" });
    });
    syncHeritageSelection();
    root.querySelectorAll('[data-heritage-entry],.map-heritage-card').forEach(element => {
      const id = element.dataset.heritageEntry || element.querySelector('[data-heritage-key]')?.dataset.heritageKey;
      element.addEventListener('pointerenter', () => previewHeritage(id));
      element.addEventListener('pointerleave', () => previewHeritage(null));
      element.addEventListener('focusin', () => previewHeritage(id));
      element.addEventListener('focusout', () => previewHeritage(null));
    });
    renderContextFacts();
    renderDistrictIndex();
  }

  function applyInventoryFilter() {
    if (!drawerContent) return;
    let count = 0;
    const query = inventoryQuery.trim().toLocaleLowerCase();
    drawerContent.querySelectorAll('[data-inventory-type]').forEach(card => {
      const record = heritagePlaces.find(item => item.id === card.querySelector('[data-heritage-key]').dataset.heritageKey);
      const text = [record.title, record.shortTitle, record.summary, ...componentsInScope(record).map(component => component.name)].join(' ').toLocaleLowerCase();
      card.hidden = !(inventoryFilter === 'all' || inventoryFilter === card.dataset.inventoryType) || !text.includes(query);
      if (!card.hidden) count++;
    });
    drawerContent.querySelectorAll('[data-inventory-group]').forEach(group => {
      const visible = group.querySelectorAll('[data-inventory-type]:not([hidden])').length;
      const total = group.querySelectorAll('[data-inventory-type]').length;
      group.hidden = !visible;
      group.querySelector('h4 span').textContent = visible === total ? String(total) : `${visible} / ${total}`;
    });
    drawerContent.querySelectorAll('[data-inventory-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.inventoryFilter === inventoryFilter)));
    const result = drawerContent.querySelector('[data-inventory-result]');
    if (result) result.textContent = `${count} ${count === 1 ? 'place' : 'places'} shown · ${heritageScopeLabel()}`;
    const empty = drawerContent.querySelector('[data-inventory-empty]');
    if (empty) empty.hidden = count > 0;
  }

  const previewRegion = (feature) => {
    if (atlasCanvas) return; // The place guide describes the current scope, not incidental hover.
    if (mapState.level !== "country") return;
    setSummary("Province / region", feature.properties.name, feature.properties.description);
  };

  const restoreSummary = () => {
    if (mapState.level === "country") countrySummary();
    if (mapState.level === "region" && routeNotice) {
      const region = regionById.get(mapState.regionId);
      setSummary("Administrative update", region.properties.name, routeNotice);
    } else if (mapState.level === "region") regionSummary(mapState.regionId);
    if (mapState.level === "district") districtSummary(districtConfig.districts[mapState.districtId]);
  };

  const previewDistrict = (district) => {
    if (atlasCanvas) return;
    if (mapState.level !== "region") return;
    const region = regionById.get(district.parentRegionId);
    setSummary(`District in ${region.properties.name}`, district.displayName, "Select to open district view.");
  };

  const breadcrumbButton = (label, ariaLabel, state, focusId) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-label", ariaLabel);
    button.addEventListener("click", () => setMapState(state, { historyMode: "push", focusId }));
    return button;
  };

  const renderBreadcrumbs = () => {
    crumbs.replaceChildren();
    if (mapState.level === "country") {
      const current = document.createElement("span");
      current.textContent = config.country.name;
      current.setAttribute("aria-current", "location");
      crumbs.append(current);
      return;
    }

    const region = regionById.get(mapState.regionId);
    crumbs.append(
      breadcrumbButton("Pakistan", "Return to Pakistan country view", countryState, `region-${region.id}`),
    );
    if (mapState.level === "region") {
      const current = document.createElement("span");
      current.textContent = region.properties.name;
      current.setAttribute("aria-current", "location");
      crumbs.append(current);
      return;
    }

    const district = districtConfig.districts[mapState.districtId];
    crumbs.append(
      breadcrumbButton(
        region.properties.name,
        `Return to ${region.properties.name} district map`,
        { level: "region", regionId: region.id, districtId: null },
        `district-${district.id}`,
      ),
    );
    const current = document.createElement("span");
    current.textContent = district.displayName;
    current.setAttribute("aria-current", "location");
    crumbs.append(current);
  };

  const renderControls = () => {
    renderBreadcrumbs();
    backButton.hidden = mapState.level === "country";
    if (mapState.level === "country") {
      layerName.textContent = "Country view";
      return;
    }
    const region = regionById.get(mapState.regionId);
    if (mapState.level === "region") {
      layerName.textContent = "Province / region view";
      backButton.textContent = (atlasCanvas ? '← ' : '') + "Back to Pakistan";
    } else {
      layerName.textContent = "District view";
      backButton.textContent = `${atlasCanvas ? '← ' : ''}Back to ${region.properties.name}`;
    }
  };

  const showLoadStatus = (message, { error = false, retry = false } = {}) => {
    loadStatus.hidden = false;
    loadStatus.classList.toggle("is-error", error);
    loadStatusText.textContent = message;
    retryButton.hidden = !retry;
  };

  const hideLoadStatus = () => {
    loadStatus.hidden = true;
    loadStatus.classList.remove("is-error");
    retryButton.hidden = true;
  };

  const labelLines = (name) => {
    if (name.length <= 15 || !name.includes(" ")) return [name];
    const words = name.split(" ");
    let first = "";
    let second = "";
    for (const word of words) {
      if (!first || first.length + word.length + 1 <= Math.ceil(name.length / 2)) first += `${first ? " " : ""}${word}`;
      else second += `${second ? " " : ""}${word}`;
    }
    return second ? [first, second] : [first];
  };

  const renderRegionLabel = (feature, group) => {
    group.replaceChildren();
    const labelConfig = config.regionDisplay[feature.id].label[layoutMode];
    const [anchorX, anchorY] = countryProject(geometryCentroid(feature.geometry));
    const align = labelConfig.align || "middle";
    const labelX = anchorX + labelConfig.offset[0];
    const labelY = anchorY + labelConfig.offset[1];
    group.className.baseVal = `map-label map-label-${labelConfig.mode}`;

    if (labelConfig.mode === "callout") {
      group.append(
        makeSvgElement("line", {
          class: "map-label-leader",
          x1: anchorX.toFixed(2),
          y1: anchorY.toFixed(2),
          x2: (align === "start" ? labelX - 8 : labelX + 8).toFixed(2),
          y2: (labelY - 4).toFixed(2),
          "vector-effect": "non-scaling-stroke",
        }),
        makeSvgElement("circle", {
          class: "map-label-anchor",
          cx: anchorX.toFixed(2),
          cy: anchorY.toFixed(2),
          r: "2.4",
          "vector-effect": "non-scaling-stroke",
        }),
      );
    }

    const text = makeSvgElement("text", {
      x: labelX.toFixed(2),
      y: labelY.toFixed(2),
      "text-anchor": align,
      "aria-hidden": "true",
    });
    labelConfig.lines.forEach((line, index) => {
      const tspan = makeSvgElement("tspan", {
        x: labelX.toFixed(2),
        dy: index === 0 ? `${-((labelConfig.lines.length - 1) * 7)}px` : "14px",
      });
      tspan.textContent = line;
      text.append(tspan);
    });
    group.append(text);
  };

  const renderCountryGeometry = () => {
    configureCountryProjection();
    for (const feature of adm1.features) {
      const rendered = renderedRegions.get(feature.id);
      rendered.path.setAttribute("d", geometryPath(feature.geometry, countryProject));
      rendered.path.removeAttribute("aria-hidden");
      rendered.path.setAttribute("tabindex", "0");
      rendered.path.setAttribute("aria-pressed", "false");
      renderRegionLabel(feature, rendered.label);
    }
  };

  const rectanglesOverlap = (left, right, padding) =>
    !(
      left.right + padding < right.left ||
      right.right + padding < left.left ||
      left.bottom + padding < right.top ||
      right.bottom + padding < left.top
    );

  const renderDistrictLabels = (features, project, selectedDistrictId = null) => {
    districtLabelsLayer.replaceChildren();
    const display = districtConfig.display[layoutMode];
    const ordered = selectedDistrictId ? features.filter((feature) => feature.id === selectedDistrictId) : [...features].sort((a, b) => a.properties.labelPriority - b.properties.labelPriority);
    const mobileLimit = Math.min(ordered.length, display.maximumLabels + Math.floor(Math.max(0, camera.scale - 1) * 7));
    const candidates = layoutMode === "mobile" && !selectedDistrictId ? ordered.slice(0, mobileLimit) : ordered;
    const frame = focusFrame();
    const unit = atlasCanvas ? currentLayout.viewBox[2] / Math.max(1, atlasCanvas.getBoundingClientRect().width) / camera.scale : 1;
    const accepted = [];
    if (atlasCanvas) {
      const controls = root.querySelector('.map-controls').getBoundingClientRect();
      const canvas = svg.getBoundingClientRect();
      const [viewX,viewY,viewWidth,viewHeight] = cameraViewBox();
      accepted.push({
        left:viewX + (controls.left - canvas.left) / canvas.width * viewWidth - 8 * unit,
        right:viewX + (controls.right - canvas.left) / canvas.width * viewWidth + 8 * unit,
        top:viewY + (controls.top - canvas.top) / canvas.height * viewHeight - 8 * unit,
        bottom:viewY + (controls.bottom - canvas.top) / canvas.height * viewHeight + 8 * unit
      });
    }
    for (const record of heritageInScope()) {
      const components = componentsInScope(record).filter(component => component.latitude != null && component.longitude != null);
      const clustered = camera.scale < 1.75 && ((mapState.level === 'region' && components.length > 1) || (record.id === 'unesco-139' && components.length >= 4));
      const coordinates = clustered ? [[components.reduce((sum,item) => sum + item.longitude,0) / components.length,components.reduce((sum,item) => sum + item.latitude,0) / components.length]] : components.map(component => [component.longitude,component.latitude]);
      for (const coordinate of coordinates) {
        const [x,y] = project(coordinate);
        const padding = 19 * unit;
        accepted.push({left:x-padding,right:x+padding,top:y-padding,bottom:y+padding});
      }
    }

    for (const feature of candidates) {
      const district = districtConfig.districts[feature.id];
      const lines = labelLines(district.name);
      const anchor = project(interiorLabelPoint(feature.geometry));
      const width = Math.max(48, Math.max(...lines.map((line) => line.length)) * 6.3) * unit;
      const lineHeight = 14 * unit;
      const height = lines.length * lineHeight + 5 * unit;
      const candidateOffsets = [[0,0], ...[24,48,72,96,128,160,200].flatMap(radius => [[radius,0],[-radius,0],[0,-radius],[0,radius],[radius,-radius],[-radius,-radius],[radius,radius],[-radius,radius]])];
      let placement = null;
      let bestScore = Infinity;
      for (const [offsetX, offsetY] of candidateOffsets) {
        const x = anchor[0] + offsetX;
        const y = anchor[1] + offsetY;
        const rectangle = { left: x - width / 2, right: x + width / 2, top: y - height / 2, bottom: y + height / 2 };
        const outside = Math.max(0, frame.x - rectangle.left) + Math.max(0, rectangle.right - (frame.x + frame.width)) + Math.max(0, frame.y - rectangle.top) + Math.max(0, rectangle.bottom - (frame.y + frame.height));
        const collisions = accepted.filter((placed) => rectanglesOverlap(rectangle, placed, display.labelPadding)).length;
        const score = collisions * 1000 + outside * 20 + Math.hypot(offsetX, offsetY);
        if (!outside && !collisions) { bestScore = 0; placement = { x, y, rectangle, callout: offsetX !== 0 || offsetY !== 0 }; break; }
        if (score < bestScore) { bestScore = score; placement = { x, y, rectangle, callout: offsetX !== 0 || offsetY !== 0 }; }
      }
      if (layoutMode === "mobile" && !selectedDistrictId && (bestScore >= 1000 || !placement)) continue;
      const { x, y, rectangle, callout } = placement;
      accepted.push(rectangle);
      const group = makeSvgElement("g", { class: `map-district-label-group${callout ? " is-callout" : ""}`, "data-district-label": feature.id, "data-district-id": feature.id, "data-label-mode": callout ? "callout" : "internal" });
      if (callout) group.append(makeSvgElement("line", { class: "map-district-label-leader", x1: anchor[0].toFixed(2), y1: anchor[1].toFixed(2), x2: x.toFixed(2), y2: y.toFixed(2), "data-district-id": feature.id, "vector-effect": "non-scaling-stroke" }), makeSvgElement("circle", { class: "map-district-label-anchor", cx: anchor[0].toFixed(2), cy: anchor[1].toFixed(2), r: "1.9", "vector-effect": "non-scaling-stroke" }));
      const label = makeSvgElement("text", {
        class: selectedDistrictId ? "map-district-label is-selected" : "map-district-label",
        x: x.toFixed(2),
        y: y.toFixed(2),
        "text-anchor": "middle",
      });
      lines.forEach((line, index) => {
        const tspan = makeSvgElement("tspan", {
          x: x.toFixed(2),
          dy: index === 0 ? `${-((lines.length - 1) * lineHeight / 2)}px` : `${lineHeight}px`,
        });
        tspan.textContent = line;
        label.append(tspan);
      });
      group.append(label);
      districtLabelsLayer.append(group);
    }
    root.dataset.districtLabelsRendered = String(districtLabelsLayer.querySelectorAll("[data-district-label]").length);
    root.dataset.districtPolygonsRendered = String(selectedDistrictId ? 1 : features.length);
    lastDistrictRender = { features, project, selectedDistrictId };
  };

  function updateMarkerCollisions() {
    if (!heritageMarkersLayer) return;
    heritageMarkersLayer.querySelectorAll('.atlas-proximity-cluster').forEach(node => node.remove());
    const all = [...heritageMarkersLayer.querySelectorAll('.map-heritage-marker')];
    all.forEach(node => { node.classList.remove('atlas-collision-hidden'); node.removeAttribute('aria-hidden'); });
    if (mapState.level !== 'region' || !atlasCanvas || camera.scale >= cameraLimit()) return;
    const unit = currentLayout.viewBox[2] / Math.max(1,atlasCanvas.clientWidth) / camera.scale;
    const available = all.filter(node => !node.classList.contains('is-selected') && (camera.scale < 1.75 ? !node.classList.contains('is-cluster-component') : !node.classList.contains('is-cluster')));
    const groups = [];
    for (const node of available) {
      const point = node.transform.baseVal.consolidate().matrix;
      const group = groups.find(items => items.some(item => Math.hypot(item.x-point.e,item.y-point.f) < 26*unit));
      const item = {node,x:point.e,y:point.f};
      if (group) group.push(item); else groups.push([item]);
    }
    for (const group of groups.filter(items=>items.length>1)) {
      const records = [...new Set(group.map(item=>item.node.dataset.propertyId))].map(id=>heritagePlaces.find(record=>record.id===id));
      if (records.length < 2) continue;
      const x=group.reduce((sum,item)=>sum+item.x,0)/group.length, y=group.reduce((sum,item)=>sum+item.y,0)/group.length;
      group.forEach(({node})=>{node.classList.add('atlas-collision-hidden');node.setAttribute('aria-hidden','true');});
      const label = records.map(record=>record.shortTitle||record.title).join(', ');
      const cluster=makeSvgElement('g',{class:'atlas-proximity-cluster',transform:`translate(${x} ${y})`,role:'button',tabindex:'0','aria-label':`${records.length} nearby heritage places: ${label}. Open closer view.`});
      cluster.dataset.propertyIds = records.map(record=>record.id).join(' ');
      const title=makeSvgElement('title');title.textContent=label;
      cluster.append(title,makeSvgElement('circle',{r:22*unit,cy:-20*unit,fill:'transparent'}),makeSvgElement('path',{class:'atlas-cluster-tail',d:`M${-5*unit},${-10*unit} L0,0 L${5*unit},${-10*unit} Z`}),makeSvgElement('circle',{cy:-20*unit,r:14*unit,class:'atlas-proximity-core'}));
      const count=makeSvgElement('text',{'text-anchor':'middle','dominant-baseline':'central',y:-20*unit,'font-size':10*unit});count.textContent=records.length;cluster.append(count);
      const activate=()=>{
        const common=records[0].districtIds.find(id=>records.every(record=>record.districtIds.includes(id)) && districtConfig.districts[id]?.parentRegionId===mapState.regionId);
        if(common) {setMapState({level:'district',regionId:mapState.regionId,districtId:common},{historyMode:'push'});return;}
        camera.scale=Math.min(cameraLimit(),camera.scale*1.8);
        const [bx,by,bw,bh]=currentLayout.viewBox;camera.offsetX=x-bx-bw/2;camera.offsetY=y-by-bh/2;
        applyCamera();
      };
      cluster.addEventListener('click',activate);
      cluster.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activate();}});
      heritageMarkersLayer.append(cluster);
    }
  }

  const renderHeritageMarkers = (project) => {
    heritageMarkersLayer?.replaceChildren();
    if (!heritageMarkersLayer || mapState.level === "country") return;
    const scoped = heritagePlaces.map(record => ({ record, components: componentsInScope(record).filter(component => component.latitude != null && component.longitude != null) })).filter(item => item.components.length);
    const appendMarker = (record, component, className = "", count = 1) => {
      const point = component.clusterCoordinate || [component.longitude, component.latitude];
      const [x, y] = project(point);
      const label = count > 1 ? `${record.shortTitle || record.title} — ${count} mapped components in ${heritageScopeLabel()}` : `${component.name} — ${isWorldHeritage(record) ? "UNESCO World Heritage" : "Major Heritage, not World Heritage"}`;
      const marker = makeSvgElement("g", { class: `map-heritage-marker ${className}${isWorldHeritage(record) ? "" : " is-curated"}${selectedHeritageId === component.id || selectedHeritageId === record.id ? " is-selected" : ""}`, transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`, role: "button", tabindex: "0", "aria-label": label, "aria-pressed": "false", "data-property-id": record.id, "data-component-id": component.id });
      const title = makeSvgElement("title"); title.textContent = label;
      marker.append(makeSvgElement("circle", { class: "map-marker-hit", r: layoutMode === "mobile" ? "35" : "19", fill: "transparent", "pointer-events": "all" }));
      marker.append(title);
      const photoPin = atlasCanvas && !className.includes('component');
      if (photoPin) {
        marker.classList.add('has-photo-pin');
        const radius = isWorldHeritage(record) ? 16 : 14;
        const art = makeSvgElement('g', { class:'atlas-pin-art', 'aria-hidden':'true', 'pointer-events':'none' });
        art.append(makeSvgElement('path', { class:'atlas-pin-tail', d:'M-6,-11 L0,0 L6,-11 Z' }));
        art.append(makeSvgElement('circle', { class:'atlas-pin-ring', cx:0, cy:-24, r:radius+2 }));
        const clipId = 'atlas-photo-'+component.id.replace(/[^a-zA-Z0-9_-]/g,'-');
        const clip = makeSvgElement('clipPath', {id:clipId});
        clip.append(makeSvgElement('circle', {cx:0,cy:-24,r:radius}));
        art.append(clip);
        if (typeof record.image === 'string' && /^(?:assets\/|\/assets\/)/.test(record.image)) {
          art.append(makeSvgElement('image', { href:new URL(record.image.replace(/^\//,''),siteBaseUrl).href, x:-radius,y:-24-radius,width:radius*2,height:radius*2,'clip-path':`url(#${clipId})`,preserveAspectRatio:'xMidYMid slice','aria-hidden':'true' }));
        } else {
          const glyph = makeSvgElement('text', {class:'atlas-pin-glyph',x:0,y:-23,'text-anchor':'middle','dominant-baseline':'central'});
          glyph.textContent='◇'; art.append(glyph);
        }
        if (count > 1) {
          art.append(makeSvgElement('circle',{class:'atlas-pin-badge',cx:13,cy:-10,r:8}));
          const badge = makeSvgElement('text',{class:'atlas-pin-count',x:13,y:-10,'text-anchor':'middle','dominant-baseline':'central'});
          badge.textContent=String(count); art.append(badge);
        }
        marker.append(art);
      } else {
        marker.append(makeSvgElement('circle',{class:'map-heritage-marker-halo',r:count>1?16:12,'vector-effect':'non-scaling-stroke'}),makeSvgElement('circle',{class:'map-heritage-marker-core',r:count>1?8:6,'vector-effect':'non-scaling-stroke'}));
        if (count > 1) { const countText = makeSvgElement('text', {class:'map-heritage-marker-count','text-anchor':'middle',y:0,'dominant-baseline':'central'});countText.textContent=String(count);marker.append(countText); }
      }
      const activate = () => focusHeritage(record.id, count > 1 ? record.id : component.id);
      marker.addEventListener("click", activate);
      marker.addEventListener('pointerenter', () => previewHeritage(record.id, marker));
      marker.addEventListener('pointerleave', () => previewHeritage(null));
      marker.addEventListener('focus', () => previewHeritage(record.id, marker));
      marker.addEventListener('blur', () => previewHeritage(null));
      marker.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); } });
      heritageMarkersLayer.append(marker);
    };
    scoped.forEach(({ record, components }) => {
      const clustered = (mapState.level === "region" && components.length > 1) || (record.id === "unesco-139" && components.length >= 4);
      if (!clustered) components.forEach((component,index) => appendMarker(record, component, atlasCanvas && index > 0 ? 'is-component' : ''));
      else {
        const longitude = components.reduce((sum, component) => sum + component.longitude, 0) / components.length;
        const latitude = components.reduce((sum, component) => sum + component.latitude, 0) / components.length;
        appendMarker(record, { id: record.id, name: record.title, clusterCoordinate: [longitude, latitude] }, "is-cluster", components.length);
        components.forEach((component) => appendMarker(record, component, "is-cluster-component"));
      }
    });
    root.dataset.heritageMarkersRendered = String(heritageMarkersLayer.querySelectorAll(".map-heritage-marker:not(.is-cluster-component)").length);
    updateMarkerCollisions();
  };

  const renderDistrictGeometry = () => {
    districtPathsLayer.replaceChildren();
    districtLabelsLayer.replaceChildren();
    heritageMarkersLayer?.replaceChildren();
    lastDistrictRender = null;
    root.dataset.districtLabelsRendered = "0";
    root.dataset.heritageMarkersRendered = "0";
    const region = regionById.get(mapState.regionId);
    const collection = districtCollections.get(mapState.regionId);
    if (!region) return;

    const selectedFeature =
      mapState.level === "district"
        ? collection?.features.find((feature) => feature.id === mapState.districtId)
        : null;
    const focusGeometry = selectedFeature?.geometry ?? region.geometry;
    const frame = focusFrame();
    const project = projectBoundsIntoFrame(
      geographicBounds(focusGeometry),
      frame,
      root.dataset.mapVariant === "full" ? 0.98 : 0.94,
    );
    parentOutline.setAttribute("d", geometryPath(region.geometry, project));
    parentOutline.setAttribute("fill", "none");
    if (atlasCanvas) {
      let context = districtViewport.querySelector('.atlas-geographic-context');
      if (!context) {
        context = makeSvgElement('g', { class: 'atlas-geographic-context', 'aria-hidden': 'true', 'pointer-events': 'none' });
        districtViewport.prepend(context);
      }
      context.replaceChildren();
      // Surrounding land uses the same authoritative geometry and projection as the focus.
      const neighbours = mapState.level === 'district' ? (collection?.features || []).filter(feature => feature.id !== selectedFeature?.id) : adm1.features.filter(feature => feature.id !== region.id);
      context.dataset.contextLevel = mapState.level === 'district' ? 'adm2' : 'adm1';
      for (const neighbour of neighbours) context.append(makeSvgElement('path', { d: geometryPath(neighbour.geometry, project), class: 'atlas-neighbour-land', 'data-context-id': neighbour.id, 'vector-effect': 'non-scaling-stroke' }));
      const bounds = geographicBounds(focusGeometry);
      const step = mapState.level === 'district' ? 0.25 : 1;
      for (let longitude = Math.floor(bounds.minLongitude / step) * step; longitude <= bounds.maxLongitude + step; longitude += step) {
        const [x1,y1] = project([longitude,bounds.minLatitude - step]);
        const [x2,y2] = project([longitude,bounds.maxLatitude + step]);
        context.append(makeSvgElement('line', { x1,y1,x2,y2,class:'atlas-graticule','vector-effect':'non-scaling-stroke' }));
      }
      for (let latitude = Math.floor(bounds.minLatitude / step) * step; latitude <= bounds.maxLatitude + step; latitude += step) {
        const [x1,y1] = project([bounds.minLongitude - step,latitude]);
        const [x2,y2] = project([bounds.maxLongitude + step,latitude]);
        context.append(makeSvgElement('line', { x1,y1,x2,y2,class:'atlas-graticule','vector-effect':'non-scaling-stroke' }));
      }
    }

    if (!collection) return;
    const features = collection.features;
    features.forEach((feature, index) => {
      const district = districtConfig.districts[feature.id];
      const selected = feature.id === mapState.districtId;
      const hiddenSibling = mapState.level === "district" && !selected;
      const path = makeSvgElement("path", {
        id: `district-${feature.id}`,
        class: `map-district${selected ? " is-selected" : ""}${hiddenSibling ? " is-muted" : ""}`,
        d: geometryPath(feature.geometry, project),
        fill: region.properties.fill,
        "fill-opacity": String(0.72 + (index % 5) * 0.045),
        role: hiddenSibling ? "presentation" : "button",
        tabindex: hiddenSibling ? "-1" : "0",
        "aria-label": `Explore ${district.displayName} in ${region.properties.name}`,
        "aria-pressed": String(selected),
        "fill-rule": "evenodd",
        "vector-effect": "non-scaling-stroke",
      });
      if (hiddenSibling) path.setAttribute("aria-hidden", "true");
      path.addEventListener("pointerenter", () => previewDistrict(district));
      path.addEventListener("pointerleave", restoreSummary);
      path.addEventListener("focus", () => previewDistrict(district));
      path.addEventListener("blur", restoreSummary);
      path.addEventListener("click", () =>
        setMapState(
          { level: "district", regionId: mapState.regionId, districtId: feature.id },
          { historyMode: "push", focusId: `district-${feature.id}` },
        ),
      );
      path.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setMapState(
            { level: "district", regionId: mapState.regionId, districtId: feature.id },
            { historyMode: "push", focusId: `district-${feature.id}` },
          );
        }
      });
      districtPathsLayer.append(path);
    });
    renderDistrictLabels(features, project, mapState.level === "district" ? mapState.districtId : null);
    renderHeritageMarkers(project);
  };

  const renderState = ({ focusId = null } = {}) => {
    const level = mapState.level;
    const stateSignature = `${level}:${mapState.regionId || ""}:${mapState.districtId || ""}`;
    const hadRenderedState = Boolean(root.dataset.mapState);
    const stateChanged = root.dataset.mapState !== stateSignature;
    if (stateChanged) {
      camera = { scale: 1, offsetX: 0, offsetY: 0 };
      selectedHeritageId = null;
      inventoryFilter = 'all';
      inventoryQuery = '';
      expandedHeritage.clear();
    }
    const animateViewChange = hadRenderedState && stateChanged && !reducedMotionQuery.matches;
    root.classList.toggle("map-is-selected", level !== "country");
    root.classList.toggle("map-level-region", level === "region");
    root.classList.toggle("map-level-district", level === "district");
    countryViewport.toggleAttribute("hidden", level !== "country");
    districtViewport.toggleAttribute("hidden", level === "country");
    renderControls();

    if (level === "country") {
      heritageMarkersLayer?.replaceChildren();
      districtLabelsLayer.replaceChildren();
      lastDistrictRender = null;
      root.dataset.heritageMarkersRendered = "0";
      root.dataset.districtLabelsRendered = "0";
      svg.setAttribute("aria-label", "Interactive map of Pakistan’s provinces and regions");
      description.textContent = "Select one of seven geographic regions to open its province or region view.";
      renderCountryGeometry();
      countrySummary();
    } else {
      const region = regionById.get(mapState.regionId);
      svg.setAttribute("aria-label", level === "district" ? `${districtConfig.districts[mapState.districtId].displayName} map` : `${region.properties.name} district map`);
      description.textContent = level === "district" ? `District view within ${region.properties.name}.` : `Select a district within ${region.properties.name}.`;
      renderDistrictGeometry();
      if (level === "region" && routeNotice) {
        setSummary("Administrative update", region.properties.name, routeNotice);
      } else if (level === "region") regionSummary(region.id);
      else districtSummary(districtConfig.districts[mapState.districtId]);
    }
    renderHeritageContext();

    if (loadingRegionId) showLoadStatus("Loading district boundaries…");
    else if (loadError) showLoadStatus(loadError, { error: true, retry: mapState.level === "region" });
    else hideLoadStatus();

    root.dataset.mapState = stateSignature;
    if (stateChanged) resetCamera({ animate: animateViewChange });
    if (animateViewChange) {
      root.classList.remove("map-view-entering");
      void root.offsetWidth;
      root.classList.add("map-view-entering");
      window.setTimeout(() => root.classList.remove("map-view-entering"), 520);
    }

    if (focusId) window.requestAnimationFrame(() => document.getElementById(focusId)?.focus({ preventScroll: true }));
  };

  const loadDistrictData = (regionId, { force = false } = {}) => {
    if (window.VIRSAPUR_DISTRICT_GEOMETRY?.[regionId]) {
      districtCollections.set(regionId, window.VIRSAPUR_DISTRICT_GEOMETRY[regionId]);
      return Promise.resolve(districtCollections.get(regionId));
    }
    if (!force && districtLoadPromises.has(regionId)) return districtLoadPromises.get(regionId);
    if (force) districtLoadPromises.delete(regionId);

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(districtConfig.files[regionId], siteBaseUrl).href;
      script.dataset.districtRegion = regionId;
      script.onload = () => {
        const collection = window.VIRSAPUR_DISTRICT_GEOMETRY?.[regionId];
        if (!collection?.features?.length) {
          reject(new Error(`No normalized district features were found for ${regionId}.`));
          return;
        }
        districtCollections.set(regionId, collection);
        resolve(collection);
      };
      script.onerror = () => reject(new Error(`District data failed to load for ${regionId}.`));
      document.head.append(script);
    });
    districtLoadPromises.set(regionId, promise);
    return promise;
  };

  const stateHash = (state) => {
    if (state.level === "country") return "#map";
    if (state.level === "region") return `#map/${state.regionId}`;
    const district = districtConfig.districts[state.districtId];
    return `#map/${state.regionId}/${district.slug}`;
  };

  const writeHistory = (state, mode) => {
    if (mode === "none") return;
    const hash = stateHash(state);
    if (mode === "push" && window.location.hash === hash) {
      lastHistoryHash = hash;
      return;
    }
    const method = mode === "replace" ? "replaceState" : "pushState";
    window.history[method]({ virsapurMap: true, ...state }, "", hash);
    lastHistoryHash = hash;
  };

  const normalizeState = (candidate) => {
    if (!candidate || candidate.level === "country") return { state: { ...countryState }, error: null, notice: null };
    const region = regionById.get(candidate.regionId);
    if (!region) return { state: { ...countryState }, error: "The requested map region could not be found.", notice: null };
    if (candidate.level === "region") {
      return {
        state: { level: "region", regionId: region.id, districtId: null },
        error: null,
        notice: candidate.routeMessage ?? null,
      };
    }
    const district = districtConfig.districts[candidate.districtId];
    if (!district || district.parentRegionId !== region.id) {
      return {
        state: { level: "region", regionId: region.id, districtId: null },
        error: `The requested district could not be found in ${region.properties.name}.`,
        notice: null,
      };
    }
    if (district.publicationStatus === "withheld" || district.publicationStatus === "retired") {
      const legacy = districtConfig.legacyRoutes?.[`${region.id}/${district.slug}`];
      return {
        state: { level: "region", regionId: region.id, districtId: null },
        error: null,
        notice: legacy?.message ?? "This district record is not shown as a polygon until an authoritative boundary is available.",
      };
    }
    return { state: { level: "district", regionId: region.id, districtId: district.id }, error: null, notice: null };
  };

  const sameState = (left, right) =>
    left.level === right.level && left.regionId === right.regionId && left.districtId === right.districtId;

  const transitionFocus = (from, to) => {
    if (from.level === "country" && to.level === "region") return "map-summary-heading";
    if (from.level === "region" && to.level === "district") return `district-${to.districtId}`;
    if (from.level === "district" && to.level === "region") return `district-${from.districtId}`;
    if (to.level === "country" && from.regionId) return `region-${from.regionId}`;
    return "map-summary-heading";
  };

  async function setMapState(candidate, { historyMode = "push", focusId = null, scroll = false, preserveViewport = false } = {}) {
    // Home is a discovery gateway. Keep the full Atlas as the single drill-down experience.
    // Normalization and the shared hash formatter preserve the established geography routes.
    if (root.dataset.mapVariant === "home" && candidate?.level !== "country") {
      const destination = normalizeState(candidate);
      if (!destination.error && destination.state.level !== "country") {
        const url = new URL("heritage-map/index.html", siteBaseUrl);
        url.hash = stateHash(destination.state);
        window.location.assign(url.href);
        return;
      }
    }
    const sequence = ++transitionSequence;
    const previousState = { ...mapState };
    const normalized = normalizeState(candidate);
    const target = normalized.state;
    loadError = normalized.error;
    routeNotice = normalized.notice;
    const resolvedFocusId = focusId ?? transitionFocus(previousState, target);
    const stateIsUnchanged = sameState(previousState, target);
    if (!stateIsUnchanged && root.contains(document.activeElement)) document.activeElement.blur();
    writeHistory(target, normalized.error ? "replace" : stateIsUnchanged ? "none" : historyMode);

    if (target.level === "country") {
      loadingRegionId = null;
      mapState = target;
      renderState({ focusId: resolvedFocusId });
      if (!preserveViewport && (scroll || !stateIsUnchanged)) root.scrollIntoView({ block: "start", behavior: "instant" });
      return;
    }

    if (!districtCollections.has(target.regionId) && !window.VIRSAPUR_DISTRICT_GEOMETRY?.[target.regionId]) {
      mapState = { level: "region", regionId: target.regionId, districtId: null };
      loadingRegionId = target.regionId;
      renderState();
      try {
        await loadDistrictData(target.regionId);
      } catch (error) {
        if (sequence !== transitionSequence) return;
        loadingRegionId = null;
        loadError = "District boundary data is not available for this region yet.";
        mapState = { level: "region", regionId: target.regionId, districtId: null };
        writeHistory(mapState, "replace");
        renderState({ focusId: "map-summary-heading" });
        return;
      }
    }

    if (sequence !== transitionSequence) return;
    loadingRegionId = null;
    mapState = target;
    renderState({ focusId: resolvedFocusId });
    if (!preserveViewport && (scroll || !stateIsUnchanged)) root.scrollIntoView({ block: "start", behavior: "instant" });
  }

  const parseMapHash = () => {
    const value = window.location.hash;
    if (!value.startsWith("#map")) return null;
    const segments = value.slice(1).split("/").map((segment) => decodeURIComponent(segment));
    if (segments.length === 1) return { ...countryState };
    const regionId = segments[1];
    if (segments.length === 2) return { level: "region", regionId, districtId: null };
    const districtId = Object.values(districtConfig.districts).find(
      (district) => district.parentRegionId === regionId && district.slug === segments[2],
    )?.id;
    return { level: "district", regionId, districtId: districtId ?? `${regionId}-${segments[2]}` };
  };

  const moveUp = () => {
    if (mapState.level === "district") {
      const districtId = mapState.districtId;
      setMapState(
        { level: "region", regionId: mapState.regionId, districtId: null },
        { historyMode: "push", focusId: `district-${districtId}` },
      );
    } else if (mapState.level === "region") {
      const regionId = mapState.regionId;
      setMapState(countryState, { historyMode: "push", focusId: `region-${regionId}` });
    }
  };

  for (const feature of adm1.features) {
    const path = makeSvgElement("path", {
      id: `region-${feature.id}`,
      class: `region-path region-${feature.id}`,
      fill: feature.properties.fill,
      role: "button",
      tabindex: "0",
      "aria-label": `Explore ${feature.properties.name}`,
      "aria-pressed": "false",
      "fill-rule": "evenodd",
      "vector-effect": "non-scaling-stroke",
    });
    const label = makeSvgElement("g", {
      class: "map-label",
      "data-region": feature.id,
      "aria-hidden": "true",
    });
    const openRegion = () =>
      setMapState(
        { level: "region", regionId: feature.id, districtId: null },
        { historyMode: "push", focusId: "map-summary-heading" },
      );
    path.addEventListener("click", openRegion);
    path.addEventListener("pointerenter", () => previewRegion(feature));
    path.addEventListener("pointerleave", restoreSummary);
    path.addEventListener("focus", () => previewRegion(feature));
    path.addEventListener("blur", restoreSummary);
    path.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openRegion();
      }
    });
    label.addEventListener("click", openRegion);
    regionPathsLayer.append(path);
    regionLabelsLayer.append(label);
    renderedRegions.set(feature.id, { feature, path, label });
  }

  zoomInButton?.addEventListener("click", () => zoomCamera(1));
  zoomOutButton?.addEventListener("click", () => zoomCamera(-1));
  recenterButtons.forEach((button) => button.addEventListener("click", () => resetCamera()));
  overviewButtons.forEach((button) =>
    button.addEventListener("click", async () => {
      await setMapState(countryState, { historyMode: "push", focusId: "map-summary-heading" });
      resetCamera();
    }),
  );
  panButtons.forEach((button) =>
    button.addEventListener("click", () => panCamera(button.dataset.mapPan)),
  );
  layerInputs.forEach((input) => {
    const updateLayer = () => {
      const enabled = input.checked;
      if (input.dataset.mapLayer === "boundaries") root.classList.toggle("map-boundaries-muted", !enabled);
      if (input.dataset.mapLayer === "labels") root.classList.toggle("map-labels-hidden", !enabled);
    };
    input.addEventListener("change", updateLayer);
    updateLayer();
  });
  drawerToggle?.addEventListener("click", () => {
    if (root.dataset.mapVariant === "home") {
      window.location.href = new URL("heritage-map/index.html", siteBaseUrl).href;
      return;
    }
    setDrawerOpen(drawerToggle.getAttribute("aria-expanded") !== "true");
  });

  if (atlasCanvas) installDiscoveryGestures();
  svg.addEventListener("pointerdown", (event) => {
    if (atlasCanvas) return;
    if (event.button !== 0 || event.target.closest?.(".region-path,.map-district,.map-label,.map-heritage-marker")) return;
    dragState = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX: camera.offsetX,
      offsetY: camera.offsetY,
    };
    svg.setPointerCapture?.(event.pointerId);
    root.classList.add("map-is-panning");
  });
  svg.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const rectangle = svg.getBoundingClientRect();
    const [, , width, height] = cameraViewBox();
    const deltaX = event.clientX - dragState.x;
    const deltaY = event.clientY - dragState.y;
    camera.offsetX = dragState.offsetX - (deltaX / Math.max(rectangle.width, 1)) * width;
    camera.offsetY = dragState.offsetY - (deltaY / Math.max(rectangle.height, 1)) * height;
    applyCamera({ animate: false });
    if (event.pointerType === "mouse" || Math.abs(deltaX) > Math.abs(deltaY)) event.preventDefault();
  });
  const finishDrag = (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    svg.releasePointerCapture?.(event.pointerId);
    dragState = null;
    root.classList.remove("map-is-panning");
  };
  svg.addEventListener("pointerup", finishDrag);
  svg.addEventListener("pointercancel", finishDrag);

  svg.addEventListener("keydown", (event) => {
    const directionByKey = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
    if (directionByKey[event.key]) {
      event.preventDefault();
      panCamera(directionByKey[event.key]);
      return;
    }
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomCamera(1);
      return;
    }
    if (event.key === "-") {
      event.preventDefault();
      zoomCamera(-1);
      return;
    }
    if (event.key === "Home" || event.key === "0") {
      event.preventDefault();
      resetCamera();
    }
  });

  backButton.addEventListener("click", moveUp);
  retryButton.addEventListener("click", async () => {
    if (mapState.level !== "region") return;
    const regionId = mapState.regionId;
    const sequence = ++transitionSequence;
    loadingRegionId = regionId;
    loadError = null;
    renderState();
    try {
      await loadDistrictData(regionId, { force: true });
      if (sequence !== transitionSequence) return;
      loadingRegionId = null;
      renderState({ focusId: "map-summary-heading" });
    } catch (error) {
      if (sequence !== transitionSequence) return;
      loadingRegionId = null;
      loadError = "District boundary data is not available for this region yet.";
      renderState();
    }
  });
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mapState.level !== "country") {
      event.preventDefault();
      moveUp();
    }
  });

  const renderResponsive = () => {
    layoutMode = mobileQuery.matches ? "mobile" : "desktop";
    updateAtlasLayout();
    svg.setAttribute("viewBox", currentLayout.viewBox.join(" "));
    renderWorldContext();
    renderState();
    resetCamera({ animate: false });
  };
  if (typeof mobileQuery.addEventListener === "function") mobileQuery.addEventListener("change", renderResponsive);
  else mobileQuery.addListener(renderResponsive);
  if (atlasCanvas) {
    let lastSize = '';
    let resizeFrame = 0;
    canvasObserver = new ResizeObserver(([entry]) => {
      const size = `${Math.round(entry.contentRect.width)}:${Math.round(entry.contentRect.height)}`;
      if (size === lastSize) return;
      lastSize = size;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        updateAtlasLayout();
        renderWorldContext();
        renderState();
        applyCamera({ animate: false });
      });
    });
    canvasObserver.observe(atlasCanvas);
  }

  const restoreFromHistory = () => {
    if (!window.location.hash.startsWith("#map")) {
      if (mapState.level !== "country") setMapState(countryState, { historyMode: "none" });
      lastHistoryHash = window.location.hash;
      return;
    }
    if (window.location.hash === lastHistoryHash) return;
    lastHistoryHash = window.location.hash;
    const parsed = parseMapHash();
    if (parsed) setMapState(parsed, { historyMode: "none", scroll: true });
  };
  window.addEventListener("popstate", () => {
    lastHistoryHash = "";
    restoreFromHistory();
  });
  window.addEventListener("hashchange", restoreFromHistory);

  svg.setAttribute("viewBox", currentLayout.viewBox.join(" "));
  renderWorldContext();
  renderCountryGeometry();
  const initialState = parseMapHash();
  if (initialState) {
    lastHistoryHash = window.location.hash;
    setMapState(initialState, { historyMode: "replace", scroll: window.location.hash !== "#map" });
  } else {
    mapState = { ...countryState };
    renderState();
  }

  if (reducedMotionQuery.matches) root.classList.add("map-reduced-motion");
})();
