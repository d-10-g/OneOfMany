(function () {
  "use strict";

  const catalog = window.ONE_OF_MANY_CARBON;
  if (!catalog || !Array.isArray(catalog.items)) {
    console.error("ONE_OF_MANY_CARBON catalog not loaded.");
    return;
  }

  const itemsById = new Map();
  const itemsBySlug = new Map();

  catalog.items.forEach((item) => {
    itemsById.set(item.id, item);
    itemsBySlug.set(item.slug, item);
  });

  const VALID_DOC_MODES = new Set(["report", "storyboard", "infographic", "split"]);

  const state = {
    pillarFilter: "all",
    lensFilter: "all", // 'all' | 'new' | 'urgent'
    searchQuery: "",
    activeItemId: null,
    docMode: "report", // 'report' | 'storyboard' | 'infographic' | 'split'
    activeSynergyIdx: 0,
    budgetYear: 2035,
    flippedMyths: new Set([0]), // First myth pre-flipped as an inviting affordance
    sidebarOpen: false, // Default to collapsed on page load across all viewports
  };

  // DOM References
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  const appTopbarEl = document.getElementById("app-topbar");
  const workspaceShellEl = document.getElementById("workspace-shell");
  const themeToggleBtn = document.getElementById("theme-toggle");
  const sidebarToggleBtn = document.getElementById("sidebar-toggle-btn");
  const sidebarCloseBtn = document.getElementById("sidebar-close-btn");
  const sidebarBackdropEl = document.getElementById("sidebar-backdrop");
  const sidebarEl = document.getElementById("sidebar");
  const sidebarNavEl = document.getElementById("sidebar-nav");
  const sideCountAllEl = document.getElementById("side-count-all");
  const mainStageEl = document.getElementById("main-stage");
  const homeViewEl = document.getElementById("home-view");
  const detailViewEl = document.getElementById("detail-view");
  const mainHeadingEl = document.getElementById("main-heading");
  const globalSearchInput = document.getElementById("global-search");
  const searchBannerEl = document.getElementById("search-results-banner");
  const searchCountEl = document.getElementById("search-results-count");
  const searchQueryLabelEl = document.getElementById("search-query-label");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  const catalogSectionsEl = document.getElementById("catalog-sections");

  // Interactive Home Containers
  const mythGridEl = document.getElementById("mythbuster-grid");
  const flipAllMythsBtn = document.getElementById("flip-all-myths-btn");
  const synergyRecipesEl = document.getElementById("synergy-recipes-list");
  const synergyStageEl = document.getElementById("synergy-stage-card");
  const yearSliderEl = document.getElementById("year-slider");
  const selectedYearBadgeEl = document.getElementById("selected-year-badge");
  const budgetSummaryStripEl = document.getElementById("budget-summary-strip");
  const budgetBarsGridEl = document.getElementById("budget-bars-grid");
  const voicesQuotesPanelEl = document.getElementById("voices-quotes-panel");
  const voicesStoriesPanelEl = document.getElementById("voices-stories-panel");
  const globalProofGridEl = document.getElementById("global-proof-grid");

  // Detail View Elements
  const backToAtlasBtn = document.getElementById("back-to-atlas");
  const detailPillarBadgeEl = document.getElementById("detail-pillar-badge");
  const detailNewBadgeEl = document.getElementById("detail-new-badge");
  const detailFolderPathEl = document.getElementById("detail-folder-path");
  const detailReadMetaEl = document.getElementById("detail-read-meta");
  const detailHeadingEl = document.getElementById("detail-heading");
  const detailTaglineEl = document.getElementById("detail-tagline");
  const detailHeadlineStatEl = document.getElementById("detail-headline-stat");
  const detailDossierMountEl = document.getElementById("detail-dossier-mount");
  const mobileTocDetailsEl = document.getElementById("mobile-toc-details");
  const mobileTocListEl = document.getElementById("mobile-toc-list");
  const readerLayoutEl = document.getElementById("reader-layout");
  const primaryPaneLabelEl = document.getElementById("primary-pane-label");
  const secondaryPaneEl = document.getElementById("secondary-pane");
  const secondaryPaneLabelEl = document.getElementById("secondary-pane-label");
  const markdownOutputEl = document.getElementById("markdown-output");
  const secondaryMarkdownOutputEl = document.getElementById("secondary-markdown-output");
  const tocListEl = document.getElementById("toc-list");
  const prevNextBoxEl = document.getElementById("prev-next-box");
  const backToTopBtn = document.getElementById("back-to-top-btn");

  // Dialog Elements
  const hopeDialogEl = document.getElementById("hope-modal");
  const hopeModalTitleEl = document.getElementById("hope-modal-title");
  const hopeModalBodyEl = document.getElementById("hope-modal-body");
  const hopeShuffleBtn = document.getElementById("hope-shuffle-btn");
  const hopeOpenBtn = document.getElementById("hope-open-btn");
  const surpriseHopeBtn = document.getElementById("surprise-hope-btn");
  const ctaExploreBtn = document.getElementById("cta-explore-atlas");
  const ctaRandomBtn = document.getElementById("cta-random-pathway");

  const inlineCountAllEl = document.getElementById("inline-count-all");
  if (sideCountAllEl) {
    sideCountAllEl.textContent = String(catalog.items.length);
  }
  if (inlineCountAllEl) {
    inlineCountAllEl.textContent = String(catalog.items.length);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ==================== 1. COLLAPSIBLE SIDEBAR & INERT FOCUS BOUNDARY ====================
  const mobileMediaQuery = window.matchMedia("(max-width: 960px)");

  function setSidebarOpen(isOpen) {
    state.sidebarOpen = Boolean(isOpen);
    const isMobile = mobileMediaQuery.matches;

    if (sidebarEl) {
      sidebarEl.hidden = !state.sidebarOpen;
      sidebarEl.inert = !state.sidebarOpen;
      sidebarEl.classList.toggle("open", state.sidebarOpen);
    }
    if (workspaceShellEl) {
      workspaceShellEl.classList.toggle("sidebar-open", state.sidebarOpen && !isMobile);
    }
    document.body.classList.toggle("drawer-open", state.sidebarOpen && isMobile);

    if (sidebarBackdropEl) {
      sidebarBackdropEl.hidden = !(state.sidebarOpen && isMobile);
    }
    if (sidebarToggleBtn) {
      sidebarToggleBtn.setAttribute("aria-expanded", String(state.sidebarOpen));
    }
    if (mainStageEl) {
      mainStageEl.inert = Boolean(state.sidebarOpen && isMobile);
    }
    if (appTopbarEl) {
      appTopbarEl.inert = Boolean(state.sidebarOpen && isMobile);
    }
  }

  mobileMediaQuery.addEventListener?.("change", () => {
    setSidebarOpen(state.sidebarOpen);
  });

  // ==================== 2. DARK MODE & MOTION CONTROLS ====================
  function getSystemScheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function getRenderedScheme() {
    const content = metaColorScheme?.content;
    if (content === "dark" || content === "light") return content;
    return getSystemScheme();
  }

  themeToggleBtn?.addEventListener("click", () => {
    const currentRendered = getRenderedScheme();
    const target = currentRendered === "dark" ? "light" : "dark";
    const systemPref = getSystemScheme();

    if (target !== systemPref) {
      try {
        localStorage.setItem("color-scheme", target);
      } catch (_) {}
      if (metaColorScheme) metaColorScheme.content = target;
    } else {
      try {
        localStorage.removeItem("color-scheme");
      } catch (_) {}
      if (metaColorScheme) metaColorScheme.content = "light dark";
    }
    initMermaidTheme();
    if (state.activeItemId) renderDetailContent();
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "color-scheme" && metaColorScheme) {
      metaColorScheme.content = e.newValue ?? "light dark";
      initMermaidTheme();
    }
  });

  // ==================== 3. SCROLL-DRIVEN FALLBACK (IntersectionObserver) ====================
  if (
    !CSS.supports("(animation-timeline: view()) and (animation-range: entry)") &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("io-visible");
            entry.target.classList.remove("io-hidden");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".scroll-reveal").forEach((el) => {
      el.classList.add("io-hidden");
      io.observe(el);
    });
  }

  // ==================== 4. LIGHT-DISMISS DIALOG + SAFARI FALLBACK ====================
  if (hopeDialogEl && !("closedBy" in HTMLDialogElement.prototype)) {
    hopeDialogEl.addEventListener("click", (event) => {
      if (event.target !== hopeDialogEl) return;
      const rect = hopeDialogEl.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isDialogContent) {
        hopeDialogEl.close();
      }
    });
  }

  function renderCompanyLinkPills(item, limit) {
    const list = Array.isArray(item.companyLinks)
      ? item.companyLinks
      : (item.companiesAndLabs || []).map((name) => ({
          name,
          url: "https://github.com/d-10-g/OneOfMany",
        }));
    const sliced = typeof limit === "number" ? list.slice(0, limit) : list;
    return sliced
      .map(
        (c) =>
          `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer" class="org-pill">🏢 ${escapeHtml(c.name)} ↗</a>`
      )
      .join("");
  }

  function renderPrecedentLinkPills(item) {
    const list = Array.isArray(item.precedentLinks)
      ? item.precedentLinks
      : (item.globalPrecedents || []).map((name) => ({
          name,
          url: "https://github.com/d-10-g/OneOfMany",
        }));
    return list
      .map(
        (g) =>
          `<a href="${escapeHtml(g.url)}" target="_blank" rel="noopener noreferrer" class="org-pill">🌍 ${escapeHtml(g.name)} ↗</a>`
      )
      .join("");
  }

  function renderQuoteAuthorLink(quote) {
    if (quote && quote.url) {
      return `<a href="${escapeHtml(quote.url)}" target="_blank" rel="noopener noreferrer" class="quote-author quote-author-link">${escapeHtml(quote.author)} ↗</a>`;
    }
    return `<span class="quote-author">${escapeHtml(quote?.author)}</span>`;
  }

  const HOPE_DECK_STORAGE_KEY = "oom_carbon_hope_deck_v1";

  const hopeDeck = (function loadHopeDeck() {
    try {
      const raw = sessionStorage.getItem(HOPE_DECK_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const seenInQueue = new Set();
        const validQueue = Array.isArray(parsed?.queue)
          ? parsed.queue.filter((id) => {
              if (!itemsById.has(id) || seenInQueue.has(id)) return false;
              seenInQueue.add(id);
              return true;
            })
          : [];
        const validLastId =
          typeof parsed?.lastId === "string" && itemsById.has(parsed.lastId)
            ? parsed.lastId
            : null;
        return { queue: validQueue, lastId: validLastId };
      }
    } catch (_) {}
    return { queue: [], lastId: null };
  })();

  function saveHopeDeck() {
    try {
      sessionStorage.setItem(HOPE_DECK_STORAGE_KEY, JSON.stringify(hopeDeck));
    } catch (_) {}
  }

  function drawNextBreakthroughItem() {
    if (catalog.items.length === 0) return null;

    if (hopeDeck.queue.length === 0) {
      const shuffledIds = catalog.items.map((item) => item.id);
      for (let i = shuffledIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
      }
      // Prevent back-to-back repeat right across the reshuffle boundary
      if (shuffledIds.length > 1 && shuffledIds[0] === hopeDeck.lastId) {
        const swapIdx = 1 + Math.floor(Math.random() * (shuffledIds.length - 1));
        [shuffledIds[0], shuffledIds[swapIdx]] = [shuffledIds[swapIdx], shuffledIds[0]];
      }
      hopeDeck.queue = shuffledIds;
    }

    const nextId = hopeDeck.queue.shift();
    hopeDeck.lastId = nextId;
    saveHopeDeck();
    return itemsById.get(nextId) ?? catalog.items[0];
  }

  function populateHopeModal() {
    const randomItem = drawNextBreakthroughItem();
    if (!randomItem || !hopeDialogEl) return;
    hopeModalTitleEl.textContent = `${randomItem.pillarEmoji} ${randomItem.title}`;
    const citeAttr = randomItem.quote?.url ? ` cite="${escapeHtml(randomItem.quote.url)}"` : "";
    hopeModalBodyEl.innerHTML = `
      <div class="dossier-box cynic-box" style="margin-bottom:0.85rem;">
        <span class="dossier-label">😒 The Cynic's Old Belief</span>
        <p style="margin:0;font-size:0.9rem;">“${escapeHtml(randomItem.cynicBelief)}”</p>
      </div>
      <div class="dossier-box reality-box" style="margin-bottom:0.85rem;">
        <span class="dossier-label">🌱 What Actually Broke Through</span>
        <p style="margin:0;font-size:0.9rem;">${escapeHtml(randomItem.breakthroughCounter)}</p>
      </div>
      <figure class="quote-card" style="padding:1rem;margin-bottom:0.8rem;">
        <blockquote${citeAttr} style="font-size:0.92rem;margin-bottom:0.65rem;">“${escapeHtml(randomItem.quote.text)}”</blockquote>
        <figcaption>
          <div>
            ${renderQuoteAuthorLink(randomItem.quote)}
            <span class="quote-role">${escapeHtml(randomItem.quote.role)}</span>
          </div>
          <span class="metric-chip">${escapeHtml(randomItem.infographic.headlineMetric)}</span>
        </figcaption>
      </figure>
      <div class="card-OrgsRow" style="margin-bottom:0;">
        ${renderCompanyLinkPills(randomItem, 3)}
      </div>
    `;
    hopeOpenBtn.href = `#${randomItem.id}?mode=report`;
    hopeDialogEl.scrollTop = 0;
  }

  function openHopeModal() {
    if (!hopeDialogEl) return;
    populateHopeModal();
    if (!hopeDialogEl.open) {
      try {
        hopeDialogEl.showModal();
      } catch (_) {}
    }
  }

  surpriseHopeBtn?.addEventListener("click", openHopeModal);
  ctaRandomBtn?.addEventListener("click", openHopeModal);

  hopeShuffleBtn?.addEventListener("click", populateHopeModal);
  hopeOpenBtn?.addEventListener("click", () => {
    hopeDialogEl?.close();
  });

  ctaExploreBtn?.addEventListener("click", () => {
    document.getElementById("atlas-directory")?.scrollIntoView({ behavior: "smooth" });
  });

  // ==================== 5. INTERACTIVE MODULE DATA & RENDERERS ====================
  const MYTH_CARDS = [
    {
      myth: "“Commercial fusion is 30 years away—and always will be.”",
      reality:
        "20-compact high-field REBCO superconducting tape boosted magnetic fusion power density 16×–39× (P ∝ B⁴), shrinking cores 40×. By late 2026, CFS raised ~$4B with SPARC >85% built, Helion hit 150M °C and received the world's first commercial fusion plant license in Washington State, and NRC Part 30 regulates fusion like hospital accelerators—not fission domes.",
      proofLinks: [
        { label: "Helion Orion License", url: "https://www.helionenergy.com/" },
        { label: "CFS SPARC (Q>1)", url: "https://cfs.energy/" },
        { label: "NRC Part 30 Rule", url: "https://www.nrc.gov/materials/fusion-energy-systems.html" },
      ],
      slug: "fusion-power",
    },
    {
      myth: "“Housing will always cost $700,000+ because of NIMBYs and construction bloat.”",
      reality:
        "Three real places already disproved housing fatalism: Vienna houses 60% of residents in gorgeous social/co-op flats (~€650/mo), Singapore delivers 80% homeownership via HDB, and Tokyo's by-right national zoning keeps rents flat while building more homes than California. Pair those rules with robotic Cross-Laminated Timber factories and sunlit net-zero homes cost $135,000 in 30 days.",
      proofLinks: [
        { label: "Vienna Wiener Wohnen", url: "https://www.wienerwohnen.at/" },
        { label: "Singapore HDB (80%)", url: "https://www.hdb.gov.sg/" },
        { label: "Tokyo By-Right Zoning", url: "https://en.wikipedia.org/wiki/Urban_planning" },
      ],
      slug: "abundant-beautiful-housing",
    },
    {
      myth: "“AI and robots will enrich five trillionaires while ordinary families go broke.”",
      reality:
        "Shared capital ownership isn't utopian theory—Norway's $1.8T Sovereign Wealth Fund (~$320k/citizen), Alaska's Permanent Fund Dividend (passed by conservative voters in 1982), and Connecticut's Baby Bonds already pay citizen equity dividends. Meanwhile, clean energy + robotics slashes household living costs 70%.",
      proofLinks: [
        { label: "Norway $1.8T Fund", url: "https://www.nbim.no/" },
        { label: "Alaska Permanent Fund", url: "https://apfc.org/" },
        { label: "Denmark 90% Flexicurity", url: "https://denmark.dk/society-and-business/the-danish-labour-market" },
      ],
      slug: "universal-capital-dividends",
    },
    {
      myth: "“Street homelessness and fentanyl addiction are permanent urban tragedies.”",
      reality:
        "Finland cut chronic street homelessness >80% via unconditional Housing First, Houston cut unsheltered homelessness 63% with one unified command dashboard, and Austin's Community First! Village achieves 86% retention in $18k micro-homes—now reinforced by GLP-1 & focused-ultrasound brain-craving resets.",
      proofLinks: [
        { label: "Finland Housing First", url: "https://ysaatio.fi/en/housing-first/" },
        { label: "Austin Community First!", url: "https://mlf.org/community-first/" },
      ],
      slug: "ending-homelessness-villages",
    },
    {
      myth: "“Feeding 10 billion people and fighting climate change requires miserable austerity.”",
      reality:
        "Solar photovoltaics fell 99.8% in cost, LONGi certified 35.5% perovskite-silicon tandems in 2026, Fervo brought commercial enhanced geothermal online in Utah, and precision microbial fermentation (Solar Foods Solein) grows protein at 20× soybean efficiency—letting humanity return 1 billion hectares of farmland back to wild forests.",
      proofLinks: [
        { label: "LONGi 35.5% Tandem", url: "https://www.longi.com/en/" },
        { label: "Fervo Cape Station EGS", url: "https://fervoenergy.com/" },
        { label: "Solar Foods Solein", url: "https://solarfoods.com/" },
      ],
      slug: "precision-fermentation-rewilding",
    },
    {
      myth: "“Algorithms and social media inevitably polarize democracies into tribal rage.”",
      reality:
        "Polarization was a design bug of outrage-maximizing reply feeds, not human nature. Taiwan's vTaiwan and open-source Polis platform replaced dunking replies with bridging-consensus clustering—resolving 26+ fierce national battles (Uber, AI, tech law) with >80% cross-party citizen consensus.",
      proofLinks: [
        { label: "Taiwan vTaiwan (>80%)", url: "https://info.vtaiwan.tw/" },
        { label: "Polis Open Source", url: "https://compdemocracy.org/" },
        { label: "Estonia X-Road (99%)", url: "https://e-estonia.com/solutions/interoperability-services/x-road/" },
      ],
      slug: "bridging-consensus-trust",
    },
    {
      myth: "“Terrestrial AI data centers inevitably drain local rivers and jack up residential electric bills.”",
      reality:
        "Closed-loop liquid-cooled AI racks output 55–80 °C water ideal for municipal 4th-Generation District Heating: Microsoft & Fortum's Espoo/Kirkkonummi campuses warm 40% of regional Finnish homes (250,000 residents), Meta Odense heats 11,000+ Danish homes, and legally binding Community Benefit Agreements pair zero-evaporation cooling with residential ratepayer shields.",
      proofLinks: [
        { label: "Fortum-Microsoft Heat", url: "https://www.fortum.com/" },
        { label: "Meta Odense District Heat", url: "https://sustainability.atmeta.com/" },
        { label: "Extropic Z1 1000× Efficiency", url: "https://www.extropic.ai/" },
      ],
      slug: "symbiotic-civic-data-centers",
    },
    {
      myth: "“Frontier discovery now belongs exclusively to billion-dollar labs—independent citizens can't find anything new.”",
      reality:
        "Public petabyte archives + agentic AI sparked a citizen-science renaissance: Pietro Miotti's 48-agent AI swarm scanned 1,200 km² of NASA LiDAR in <72 hours to spot an unregistered Maya pyramid complex, Vesuvius Challenge competitors unwrapped 2,000-year-old Herculaneum scrolls (PHerc. 1667), and Zooniverse volunteers co-discover asteroids on Vera C. Rubin sky patrols.",
      proofLinks: [
        { label: "Miotti Maya LiDAR Swarm", url: "https://pietromiotti.com/latest/maya-site/" },
        { label: "Vesuvius Challenge", url: "https://scrollprize.org/" },
        { label: "Rubin Sky Patrol", url: "https://rubinobservatory.org/" },
      ],
      slug: "lidar-agent-citizen-archaeology",
    },
  ];

  function renderMythBusters() {
    if (!mythGridEl) return;
    mythGridEl.innerHTML = MYTH_CARDS.map((card, idx) => {
      const flipped = state.flippedMyths.has(idx);
      const targetItem = itemsBySlug.get(card.slug);
      const linkHref = targetItem ? `#${targetItem.id}?mode=report` : "#atlas-directory";
      const proofsHtml = card.proofLinks
        .map(
          (p) =>
            `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer" class="myth-proof-pill">${escapeHtml(p.label)} ↗</a>`
        )
        .join("");

      return `
        <article class="myth-card ${flipped ? "flipped" : ""}" data-myth-idx="${idx}">
          <div>
            <span class="myth-top-tag">
              ${flipped ? "🌱 2026 BREAKTHROUGH REALITY" : "😒 CYNICAL CONVENTIONAL BELIEF"}
            </span>
            <h3 class="myth-quote">${escapeHtml(flipped ? "Here Is What Actually Happened:" : card.myth)}</h3>
            <div class="myth-reality-box">
              ${
                flipped
                  ? `<p style="margin:0;">${escapeHtml(card.reality)}</p>
                     <div class="myth-proof-row">${proofsHtml}</div>`
                  : `<p style="margin:0;">This talking point sounds sophisticated at dinner parties—yet real engineering and real countries already proved it wrong. Tap below to inspect the receipts.</p>`
              }
            </div>
          </div>
          <div class="myth-actions">
            <button class="myth-flip-btn" type="button" data-flip-idx="${idx}">
              ${flipped ? "← Show Old Myth" : "Reveal 2026 Proof ↻"}
            </button>
            <a href="${linkHref}" class="myth-deep-link">Read Pathway →</a>
          </div>
        </article>
      `;
    }).join("");
  }

  mythGridEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-flip-idx]");
    if (!btn) return;
    const idx = Number(btn.dataset.flipIdx);
    if (state.flippedMyths.has(idx)) {
      state.flippedMyths.delete(idx);
    } else {
      state.flippedMyths.add(idx);
    }
    renderMythBusters();
  });

  flipAllMythsBtn?.addEventListener("click", () => {
    if (state.flippedMyths.size === MYTH_CARDS.length) {
      state.flippedMyths.clear();
    } else {
      MYTH_CARDS.forEach((_, i) => state.flippedMyths.add(i));
    }
    renderMythBusters();
  });

  // Synergy Reactor Data
  const SYNERGY_RECIPES = [
    {
      kicker: "SYNERGY 01 // DESERT TO GARDEN",
      name: "Continental Freshwater Rivers & Billion-Hectare Rewilding",
      inputs: [
        { label: "⚡ $0.003/kWh Fusion & 35.5% Solar", slug: "fusion-power" },
        { label: "💧 Zwitterionic RO Desalination", slug: "aquifer-rivers-desalination" },
        { label: "🧬 Solar Microbial Fermentation", slug: "precision-fermentation-rewilding" },
      ],
      resultTitle: "Drought Ends Forever & Half of Farmland Returns to Wild Forest",
      resultDesc:
        "When off-peak clean electricity drops below half a cent, desalinating 1,000 liters of ocean water costs under one penny—while air-and-electricity microbial proteins and sunlit vertical orchards free 1+ billion hectares of pasture back into carbon-soaking wild forests.",
      slugs: ["fusion-power", "aquifer-rivers-desalination", "precision-fermentation-rewilding"],
    },
    {
      kicker: "SYNERGY 02 // THE $135,000 SUNLIT NEIGHBORHOOD",
      name: "Ending the Housing Crisis Without Concrete Urban Sprawl",
      inputs: [
        { label: "🤖 Robotic Mass-Timber Factories", slug: "abundant-beautiful-housing" },
        { label: "🚗 Autonomous Car-Light Boulevards", slug: "autonomous-ground-mobility" },
        { label: "🇦🇹 Vienna / Tokyo By-Right Norms", slug: "forty-eight-hour-governance" },
      ],
      resultTitle: "Warm, Architecturally Gorgeous Homes at 1/5th Today's Cost",
      resultDesc:
        "Autonomous shared pods reclaim 30% of asphalt parking lots for shaded courtyard housing; Estonia-style 48-hour physics digital-twin permits replace 5-year zoning wars; and robotic Cross-Laminated Timber lines stamp out net-zero apartments in 30 days.",
      slugs: [
        "abundant-beautiful-housing",
        "autonomous-ground-mobility",
        "forty-eight-hour-governance",
        "intergenerational-villages",
      ],
    },
    {
      kicker: "SYNERGY 03 // 100 HEALTHY YEARS FOR EVERYONE",
      name: "One-Dose Genetic Prevention & Billing-Free Medicine",
      inputs: [
        { label: "🤖 Self-Driving Wet Labs & AlphaProteo", slug: "self-driving-labs" },
        { label: "🧬 In Vivo LNP CRISPR Editors", slug: "invivo-crispr-cures" },
        { label: "🇸🇬 Direct Care Without Billing", slug: "healthcare-without-billing" },
      ],
      resultTitle: "Heart Attacks, Genetic Disease & Medical Bankruptcy Collapse Together",
      resultDesc:
        "AI protein design + 24/7 robotic wet labs compress drug discovery from 10 years to months; single-infusion in vivo CRISPR permanently silences lethal cardiovascular genes; and stripping out the $1.2T billing maze delivers universal preventative longevity.",
      slugs: ["invivo-crispr-cures", "self-driving-labs", "epigenetic-healthspan", "healthcare-without-billing"],
    },
    {
      kicker: "SYNERGY 04 // EARTH AS A LIVING SANCTUARY",
      name: "Zero-Water AI Compute & Pollution-Free Materials",
      inputs: [
        { label: "🚀 Starship Reusable Heavy Lift", slug: "reusable-starship-heavy-lift" },
        { label: "🛰️ 3-Kelvin Orbital Radiative Compute", slug: "orbital-radiative-compute" },
        { label: "🪨 Inverse Iron-Nitride & Asteroid Metals", slug: "inverse-materials-design" },
      ],
      resultTitle: "Unlimited Intelligence & Industry Without Scarring a Single Watershed",
      resultDesc:
        "Sun-synchronous orbital data centers cool AI racks into the 3 K vacuum of space using zero terrestrial river water, while AI-designed rare-earth-free magnets and deep-space metallic refining end toxic open-pit rainforest mining.",
      slugs: [
        "reusable-starship-heavy-lift",
        "orbital-radiative-compute",
        "inverse-materials-design",
        "asteroid-cislunar-resources",
        "earth-digital-twin-canopy",
      ],
    },
    {
      kicker: "SYNERGY 05 // HIGH-TRUST CIVIC RENAISSANCE",
      name: "24-Hour Workweeks, Citizen Equity & Non-Polarized Democracy",
      inputs: [
        { label: "🤝 Sovereign Compute & Baby Bonds", slug: "universal-capital-dividends" },
        { label: "🇹🇼 Polis Bridging Consensus", slug: "bridging-consensus-trust" },
        { label: "🛠️ Civic Builder Guilds & 2-Sigma Schools", slug: "two-sigma-guild-education" },
      ],
      resultTitle: "Technology Liberates Human Time Instead of Atomizing Communities",
      resultDesc:
        "Universal capital dividends ensure every family owns shares in automation; 2-hour AI morning mastery frees school afternoons for outdoor guilds and art; and bridging algorithms reward 80% common ground instead of rage-bait.",
      slugs: [
        "universal-capital-dividends",
        "bridging-consensus-trust",
        "two-sigma-guild-education",
        "purpose-craft-guilds",
      ],
    },
    {
      kicker: "SYNERGY 06 // SYMBIOTIC INFRASTRUCTURE & OPEN DISCOVERY",
      name: "District-Heating Data Centers, Thermodynamic Chips & Citizen Science",
      inputs: [
        { label: "⚡ District-Heating Civic Data Centers", slug: "symbiotic-civic-data-centers" },
        { label: "🤖 Extropic Z1 Thermodynamic Silicon", slug: "thermodynamic-computing-tsus" },
        { label: "🤝 Open AI Macro Telemetry & Citizen Swarms", slug: "empirical-ai-economics-telemetry" },
      ],
      resultTitle: "Compute Warms Whole Cities, Slashes Energy 1,000× & Democratizes Science",
      resultDesc:
        "Liquid-cooled AI campuses pipe 65 °C heat directly into municipal home radiators under ratepayer-shielded civic pacts, room-temperature thermodynamic chips turn thermal noise into 1,000× leaner sampling, and open telemetry + public LiDAR/telescope archives empower independent citizens and economists worldwide.",
      slugs: [
        "symbiotic-civic-data-centers",
        "thermodynamic-computing-tsus",
        "lidar-agent-citizen-archaeology",
        "empirical-ai-economics-telemetry",
      ],
    },
  ];

  function renderSynergyReactor() {
    if (!synergyRecipesEl || !synergyStageEl) return;
    synergyRecipesEl.innerHTML = SYNERGY_RECIPES.map((r, i) => {
      const active = i === state.activeSynergyIdx;
      return `
        <button class="synergy-recipe-btn ${active ? "active" : ""}" type="button" role="tab" aria-selected="${active}" data-syn-idx="${i}">
          <span class="recipe-kicker">${escapeHtml(r.kicker)}</span>
          <span class="recipe-name">${escapeHtml(r.name)}</span>
        </button>
      `;
    }).join("");

    const cur = SYNERGY_RECIPES[state.activeSynergyIdx];
    const eqHtml = cur.inputs
      .map((inp, idx) => {
        const target = itemsBySlug.get(inp.slug);
        const href = target ? `#${target.id}?mode=report` : "#atlas-directory";
        return `<a href="${href}" class="syn-node syn-node-link">${escapeHtml(inp.label)}</a>${
          idx < cur.inputs.length - 1 ? `<span class="syn-op" aria-hidden="true">×</span>` : ""
        }`;
      })
      .join("");

    const linksHtml = cur.slugs
      .map((slug) => {
        const item = itemsBySlug.get(slug);
        if (!item) return "";
        return `<a href="#${item.id}?mode=report" class="card-btn primary">${item.pillarEmoji} ${escapeHtml(item.title)} →</a>`;
      })
      .join("");

    synergyStageEl.innerHTML = `
      <div>
        <span class="section-kicker">${escapeHtml(cur.kicker)}</span>
        <div class="synergy-equation-row">${eqHtml}</div>
        <div class="syn-result-banner">
          <h3 class="syn-result-title">✨ Emergent Outcome: ${escapeHtml(cur.resultTitle)}</h3>
          <p class="syn-result-desc">${escapeHtml(cur.resultDesc)}</p>
        </div>
      </div>
      <div>
        <div style="font-family:var(--font-mono);font-size:0.71rem;font-weight:700;color:var(--text-muted);margin-bottom:0.5rem;">
          EXPLORE THE CONSTITUENT CARBON PATHWAYS:
        </div>
        <div class="syn-links-row">${linksHtml}</div>
      </div>
    `;
  }

  synergyRecipesEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-syn-idx]");
    if (!btn) return;
    state.activeSynergyIdx = Number(btn.dataset.synIdx);
    renderSynergyReactor();
  });

  // 2026 -> 2036 Household Budget Simulator
  const BUDGET_LINES = [
    {
      name: "🏡 Housing & Homestead",
      slug: "abundant-beautiful-housing",
      cost2026: 2550,
      cost2036: 640,
      why: "Robotic mass-timber modular homes ($135k) + Vienna/Tokyo by-right zoning + 1.5% Sovereign Homestead bonds.",
    },
    {
      name: "⚡ Home Power, HVAC & Unlimited Water",
      slug: "perovskite-tandem-solar",
      cost2026: 340,
      cost2036: 18,
      why: "35.5% rooftop solar skins + LFP/sodium storage + $0.004/kWh municipal fusion/geothermal & sub-penny desalination.",
    },
    {
      name: "🍓 Fresh Organic Groceries",
      slug: "precision-fermentation-rewilding",
      cost2026: 960,
      cost2036: 390,
      why: "365-day town vertical berry/produce farms (zero diesel trucking) + precision solar fermentation proteins.",
    },
    {
      name: "🧬 Healthcare, Diagnostics & Longevity",
      slug: "healthcare-without-billing",
      cost2026: 1120,
      cost2036: 75,
      why: "Skipping the $1.2T billing bureaucracy via Singapore-style direct care, $50 liquid biopsies & 1-dose CRISPR prevention.",
    },
    {
      name: "🚗 Clean Door-to-Door Mobility",
      slug: "autonomous-ground-mobility",
      cost2026: 890,
      cost2036: 195,
      why: "On-demand $0.22/mi autonomous electric pods + whisper drone delivery replacing two-car debt, gas & insurance.",
    },
    {
      name: "🎓 Education, Childcare & Mastery Guilds",
      slug: "two-sigma-guild-education",
      cost2026: 960,
      cost2036: 140,
      why: "Universal 2-Sigma AI morning mastery + neighborhood intergenerational village nurseries & afternoon craft studios.",
    },
  ];

  function renderBudgetSimulator() {
    if (!budgetSummaryStripEl || !budgetBarsGridEl) return;
    const t = Math.max(0, Math.min(1, (state.budgetYear - 2026) / 10));
    // Smooth S-curve adoption factor
    const ease = t * t * (3 - 2 * t);

    let totalCost = 0;
    const baseTotal = BUDGET_LINES.reduce((acc, b) => acc + b.cost2026, 0);

    const rowsHtml = BUDGET_LINES.map((b) => {
      const val = Math.round(b.cost2026 + (b.cost2036 - b.cost2026) * ease);
      totalCost += val;
      const pct = Math.max(4, Math.round((val / b.cost2026) * 100));
      const target = itemsBySlug.get(b.slug);
      const href = target ? `#${target.id}?mode=report` : "#atlas-directory";
      return `
        <div class="budget-item-row">
          <div class="budget-item-top">
            <a href="${href}" class="budget-item-name budget-item-link">${escapeHtml(b.name)} →</a>
            <span class="budget-item-cost">$${val.toLocaleString()}/mo <span style="color:var(--text-muted);font-weight:400;font-size:0.74rem;">(was $${b.cost2026.toLocaleString()})</span></span>
          </div>
          <div class="budget-bar-track" aria-hidden="true">
            <div class="budget-bar-fill" style="width:${pct}%"></div>
          </div>
          <div class="budget-item-why">${escapeHtml(b.why)}</div>
        </div>
      `;
    }).join("");

    const monthlySaved = baseTotal - totalCost;
    const citizenDividend = Math.round(450 * ease);
    const freeHours = Math.round(14 + 18 * ease);

    if (selectedYearBadgeEl) selectedYearBadgeEl.textContent = String(state.budgetYear);

    budgetSummaryStripEl.innerHTML = `
      <div class="budget-stat-box">
        <div class="budget-stat-val">$${totalCost.toLocaleString()}/mo</div>
        <div class="budget-stat-lbl">Core Household Essentials (${state.budgetYear})</div>
      </div>
      <div class="budget-stat-box">
        <div class="budget-stat-val">+$${(monthlySaved * 12).toLocaleString()}/yr</div>
        <div class="budget-stat-lbl">Annual Pocketbook Relief vs. 2026</div>
      </div>
      <div class="budget-stat-box">
        <div class="budget-stat-val">+$${citizenDividend}/mo</div>
        <div class="budget-stat-lbl">Sovereign Compute &amp; Commons Dividend</div>
      </div>
      <div class="budget-stat-box">
        <div class="budget-stat-val">${freeHours} hrs/wk</div>
        <div class="budget-stat-lbl">Unhurried Family, Craft &amp; Nature Time</div>
      </div>
    `;

    budgetBarsGridEl.innerHTML = rowsHtml;

    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.year) === state.budgetYear);
    });
  }

  yearSliderEl?.addEventListener("input", (e) => {
    state.budgetYear = Number(e.target.value);
    renderBudgetSimulator();
  });

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.budgetYear = Number(btn.dataset.year);
      if (yearSliderEl) yearSliderEl.value = String(state.budgetYear);
      renderBudgetSimulator();
    });
  });

  // Voices & Human Stories
  function renderVoicesAndStories() {
    if (!voicesQuotesPanelEl || !voicesStoriesPanelEl) return;
    // Curate 12 standout quotes across all 6 pillars (including Nov 2026 breakthroughs)
    const featuredSlugs = [
      "fusion-power",
      "symbiotic-civic-data-centers",
      "thermodynamic-computing-tsus",
      "lidar-agent-citizen-archaeology",
      "alphagenome2-cellstate-genomics",
      "invivo-crispr-cures",
      "empirical-ai-economics-telemetry",
      "ending-homelessness-villages",
      "bridging-consensus-trust",
      "rubin-citizen-sky-patrol",
      "vesuvius-scroll-ai-papyrology",
      "cynicism-to-agency",
    ];
    const quoteItems = featuredSlugs.map((s) => itemsBySlug.get(s)).filter(Boolean);

    voicesQuotesPanelEl.innerHTML = quoteItems
      .map((item) => {
        const citeAttr = item.quote?.url ? ` cite="${escapeHtml(item.quote.url)}"` : "";
        return `
          <figure class="quote-card">
            <blockquote${citeAttr}>“${escapeHtml(item.quote.text)}”</blockquote>
            <figcaption>
              <div>
                ${renderQuoteAuthorLink(item.quote)}
                <span class="quote-role">${escapeHtml(item.quote.role)}</span>
              </div>
              <a href="#${item.id}?mode=report" class="card-btn primary">${item.pillarEmoji} Pathway →</a>
            </figcaption>
          </figure>
        `;
      })
      .join("");

    const storySlugs = [
      "fusion-power",
      "symbiotic-civic-data-centers",
      "lidar-agent-citizen-archaeology",
      "vesuvius-scroll-ai-papyrology",
      "alphagenome2-cellstate-genomics",
      "organ-bioprinting-bionics",
      "abundant-beautiful-housing",
      "empirical-ai-economics-telemetry",
      "two-sigma-guild-education",
      "earth-digital-twin-canopy",
      "rubin-citizen-sky-patrol",
      "cost-of-living-collapse",
    ];
    const storyItems = storySlugs.map((s) => itemsBySlug.get(s)).filter(Boolean);

    voicesStoriesPanelEl.innerHTML = storyItems
      .map(
        (item) => `
        <article class="story-card">
          <div>
            <div class="story-loc">📍 ${escapeHtml(item.humanStory.location)}</div>
            <h3 class="story-person">${escapeHtml(item.humanStory.protagonist)}</h3>
            <p class="story-snippet">${escapeHtml(item.humanStory.snippet)}</p>
          </div>
          <div>
            <a href="#${item.id}?mode=report" class="card-btn primary">Read Full Story in ${escapeHtml(item.title)} →</a>
          </div>
        </article>
      `
      )
      .join("");
  }

  document.querySelectorAll("[data-voice-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.voiceTab;
      document.querySelectorAll("[data-voice-tab]").forEach((b) => {
        const active = b.dataset.voiceTab === target;
        b.classList.toggle("active", active);
        b.setAttribute("aria-selected", String(active));
      });
      if (voicesQuotesPanelEl) voicesQuotesPanelEl.hidden = target !== "quotes";
      if (voicesStoriesPanelEl) voicesStoriesPanelEl.hidden = target !== "stories";
    });
  });

  // Global Proof Atlas
  const GLOBAL_PROOFS = [
    {
      place: "🇦🇹 Vienna, Austria",
      model: "60% Social & Co-Op Housing",
      fact: "Over 60% of residents live in architecturally stunning municipal or limited-profit apartments with rooftop pools and nurseries—keeping inner-city rents ~half of London or Dublin.",
      slug: "abundant-beautiful-housing",
      sourceLabel: "Wiener Wohnen",
      sourceUrl: "https://www.wienerwohnen.at/",
    },
    {
      place: "🇸🇬 Singapore",
      model: "80% HDB Ownership + Medisave",
      fact: "80% citizen homeownership via state-built HDB flats plus universal Medisave health accounts delivering world-leading longevity at ~4.5% of GDP (vs. 17.5% in the U.S.).",
      slug: "healthcare-without-billing",
      sourceLabel: "Singapore MOH & HDB",
      sourceUrl: "https://www.moh.gov.sg/",
    },
    {
      place: "🇫🇮 Finland",
      model: "Unconditional Housing First",
      fact: "Cut long-term street homelessness by >80% by treating a permanent private door as the starting point of recovery—proving ending homelessness costs less than managing it.",
      slug: "ending-homelessness-villages",
      sourceLabel: "Y-Foundation Finland",
      sourceUrl: "https://ysaatio.fi/en/housing-first/",
    },
    {
      place: "🇪🇪 Estonia",
      model: "X-Road 99% Digital State",
      fact: "99% of public services online 24/7, 3-minute tax filing, citizen-owned medical logs, and 2% of GDP saved annually in eliminated paper bureaucracy.",
      slug: "forty-eight-hour-governance",
      sourceLabel: "e-Estonia X-Road",
      sourceUrl: "https://e-estonia.com/solutions/interoperability-services/x-road/",
    },
    {
      place: "🇹🇼 Taiwan",
      model: "vTaiwan & Polis Consensus",
      fact: "Replaced outrage-driven comment threads with Polis bridging-consensus maps—turning 26+ polarized tech & civic disputes into >80% cross-party legislation.",
      slug: "bridging-consensus-trust",
      sourceLabel: "vTaiwan Official",
      sourceUrl: "https://info.vtaiwan.tw/",
    },
    {
      place: "🇳🇴 Norway & Alaska",
      model: "Universal Citizen Wealth Dividends",
      fact: "Norway's $1.8T Sovereign Fund (~$320k per citizen) and Alaska's 44-year Permanent Fund Dividend prove resource & capital commons can enrich every household.",
      slug: "universal-capital-dividends",
      sourceLabel: "NBIM Sovereign Fund",
      sourceUrl: "https://www.nbim.no/",
    },
    {
      place: "🇯🇵 Tokyo, Japan",
      model: "By-Right Flexible Zoning + High Trust",
      fact: "National flexible zoning lets Tokyo build more homes annually than California while 7-year-olds safely ride subways solo in litter-free neighborhoods.",
      slug: "high-trust-civic-norms",
      sourceLabel: "Urban Zoning Proof",
      sourceUrl: "https://en.wikipedia.org/wiki/Urban_planning",
    },
    {
      place: "🇩🇰 Denmark",
      model: "90% Flexicurity + Callable Mortgages",
      fact: "Workers displaced by tech receive up to 90% immediate wage bridges + rapid retraining, while transparent covered-bond mortgages allow penalty-free refinancing.",
      slug: "displaced-worker-bridge",
      sourceLabel: "Danish Flexicurity",
      sourceUrl: "https://denmark.dk/society-and-business/the-danish-labour-market",
    },
    {
      place: "🇷🇼 Rwanda & Ghana",
      model: "National Autonomous Drone Medicine",
      fact: "Leapfrogged washed-out rural roads with Zipline's autonomous blood and vaccine delivery network—slashing hospital maternal hemorrhage deaths by >50%.",
      slug: "aerial-hyperlocal-logistics",
      sourceLabel: "Zipline Medical Net",
      sourceUrl: "https://www.flyzipline.com/",
    },
    {
      place: "🇨🇷 Costa Rica",
      model: "Reversed Deforestation (21% → 57%)",
      fact: "Paid rural landowners for watershed and biodiversity stewardship—more than doubling wild rainforest cover while growing eco-prosperity and 98%+ clean electricity.",
      slug: "precision-fermentation-rewilding",
      sourceLabel: "FONAFIFO Costa Rica",
      sourceUrl: "https://www.fonafifo.go.cr/en/",
    },
    {
      place: "🇫🇮 Espoo & 🇩🇰 Odense",
      model: "Data-Center Municipal District Heating",
      fact: "Liquid-cooled AI campuses pipe 60 °C waste heat directly into public district heating networks—warming 250,000 Finnish residents in Espoo/Kirkkonummi and 11,000+ homes in Odense.",
      slug: "symbiotic-civic-data-centers",
      sourceLabel: "Fortum District Heat",
      sourceUrl: "https://www.fortum.com/",
    },
    {
      place: "🇮🇪 Ireland & 🇫🇷 Paris",
      model: "Sortition Citizens' Assemblies",
      fact: "Representative everyday citizens drawn by civic lottery deliberate with domain scientists—breaking decades-long partisan deadlocks and turning city streets into green school plazas.",
      slug: "sortition-citizens-assemblies",
      sourceLabel: "Ireland Citizens' Assembly",
      sourceUrl: "https://citizensassembly.ie/",
    },
  ];

  function renderGlobalProofs() {
    if (!globalProofGridEl) return;
    globalProofGridEl.innerHTML = GLOBAL_PROOFS.map((g) => {
      const item = itemsBySlug.get(g.slug);
      const href = item ? `#${item.id}?mode=report` : "#atlas-directory";
      return `
        <article class="global-card">
          <div>
            <h3 class="global-place">${escapeHtml(g.place)}</h3>
            <div class="global-model">${escapeHtml(g.model)}</div>
            <p class="global-fact">${escapeHtml(g.fact)}</p>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.45rem;padding-top:0.55rem;border-top:1px solid var(--border-subtle);">
            <a href="${escapeHtml(g.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="org-pill">🌍 ${escapeHtml(g.sourceLabel)} ↗</a>
            <a href="${href}" class="myth-deep-link">Scaled Blueprint →</a>
          </div>
        </article>
      `;
    }).join("");
  }

  // ==================== 6. MARKDOWN, KATEX & MERMAID RENDERER ====================
  function initMermaidTheme() {
    if (window.mermaid) {
      const isDark = getRenderedScheme() === "dark";
      window.mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "default",
        securityLevel: "loose",
        fontFamily: "Plus Jakarta Sans, sans-serif",
      });
    }
  }
  initMermaidTheme();

  let mermaidCounter = 0;

  function rewriteMarkdownHref(rawHref, currentItem) {
    if (!rawHref) return rawHref;
    const trimmed = rawHref.trim();

    // Rewrite same-folder companion links (e.g. REPORT.md, ./REPORT.md, STORYBOARD.md)
    const selfMatch = trimmed.match(/^(?:\.\/)?(REPORT|STORYBOARD)\.md(?:#.*)?$/i);
    if (selfMatch && currentItem) {
      const docType = selfMatch[1].toUpperCase() === "STORYBOARD" ? "storyboard" : "report";
      return `#${currentItem.id}?mode=${docType}`;
    }

    // Rewrite relative Carbon pathway links (e.g. ../synthetic-sky-fuels/REPORT.md or ../../02-automation-science/slug/STORYBOARD.md)
    const mdMatch = trimmed.match(/(?:^|\/)([a-z0-9-]+)\/(REPORT|STORYBOARD)\.md(?:#.*)?$/i);
    if (mdMatch) {
      const slug = mdMatch[1].toLowerCase();
      const docType = mdMatch[2].toUpperCase() === "STORYBOARD" ? "storyboard" : "report";
      const targetItem = itemsBySlug.get(slug);
      if (targetItem) {
        return `#${targetItem.id}?mode=${docType}`;
      }
    }

    // Rewrite bare slug links if any exist
    if (!trimmed.includes("/") && !trimmed.startsWith("#") && !trimmed.includes(":")) {
      const cleanSlug = trimmed.replace(/\.md$/i, "").toLowerCase();
      if (itemsBySlug.has(cleanSlug)) {
        return `#${itemsBySlug.get(cleanSlug).id}?mode=report`;
      }
    }

    return trimmed;
  }

  function renderRichMarkdown(rawMd, currentItem) {
    if (!rawMd) return "";

    const codeBlocks = [];
    let processed = rawMd.replace(/```([\w-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push({ lang: (lang || "").trim().toLowerCase(), code });
      return `@@CODEBLOCK${idx}@@`;
    });

    const inlineCodes = [];
    processed = processed.replace(/`([^`\n]+)`/g, (_, code) => {
      const idx = inlineCodes.length;
      inlineCodes.push(code);
      return `@@INLINECODE${idx}@@`;
    });

    processed = processed.replace(/\\\$/g, "@@LITERALDOLLAR@@");

    const mathHtmls = [];
    if (window.katex) {
      processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
        const cleanTex = tex.replace(/@@LITERALDOLLAR@@/g, "\\$").trim();
        try {
          const rendered = window.katex.renderToString(cleanTex, {
            displayMode: true,
            throwOnError: false,
          });
          const idx = mathHtmls.length;
          mathHtmls.push(rendered);
          return `@@MATHTOKEN${idx}@@`;
        } catch (_) {
          return `$$${cleanTex}$$`;
        }
      });

      processed = processed.replace(/\$([^\s$][^$\n]*?[^\s$]|[^\s$])\$/g, (full, tex) => {
        if (/^\d[\d,.]*$/.test(tex)) return full;
        const cleanTex = tex.replace(/@@LITERALDOLLAR@@/g, "\\$").trim();
        try {
          const rendered = window.katex.renderToString(cleanTex, {
            displayMode: false,
            throwOnError: false,
          });
          const idx = mathHtmls.length;
          mathHtmls.push(rendered);
          return `@@MATHTOKEN${idx}@@`;
        } catch (_) {
          return full;
        }
      });
    }

    processed = processed.replace(/@@LITERALDOLLAR@@/g, "$");

    processed = processed.replace(/@@INLINECODE(\d+)@@/g, (_, i) => {
      return "`" + inlineCodes[Number(i)] + "`";
    });

    processed = processed.replace(/@@CODEBLOCK(\d+)@@/g, (_, i) => {
      const blk = codeBlocks[Number(i)];
      if (blk.lang === "mermaid") {
        return `\n\n@@MERMAIDBLOCK${i}@@\n\n`;
      }
      return "```" + blk.lang + "\n" + blk.code + "```";
    });

    let html = window.marked ? window.marked.parse(processed) : processed;

    // Ensure scrollable <pre> blocks have tabindex="0" per modern-web-guidance
    html = html.replace(/<pre><code/g, '<pre tabindex="0"><code');

    // Normalize every <a href="..."> so internal pathway links resolve in the SPA and external links open safely
    html = html.replace(/<a\s+([^>]*?)href="([^"]*)"([^>]*)>/gi, (full, pre, href, post) => {
      const resolved = rewriteMarkdownHref(href, currentItem);
      const isExternal = /^https?:\/\//i.test(resolved);
      const cleanPre = pre.replace(/\b(?:target|rel)="[^"]*"\s*/gi, "");
      const cleanPost = post.replace(/\b(?:target|rel)="[^"]*"\s*/gi, "");
      const extAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a ${cleanPre}href="${resolved}"${extAttrs}${cleanPost}>`;
    });

    html = html.replace(/(?:<p>\s*)?@@MERMAIDBLOCK(\d+)@@(?:\s*<\/p>)?/g, (_, i) => {
      const blk = codeBlocks[Number(i)];
      const id = `mermaid-svg-${++mermaidCounter}`;
      const cleaned = blk.code
        .replace(/\\\$/g, "$")
        .replace(/\\n/g, "<br/>")
        .trim();
      const escaped = cleaned
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<div class="mermaid-wrapper"><pre class="mermaid" id="${id}">${escaped}</pre></div>`;
    });

    html = html.replace(/@@MATHTOKEN(\d+)@@/g, (_, i) => {
      return mathHtmls[Number(i)];
    });

    return html;
  }

  async function runMermaidInContainer(container) {
    if (!window.mermaid || !container) return;
    const nodes = container.querySelectorAll(".mermaid");
    if (nodes.length > 0) {
      try {
        await window.mermaid.run({ nodes });
      } catch (err) {
        console.warn("Mermaid render notice:", err);
      }
    }
  }

  // ==================== 7. DIRECTORY & FILTERING ====================
  function getFilteredItems() {
    const q = state.searchQuery.trim().toLowerCase();
    return catalog.items.filter((item) => {
      if (state.pillarFilter !== "all" && item.pillarId !== state.pillarFilter) return false;
      if (state.lensFilter === "new" && !item.isNewInCarbon) return false;
      if (state.lensFilter === "urgent" && !item.isUrgentSocial) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.tagline.toLowerCase().includes(q) ||
        item.cynicBelief.toLowerCase().includes(q) ||
        item.breakthroughCounter.toLowerCase().includes(q) ||
        item.quote.author.toLowerCase().includes(q) ||
        item.quote.text.toLowerCase().includes(q) ||
        item.companiesAndLabs.join(" ").toLowerCase().includes(q) ||
        item.globalPrecedents.join(" ").toLowerCase().includes(q) ||
        item.reportMd.toLowerCase().includes(q)
      );
    });
  }

  function renderSidebar() {
    if (!sidebarNavEl) return;
    const filtered = getFilteredItems();
    const groupsHtml = catalog.pillars
      .map((pillar) => {
        const pItems = filtered.filter((i) => i.pillarId === pillar.id);
        if (pItems.length === 0) return "";
        const linksHtml = pItems
          .map((item) => {
            const isActive = item.id === state.activeItemId;
            const badge = item.isNewInCarbon
              ? `<span class="mini-tag mini-new">NEW</span>`
              : item.isUrgentSocial
              ? `<span class="mini-tag mini-urgent">TRIAGE</span>`
              : "";
            return `
              <a href="#${item.id}?mode=report" class="nav-item ${isActive ? "active" : ""}">
                <span class="nav-item-title">${escapeHtml(item.title)}</span>
                ${badge}
              </a>
            `;
          })
          .join("");

        return `
          <div class="nav-group">
            <div class="nav-group-header">
              <span>${pillar.emoji} ${escapeHtml(pillar.shortTitle)}</span>
              <span>${pItems.length}</span>
            </div>
            ${linksHtml}
          </div>
        `;
      })
      .join("");

    sidebarNavEl.innerHTML =
      groupsHtml ||
      `<div style="padding:1rem;color:var(--text-muted);font-size:0.82rem;">No pathways match your current filter.</div>`;
  }

  function renderHomeCatalog() {
    if (!catalogSectionsEl) return;
    const filtered = getFilteredItems();
    const isFiltering =
      Boolean(state.searchQuery.trim()) ||
      state.pillarFilter !== "all" ||
      state.lensFilter !== "all";

    if (searchBannerEl) {
      searchBannerEl.hidden = !isFiltering;
      if (isFiltering) {
        searchCountEl.textContent = `${filtered.length} pathway${filtered.length === 1 ? "" : "s"}`;
        const parts = [];
        if (state.searchQuery.trim()) parts.push(`"${state.searchQuery.trim()}"`);
        if (state.pillarFilter !== "all") parts.push(state.pillarFilter);
        if (state.lensFilter !== "all") parts.push(state.lensFilter.toUpperCase());
        searchQueryLabelEl.textContent = parts.join(" • ");
      }
    }

    // Hide editorial home modules when user types a live search query so results appear immediately at top
    const hideEditorial = state.searchQuery.trim().length > 1;
    homeViewEl?.classList.toggle("searching", hideEditorial);
    ["mythbuster-section", "synergy-section", "budget-section", "voices-section", "global-section"].forEach(
      (secId) => {
        const el = document.getElementById(secId);
        if (el) el.hidden = hideEditorial;
      }
    );

    const sectionsHtml = catalog.pillars
      .map((pillar) => {
        const pItems = filtered.filter((i) => i.pillarId === pillar.id);
        if (pItems.length === 0) return "";

        const cardsHtml = pItems
          .map((item) => {
            const newChip = item.isNewInCarbon
              ? `<span class="mini-tag mini-new">✨ NEW SOTA</span>`
              : item.isUrgentSocial
              ? `<span class="mini-tag mini-urgent">🚨 TRIAGE</span>`
              : "";
            const orgsHtml = renderCompanyLinkPills(item, 3);

            return `
              <article class="topic-card">
                <div>
                  <div class="card-meta-top">
                    <span class="metric-chip">${escapeHtml(item.infographic.headlineMetric)}</span>
                    ${newChip}
                  </div>
                  <h3 class="card-title">
                    <a href="#${item.id}?mode=report" class="inline-ref-link" style="text-decoration:none;">${escapeHtml(item.title)}</a>
                  </h3>
                  <p class="card-tagline">${escapeHtml(item.tagline)}</p>
                  <div class="card-cynic-mini">
                    <strong>Counters:</strong> “${escapeHtml(item.cynicBelief.slice(0, 115))}${item.cynicBelief.length > 115 ? "…" : ""}”
                  </div>
                  <div class="card-OrgsRow">${orgsHtml}</div>
                </div>
                <div class="card-actions">
                  <a href="#${item.id}?mode=report" class="card-btn primary">📘 Report</a>
                  <a href="#${item.id}?mode=storyboard" class="card-btn">🎬 Storyboard</a>
                  <a href="#${item.id}?mode=infographic" class="card-btn">📊 Infographic</a>
                </div>
              </article>
            `;
          })
          .join("");

        return `
          <div class="pillar-section">
            <div class="pillar-section-header">
              <h3 class="pillar-section-title">${pillar.emoji} Pillar ${pillar.num}: ${escapeHtml(pillar.title)} <span class="chip-num">(${pItems.length})</span></h3>
              <p class="pillar-section-desc">${escapeHtml(pillar.description)}</p>
            </div>
            <div class="cards-grid">${cardsHtml}</div>
          </div>
        `;
      })
      .join("");

    catalogSectionsEl.innerHTML =
      sectionsHtml ||
      `<div class="budget-simulator-card"><h3>No pathways matched your search.</h3><p>Try clearing filters or searching for terms like <code>AlphaGenome</code>, <code>Extropic</code>, <code>Maya LiDAR</code>, <code>Chatterji</code>, <code>fusion</code>, or <code>Vienna</code>.</p></div>`;
  }

  // ==================== 8. DETAIL READER & INFOGRAPHIC DOSSIER ====================
  function buildDossierHtml(item) {
    const info = item.infographic;
    const rawVals = info.trajectory.map((t) => Math.max(0, Number(t.value) || 0));
    const maxVal = Math.max(...rawVals, 1);
    const posVals = rawVals.filter((v) => v > 0);
    const minPos = posVals.length ? Math.min(...posVals) : 1;
    const usePowerScale = maxVal / minPos > 35;

    const trajBarsHtml = info.trajectory
      .map((step) => {
        const numVal = Math.max(0, Number(step.value) || 0);
        const ratio = numVal / maxVal;
        const rawPct = Math.round((usePowerScale && ratio > 0 ? Math.pow(ratio, 0.36) : ratio) * 100);
        const widthPct = numVal === 0 ? 4 : Math.max(7, Math.min(100, rawPct));
        return `
          <div class="traj-row">
            <span class="traj-year">${escapeHtml(step.year)} · <span style="font-weight:500;color:var(--text-secondary);">${escapeHtml(step.label)}</span></span>
            <div class="traj-track" aria-hidden="true">
              <div class="traj-fill" style="width:${widthPct}%"></div>
            </div>
            <span class="traj-val">${escapeHtml(step.display)}</span>
          </div>
        `;
      })
      .join("");

    const kpisHtml = info.kpis
      .map(
        (k) => `
        <div class="kpi-tile">
          <div class="kpi-tile-val">${escapeHtml(k.value)}</div>
          <div class="kpi-tile-lbl">${escapeHtml(k.label)}</div>
          <div class="kpi-tile-sub">${escapeHtml(k.detail)}</div>
        </div>
      `
      )
      .join("");

    const companiesHtml = renderCompanyLinkPills(item);
    const precedentsHtml = renderPrecedentLinkPills(item);

    const synHtml = (item.synergyLinks || [])
      .map((slug) => {
        const target = itemsBySlug.get(slug);
        if (!target) return "";
        return `<a href="#${target.id}?mode=report" class="card-btn">${target.pillarEmoji} ${escapeHtml(target.title)} →</a>`;
      })
      .join("");

    const citeAttr = item.quote?.url ? ` cite="${escapeHtml(item.quote.url)}"` : "";

    return `
      <div class="dossier-grid-top">
        <div class="dossier-box cynic-box">
          <span class="dossier-label" style="color:var(--accent-rose);">😒 The Cynic's Belief (“Never Gonna Happen”)</span>
          <p style="margin:0;font-size:0.9rem;">“${escapeHtml(item.cynicBelief)}”</p>
        </div>
        <div class="dossier-box reality-box">
          <span class="dossier-label" style="color:var(--accent-emerald);">🌱 Verified 2025–2026 Breakthrough Reality</span>
          <p style="margin:0;font-size:0.9rem;">${escapeHtml(item.breakthroughCounter)}</p>
        </div>
      </div>

      <div class="dossier-kpis-row">${kpisHtml}</div>

      <div class="trajectory-chart-box" role="region" aria-label="Projected quantitative trajectory">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:0.5rem;">
          <strong style="font-size:0.88rem;">📈 Quantitative SOTA Trajectory: ${escapeHtml(info.unit)}</strong>
          <span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted);">
            ${info.lowerIsBetter ? "↓ Falling Cost / Friction Curve" : "↑ Expanding Capability / Flourishing Curve"}
          </span>
        </div>
        <div class="traj-bars">${trajBarsHtml}</div>
      </div>

      <div class="dossier-story-quote-grid">
        <div class="story-card" style="padding:1.1rem 1.25rem;">
          <div>
            <div class="story-loc">🌅 HUMAN STORY • ${escapeHtml(item.humanStory.location)}</div>
            <h2 style="font-family:var(--font-display);font-size:1.02rem;margin:0 0 0.4rem;">${escapeHtml(item.humanStory.protagonist)}</h2>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin:0;">${escapeHtml(item.humanStory.snippet)}</p>
          </div>
        </div>

        <figure class="quote-card" style="padding:1.1rem 1.25rem;">
          <blockquote${citeAttr} style="font-size:0.93rem;margin-bottom:0.75rem;">“${escapeHtml(item.quote.text)}”</blockquote>
          <figcaption>
            <div>
              ${renderQuoteAuthorLink(item.quote)}
              <span class="quote-role">${escapeHtml(item.quote.role)}</span>
            </div>
          </figcaption>
        </figure>
      </div>

      <div class="dossier-box" style="margin-bottom:0.95rem;background:var(--bg-warm-tint);border-color:var(--accent-amber);">
        <span class="dossier-label" style="color:var(--accent-amber);">🤝 Social Convention &amp; Norm Reimagined</span>
        <p style="margin:0;font-size:0.88rem;">${escapeHtml(item.socialNormShift)}</p>
      </div>

      <div class="dossier-tags-strip">
        ${companiesHtml}
        ${precedentsHtml}
      </div>
      ${
        synHtml
          ? `<div style="margin-top:0.85rem;display:flex;flex-wrap:wrap;gap:0.4rem;align-items:center;">
               <span style="font-family:var(--font-mono);font-size:0.7rem;font-weight:700;color:var(--text-muted);">SYNERGY MULTIPLIERS:</span>
               ${synHtml}
             </div>`
          : ""
      }
    `;
  }

  function buildTocAndIds(containerEl) {
    const headings = containerEl.querySelectorAll("h2, h3");
    const tocItems = [];
    headings.forEach((h, index) => {
      const slug =
        "sec-" +
        index +
        "-" +
        h.textContent
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      h.id = slug;
      tocItems.push({
        id: slug,
        text: h.textContent,
        level: h.tagName.toLowerCase(),
      });
    });

    const tocHtml = tocItems
      .map(
        (t) =>
          `<a href="#${state.activeItemId}?mode=${state.docMode}" data-scroll-to="${t.id}" class="toc-link toc-${t.level}">${escapeHtml(t.text)}</a>`
      )
      .join("");

    if (tocListEl) tocListEl.innerHTML = tocHtml;
    if (mobileTocListEl) mobileTocListEl.innerHTML = tocHtml;
    if (mobileTocDetailsEl) {
      mobileTocDetailsEl.open = false;
      mobileTocDetailsEl.hidden =
        tocItems.length === 0 || state.docMode === "infographic";
    }
  }

  function renderDetailContent() {
    const item = itemsById.get(state.activeItemId);
    if (!item) return;

    if (!VALID_DOC_MODES.has(state.docMode)) {
      state.docMode = "report";
    }

    detailPillarBadgeEl.textContent = `${item.pillarEmoji} ${item.pillarShort}`;
    detailNewBadgeEl.hidden = !item.isNewInCarbon;
    detailFolderPathEl.innerHTML = `<a href="https://github.com/d-10-g/OneOfMany/tree/main/${escapeHtml(item.folderRel)}" target="_blank" rel="noopener noreferrer" class="inline-ref-link">${escapeHtml(item.folderRel)} ↗</a>`;
    detailReadMetaEl.textContent = `CARBON EDITION • ~${item.readMinutes} MIN READ • ${item.reportLines}L REPORT + ${item.storyboardLines}L STORYBOARD`;
    detailHeadingEl.textContent = item.title;
    detailTaglineEl.textContent = item.tagline;
    detailHeadlineStatEl.innerHTML = `
      <span class="headline-stat-big">${escapeHtml(item.infographic.headlineMetric)}</span>
      <span class="headline-stat-lbl">${escapeHtml(item.infographic.headlineLabel)}</span>
    `;

    detailDossierMountEl.innerHTML = buildDossierHtml(item);

    document.querySelectorAll(".mode-tab").forEach((btn) => {
      const isAct = btn.dataset.mode === state.docMode;
      btn.classList.toggle("active", isAct);
      btn.setAttribute("aria-selected", String(isAct));
    });

    readerLayoutEl.classList.remove("split-mode", "infographic-only");

    if (state.docMode === "infographic") {
      readerLayoutEl.classList.add("infographic-only");
      if (mobileTocDetailsEl) mobileTocDetailsEl.hidden = true;
    } else if (state.docMode === "report") {
      primaryPaneLabelEl.hidden = true;
      secondaryPaneEl.hidden = true;
      markdownOutputEl.innerHTML = renderRichMarkdown(item.reportMd, item);
      buildTocAndIds(markdownOutputEl);
      runMermaidInContainer(markdownOutputEl);
    } else if (state.docMode === "storyboard") {
      primaryPaneLabelEl.hidden = false;
      primaryPaneLabelEl.textContent = `🎬 VISUAL STORYBOARD & PRODUCTION GUIDE (${item.folderRel}/STORYBOARD.md)`;
      secondaryPaneEl.hidden = true;
      markdownOutputEl.innerHTML = renderRichMarkdown(item.storyboardMd, item);
      buildTocAndIds(markdownOutputEl);
      runMermaidInContainer(markdownOutputEl);
    } else if (state.docMode === "split") {
      readerLayoutEl.classList.add("split-mode");
      primaryPaneLabelEl.hidden = false;
      primaryPaneLabelEl.textContent = `📘 CARBON DEEP REPORT (${item.folderRel}/REPORT.md)`;
      secondaryPaneEl.hidden = false;
      secondaryPaneLabelEl.textContent = `🎬 VISUAL STORYBOARD (${item.folderRel}/STORYBOARD.md)`;
      markdownOutputEl.innerHTML = renderRichMarkdown(item.reportMd, item);
      secondaryMarkdownOutputEl.innerHTML = renderRichMarkdown(item.storyboardMd, item);
      buildTocAndIds(markdownOutputEl);
      runMermaidInContainer(markdownOutputEl);
      runMermaidInContainer(secondaryMarkdownOutputEl);
    }

    // Sibling prev/next navigation
    const filtered = getFilteredItems();
    const idx = filtered.findIndex((i) => i.id === item.id);
    const prevItem = idx > 0 ? filtered[idx - 1] : null;
    const nextItem = idx >= 0 && idx < filtered.length - 1 ? filtered[idx + 1] : null;
    prevNextBoxEl.innerHTML = `
      ${prevItem ? `<a href="#${prevItem.id}?mode=${state.docMode}" class="card-btn">← ${escapeHtml(prevItem.title)}</a>` : ""}
      ${nextItem ? `<a href="#${nextItem.id}?mode=${state.docMode}" class="card-btn">${escapeHtml(nextItem.title)} →</a>` : ""}
    `;
  }

  // ==================== 9. ROUTER & SAME-DOCUMENT VIEW TRANSITIONS ====================
  function applyRouteUpdate(targetItemId, targetMode, scrollSectionId) {
    const switchingView = Boolean(state.activeItemId) !== Boolean(targetItemId);
    state.activeItemId = targetItemId;
    if (targetMode && VALID_DOC_MODES.has(targetMode)) {
      state.docMode = targetMode;
    }

    const updateDOM = () => {
      if (state.activeItemId && itemsById.has(state.activeItemId)) {
        homeViewEl.hidden = true;
        detailViewEl.hidden = false;
        renderDetailContent();
        window.scrollTo({ top: 0, behavior: "instant" });
      } else {
        state.activeItemId = null;
        detailViewEl.hidden = true;
        homeViewEl.hidden = false;
        renderHomeCatalog();
        if (scrollSectionId) {
          document.getElementById(scrollSectionId)?.scrollIntoView({ behavior: "smooth" });
        }
      }
      renderSidebar();
      if (mobileMediaQuery.matches && state.sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    const routeFocus = () => {
      if (state.activeItemId) {
        detailHeadingEl?.focus();
      } else if (switchingView) {
        mainHeadingEl?.focus();
      }
    };

    if (!document.startViewTransition || !switchingView) {
      updateDOM();
      routeFocus();
      return;
    }

    const transition = document.startViewTransition(() => {
      updateDOM();
    });
    transition.finished.finally(() => {
      routeFocus();
    });
  }

  const HOME_SECTION_ANCHORS = new Set([
    "hero-anchor",
    "mythbuster-section",
    "synergy-section",
    "budget-section",
    "voices-section",
    "global-section",
    "atlas-directory",
  ]);

  function parseHashAndRoute() {
    const rawHash = window.location.hash.replace(/^#/, "");
    if (!rawHash || rawHash === "home") {
      applyRouteUpdate(null, null, rawHash === "home" ? "hero-anchor" : null);
      return;
    }
    if (HOME_SECTION_ANCHORS.has(rawHash)) {
      applyRouteUpdate(null, null, rawHash);
      return;
    }

    const [rawId, queryPart] = rawHash.split("?");
    let mode = state.docMode;
    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      const requestedMode = params.get("mode");
      if (requestedMode && VALID_DOC_MODES.has(requestedMode)) {
        mode = requestedMode;
      } else if (requestedMode) {
        mode = "report";
      }
    }

    // Support direct Carbon IDs or bare slugs
    let resolvedId = null;
    if (itemsById.has(rawId)) {
      resolvedId = rawId;
    } else if (itemsBySlug.has(rawId)) {
      resolvedId = itemsBySlug.get(rawId).id;
    }

    if (resolvedId) {
      applyRouteUpdate(resolvedId, mode, null);
    } else {
      applyRouteUpdate(null, null, null);
    }
  }

  window.addEventListener("hashchange", parseHashAndRoute);

  // ==================== 10. UI EVENT LISTENERS ====================
  document.querySelectorAll(".jump-pill").forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetSec = link.dataset.jump;
      if (!targetSec) return;
      e.preventDefault();
      if (state.activeItemId) {
        window.location.hash = `#${targetSec}`;
      } else {
        document.getElementById(targetSec)?.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  document.querySelectorAll(".pillar-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.pillarFilter = btn.dataset.pillar;
      document.querySelectorAll(".pillar-chip").forEach((b) => {
        b.classList.toggle("active", b.dataset.pillar === state.pillarFilter);
      });
      renderSidebar();
      if (state.activeItemId) {
        window.location.hash = "#atlas-directory";
      } else {
        renderHomeCatalog();
      }
    });
  });

  document.querySelectorAll(".lens-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.lensFilter = btn.dataset.lens;
      document.querySelectorAll(".lens-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.lens === state.lensFilter);
      });
      renderSidebar();
      if (state.activeItemId) {
        window.location.hash = "#atlas-directory";
      } else {
        renderHomeCatalog();
      }
    });
  });

  globalSearchInput?.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    if (state.activeItemId && state.searchQuery.trim().length > 1) {
      window.location.hash = "#home";
    } else {
      renderSidebar();
      renderHomeCatalog();
    }
  });

  clearSearchBtn?.addEventListener("click", () => {
    state.searchQuery = "";
    state.pillarFilter = "all";
    state.lensFilter = "all";
    if (globalSearchInput) globalSearchInput.value = "";
    document.querySelectorAll(".pillar-chip").forEach((b) => {
      b.classList.toggle("active", b.dataset.pillar === "all");
    });
    document.querySelectorAll(".lens-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lens === "all");
    });
    renderSidebar();
    renderHomeCatalog();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== globalSearchInput) {
      e.preventDefault();
      globalSearchInput?.focus();
    } else if (e.key === "Escape" && state.sidebarOpen) {
      setSidebarOpen(false);
    }
  });

  backToAtlasBtn?.addEventListener("click", () => {
    window.location.hash = "#home";
  });

  document.querySelectorAll(".mode-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      if (state.activeItemId) {
        window.location.hash = `#${state.activeItemId}?mode=${mode}`;
      }
    });
  });

  function handleTocClick(e) {
    const link = e.target.closest("[data-scroll-to]");
    if (!link) return;
    e.preventDefault();
    if (mobileTocDetailsEl) mobileTocDetailsEl.open = false;
    const targetEl = document.getElementById(link.dataset.scrollTo);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  tocListEl?.addEventListener("click", handleTocClick);
  mobileTocListEl?.addEventListener("click", handleTocClick);

  sidebarToggleBtn?.addEventListener("click", () => {
    setSidebarOpen(!state.sidebarOpen);
  });

  sidebarCloseBtn?.addEventListener("click", () => setSidebarOpen(false));
  sidebarBackdropEl?.addEventListener("click", () => setSidebarOpen(false));

  if (backToTopBtn) {
    window.addEventListener(
      "scroll",
      () => {
        backToTopBtn.hidden = window.scrollY < 500;
      },
      { passive: true }
    );
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ==================== 11. BOOTSTRAP ====================
  setSidebarOpen(false);
  renderMythBusters();
  renderSynergyReactor();
  renderBudgetSimulator();
  renderVoicesAndStories();
  renderGlobalProofs();
  parseHashAndRoute();

  // Immediately open a random breakthrough spotlight on the landing page
  const initialHash = window.location.hash.replace(/^#/, "");
  if (!state.activeItemId && (!initialHash || initialHash === "home")) {
    openHopeModal();
  }
})();
