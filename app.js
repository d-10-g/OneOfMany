(function () {
  "use strict";

  const catalog = window.ONE_OF_MANY_CATALOG;
  if (!catalog || !Array.isArray(catalog.items)) {
    console.error("ONE_OF_MANY_CATALOG not loaded.");
    return;
  }

  const itemsById = new Map();
  const pairByTrackAndSlug = new Map();

  catalog.items.forEach((item) => {
    itemsById.set(item.id, item);
    const key = `${item.trackId}::${item.slug}`;
    if (!pairByTrackAndSlug.has(key)) {
      pairByTrackAndSlug.set(key, {});
    }
    pairByTrackAndSlug.get(key)[item.horizon] = item;
  });

  // State
  const state = {
    horizonFilter: "all", // 'all' | 'v1' | 'v2' | 'urgent'
    trackFilter: "all",   // 'all' | 'abundant-energy' | 'automation' | 'social' | 'space'
    searchQuery: "",
    activeItemId: null,   // null = Home Atlas view
    docMode: "report",    // 'report' | 'storyboard' | 'split' | 'compare'
  };

  // Elements
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  const themeToggleBtn = document.getElementById("theme-toggle");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const sidebarEl = document.getElementById("sidebar");
  const sidebarNavEl = document.getElementById("sidebar-nav");
  const globalSearchInput = document.getElementById("global-search");
  const searchBannerEl = document.getElementById("search-results-banner");
  const searchCountEl = document.getElementById("search-results-count");
  const searchQueryLabelEl = document.getElementById("search-query-label");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  const catalogSectionsEl = document.getElementById("catalog-sections");
  const homeViewEl = document.getElementById("home-view");
  const detailViewEl = document.getElementById("detail-view");
  const backToAtlasBtn = document.getElementById("back-to-atlas");
  const detailTrackBadgeEl = document.getElementById("detail-track-badge");
  const detailHorizonBadgeEl = document.getElementById("detail-horizon-badge");
  const detailFolderPathEl = document.getElementById("detail-folder-path");
  const detailHeadingEl = document.getElementById("detail-heading");
  const detailSubtitleEl = document.getElementById("detail-subtitle");
  const counterpartBoxEl = document.getElementById("counterpart-action-box");
  const compareHorizonTabBtn = document.getElementById("compare-horizon-tab");
  const readerLayoutEl = document.getElementById("reader-layout");
  const primaryPaneLabelEl = document.getElementById("primary-pane-label");
  const secondaryPaneEl = document.getElementById("secondary-pane");
  const secondaryPaneLabelEl = document.getElementById("secondary-pane-label");
  const markdownOutputEl = document.getElementById("markdown-output");
  const secondaryMarkdownOutputEl = document.getElementById("secondary-markdown-output");
  const tocListEl = document.getElementById("toc-list");
  const prevNextBoxEl = document.getElementById("prev-next-box");
  const mainHeadingEl = document.getElementById("main-heading");

  // 1. Dark Mode Toggle (modern-web-guidance compliant)
  function getSystemScheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function getRenderedScheme() {
    const content = metaColorScheme.content;
    if (content === "dark" || content === "light") {
      return content;
    }
    return getSystemScheme();
  }

  themeToggleBtn.addEventListener("click", () => {
    const currentRendered = getRenderedScheme();
    const target = currentRendered === "dark" ? "light" : "dark";
    const systemPref = getSystemScheme();

    if (target !== systemPref) {
      try {
        localStorage.setItem("color-scheme", target);
      } catch (_) {}
      metaColorScheme.content = target;
    } else {
      try {
        localStorage.removeItem("color-scheme");
      } catch (_) {}
      metaColorScheme.content = "light dark";
    }
    initMermaidTheme();
    if (state.activeItemId) {
      renderDetailContent();
    }
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "color-scheme") {
      metaColorScheme.content = e.newValue ?? "light dark";
      initMermaidTheme();
    }
  });

  // 2. Mermaid & Markdown + KaTeX rendering
  function initMermaidTheme() {
    if (window.mermaid) {
      const isDark = getRenderedScheme() === "dark";
      window.mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "default",
        securityLevel: "loose",
        fontFamily: "Inter, sans-serif",
      });
    }
  }
  initMermaidTheme();

  let mermaidCounter = 0;

  function renderRichMarkdown(rawMd) {
    if (!rawMd) return "";

    // Protect fenced code blocks first
    const codeBlocks = [];
    let processed = rawMd.replace(/```([\w-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push({ lang: (lang || "").trim().toLowerCase(), code });
      return `@@CODEBLOCK${idx}@@`;
    });

    // Protect inline code
    const inlineCodes = [];
    processed = processed.replace(/`([^`\n]+)`/g, (_, code) => {
      const idx = inlineCodes.length;
      inlineCodes.push(code);
      return `@@INLINECODE${idx}@@`;
    });

    // Replace escaped dollar signs \$ with a placeholder so they don't trigger math
    processed = processed.replace(/\\\$/g, "@@LITERALDOLLAR@@");

    // Render display math $$...$$ and inline math $...$ into protected tokens
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

      // Render inline math $...$ (avoid matching currency like $100)
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

    // Restore literal dollar signs
    processed = processed.replace(/@@LITERALDOLLAR@@/g, "$");

    // Restore inline code
    processed = processed.replace(/@@INLINECODE(\d+)@@/g, (_, i) => {
      return "`" + inlineCodes[Number(i)] + "`";
    });

    // Restore non-mermaid fenced code blocks before marked.parse; keep mermaid protected
    processed = processed.replace(/@@CODEBLOCK(\d+)@@/g, (_, i) => {
      const blk = codeBlocks[Number(i)];
      if (blk.lang === "mermaid") {
        return `\n\n@@MERMAIDBLOCK${i}@@\n\n`;
      }
      return "```" + blk.lang + "\n" + blk.code + "```";
    });

    let html = window.marked ? window.marked.parse(processed) : processed;

    // Inject Mermaid blocks after marked.parse so blank lines or 4-space indentation inside diagrams are never split into <pre><code>
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

    // Inject rendered KaTeX HTML tokens
    html = html.replace(/@@MATHTOKEN(\d+)@@/g, (_, i) => {
      return mathHtmls[Number(i)];
    });

    return html;
  }

  async function runMermaidInContainer(container) {
    if (!window.mermaid) return;
    const nodes = container.querySelectorAll(".mermaid");
    if (nodes.length > 0) {
      try {
        await window.mermaid.run({ nodes });
      } catch (err) {
        console.warn("Mermaid render notice:", err);
      }
    }
  }

  // 3. Filtering logic
  function getFilteredItems() {
    const q = state.searchQuery.trim().toLowerCase();
    return catalog.items.filter((item) => {
      if (state.horizonFilter === "v1" && item.horizon !== "v1") return false;
      if (state.horizonFilter === "v2" && item.horizon !== "v2") return false;
      if (state.horizonFilter === "urgent" && !item.isUrgentTriage) return false;
      if (state.trackFilter !== "all" && item.trackId !== state.trackFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.folderName.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.reportMd.toLowerCase().includes(q) ||
        item.storyboardMd.toLowerCase().includes(q)
      );
    });
  }

  // 4. Render Sidebar & Home Catalog
  function renderSidebar() {
    const filtered = getFilteredItems();
    const groupsHtml = catalog.tracks
      .map((track) => {
        const trackItems = filtered.filter((i) => i.trackId === track.id);
        if (trackItems.length === 0) return "";
        const linksHtml = trackItems
          .map((item) => {
            const isActive = item.id === state.activeItemId;
            const hBadge =
              item.horizon === "v1"
                ? `<span class="mini-badge mini-v1">2040</span>`
                : `<span class="mini-badge mini-v2">2030</span>`;
            const uBadge = item.isUrgentTriage
              ? `<span class="mini-badge mini-urgent">TRIAGE</span>`
              : "";
            return `
              <a href="#${item.id}" class="nav-item ${isActive ? "active" : ""}" data-id="${item.id}">
                <span class="nav-item-title">${item.title}</span>
                <span class="nav-badges">${uBadge}${hBadge}</span>
              </a>
            `;
          })
          .join("");

        return `
          <div class="nav-group">
            <div class="nav-group-header">
              <span>${track.title}</span>
              <span>${trackItems.length}</span>
            </div>
            ${linksHtml}
          </div>
        `;
      })
      .join("");

    sidebarNavEl.innerHTML =
      groupsHtml ||
      `<div style="padding:1rem;color:var(--text-muted);font-size:0.82rem;">No matching pathways found.</div>`;
  }

  function renderHomeCatalog() {
    const filtered = getFilteredItems();

    if (state.searchQuery.trim() || state.horizonFilter !== "all" || state.trackFilter !== "all") {
      searchBannerEl.hidden = false;
      searchCountEl.textContent = `${filtered.length} pathway${filtered.length === 1 ? "" : "s"}`;
      const parts = [];
      if (state.searchQuery.trim()) parts.push(`"${state.searchQuery.trim()}"`);
      if (state.horizonFilter !== "all") parts.push(state.horizonFilter.toUpperCase());
      if (state.trackFilter !== "all") parts.push(state.trackFilter);
      searchQueryLabelEl.textContent = parts.join(" • ") || "All";
    } else {
      searchBannerEl.hidden = true;
    }

    const sectionsHtml = catalog.tracks
      .map((track) => {
        const trackItems = filtered.filter((i) => i.trackId === track.id);
        if (trackItems.length === 0) return "";

        const cardsHtml = trackItems
          .map((item) => {
            const pair = pairByTrackAndSlug.get(`${item.trackId}::${item.slug}`);
            const hasCounterpart = pair && pair.v1 && pair.v2;
            const badgeHtml =
              item.horizon === "v1"
                ? `<span class="mini-badge mini-v1">VISION 01 • 2026–2040</span>`
                : `<span class="mini-badge mini-v2">VISION 02 • 2026–2030 LEAPFROG</span>`;
            const urgentHtml = item.isUrgentTriage
              ? `<span class="mini-badge mini-urgent">URGENT TRIAGE</span>`
              : "";

            return `
              <article class="topic-card ${item.isUrgentTriage ? "urgent-card" : ""}">
                <div>
                  <div class="card-top-meta">
                    <span class="folder-tag">${item.relPath}</span>
                    <div class="nav-badges">${urgentHtml}${badgeHtml}</div>
                  </div>
                  <h3 class="card-title">${item.title}</h3>
                  <p class="card-summary">${item.summary}</p>
                </div>
                <div class="card-actions">
                  <a href="#${item.id}?mode=report" class="card-btn primary">📘 Report (${item.reportLines}L)</a>
                  <a href="#${item.id}?mode=storyboard" class="card-btn">🎬 Storyboard (${item.storyboardLines}L)</a>
                  ${
                    hasCounterpart
                      ? `<a href="#${item.id}?mode=compare" class="card-btn" title="Compare 2040 vs 2030 Leapfrog">⚡ Compare V1/V2</a>`
                      : ""
                  }
                </div>
              </article>
            `;
          })
          .join("");

        return `
          <section class="track-section">
            <div class="track-section-header">
              <div>
                <h2 class="track-section-title">${track.title} <span class="pill-count">${trackItems.length}</span></h2>
                <p class="track-section-desc">${track.description}</p>
              </div>
            </div>
            <div class="cards-grid">${cardsHtml}</div>
          </section>
        `;
      })
      .join("");

    catalogSectionsEl.innerHTML =
      sectionsHtml ||
      `<div class="hero-card"><h3>No pathways matched your filter.</h3><p>Try clearing the search query or switching the horizon tab.</p></div>`;
  }

  // 5. Render Detail Reader & Comparison View
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

    tocListEl.innerHTML = tocItems
      .map(
        (t) =>
          `<a href="#${state.activeItemId}" data-scroll-to="${t.id}" class="toc-link toc-${t.level}">${t.text}</a>`
      )
      .join("");
  }

  function renderDetailContent() {
    const item = itemsById.get(state.activeItemId);
    if (!item) return;

    const pair = pairByTrackAndSlug.get(`${item.trackId}::${item.slug}`);
    const counterpart = pair ? (item.horizon === "v1" ? pair.v2 : pair.v1) : null;

    detailTrackBadgeEl.textContent = item.trackTitle;
    detailHorizonBadgeEl.className =
      "mini-badge " + (item.horizon === "v1" ? "mini-v1" : "mini-v2");
    detailHorizonBadgeEl.textContent = item.horizonLabel;
    detailFolderPathEl.textContent = item.relPath;
    detailHeadingEl.textContent = item.title;
    detailSubtitleEl.textContent = item.subheading || item.heading;

    // Counterpart quick switch button
    if (counterpart) {
      compareHorizonTabBtn.hidden = false;
      counterpartBoxEl.innerHTML = `
        <a href="#${counterpart.id}?mode=${state.docMode === "compare" ? "report" : state.docMode}" class="card-btn primary">
          Switch to ${counterpart.horizon === "v1" ? "Vision 01 (2026–2040)" : "Vision 02 (2026–2030 Leapfrog)"} →
        </a>
      `;
    } else {
      compareHorizonTabBtn.hidden = true;
      if (state.docMode === "compare") state.docMode = "report";
      counterpartBoxEl.innerHTML = `<span class="mini-badge mini-urgent">NEW IN VISION 02 • IMMEDIATE TRIAGE</span>`;
    }

    // Update mode tabs active state
    document.querySelectorAll(".mode-tab").forEach((btn) => {
      const isAct = btn.dataset.mode === state.docMode;
      btn.classList.toggle("active", isAct);
      btn.setAttribute("aria-selected", String(isAct));
    });

    if (state.docMode === "report") {
      readerLayoutEl.classList.remove("split-mode");
      primaryPaneLabelEl.hidden = true;
      secondaryPaneEl.hidden = true;
      markdownOutputEl.innerHTML = renderRichMarkdown(item.reportMd);
      buildTocAndIds(markdownOutputEl);
      runMermaidInContainer(markdownOutputEl);
    } else if (state.docMode === "storyboard") {
      readerLayoutEl.classList.remove("split-mode");
      primaryPaneLabelEl.hidden = true;
      secondaryPaneEl.hidden = true;
      markdownOutputEl.innerHTML = renderRichMarkdown(item.storyboardMd);
      buildTocAndIds(markdownOutputEl);
      runMermaidInContainer(markdownOutputEl);
    } else if (state.docMode === "split") {
      readerLayoutEl.classList.add("split-mode");
      primaryPaneLabelEl.hidden = false;
      primaryPaneLabelEl.textContent = `📘 DEEP REPORT (${item.relPath}/REPORT.md)`;
      secondaryPaneEl.hidden = false;
      secondaryPaneLabelEl.textContent = `🎬 FLEXIBLE STORYBOARD (${item.relPath}/STORYBOARD.md)`;
      markdownOutputEl.innerHTML = renderRichMarkdown(item.reportMd);
      secondaryMarkdownOutputEl.innerHTML = renderRichMarkdown(item.storyboardMd);
      runMermaidInContainer(markdownOutputEl);
      runMermaidInContainer(secondaryMarkdownOutputEl);
    } else if (state.docMode === "compare" && pair && pair.v1 && pair.v2) {
      readerLayoutEl.classList.add("split-mode");
      primaryPaneLabelEl.hidden = false;
      primaryPaneLabelEl.textContent = `VISION 01 (2026–2040 GROUNDED) — ${pair.v1.relPath}/REPORT.md`;
      secondaryPaneEl.hidden = false;
      secondaryPaneLabelEl.textContent = `VISION 02 (2026–2030 LEAPFROG) — ${pair.v2.relPath}/REPORT.md`;
      markdownOutputEl.innerHTML = renderRichMarkdown(pair.v1.reportMd);
      secondaryMarkdownOutputEl.innerHTML = renderRichMarkdown(pair.v2.reportMd);
      runMermaidInContainer(markdownOutputEl);
      runMermaidInContainer(secondaryMarkdownOutputEl);
    }

    // Prev / Next navigation
    const filtered = getFilteredItems();
    const idx = filtered.findIndex((i) => i.id === item.id);
    const prevItem = idx > 0 ? filtered[idx - 1] : null;
    const nextItem = idx >= 0 && idx < filtered.length - 1 ? filtered[idx + 1] : null;
    prevNextBoxEl.innerHTML = `
      ${prevItem ? `<a href="#${prevItem.id}?mode=${state.docMode}" class="card-btn">← ${prevItem.title}</a>` : ""}
      ${nextItem ? `<a href="#${nextItem.id}?mode=${state.docMode}" class="card-btn">${nextItem.title} →</a>` : ""}
    `;
  }

  // 6. View Transitions & Router (modern-web-guidance compliant)
  function applyRouteUpdate(targetItemId, targetMode) {
    const switchingView = Boolean(state.activeItemId) !== Boolean(targetItemId);
    state.activeItemId = targetItemId;
    if (targetMode) {
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
      }
      renderSidebar();
      sidebarEl.classList.remove("open");
    };

    const routeFocus = () => {
      if (state.activeItemId) {
        detailHeadingEl?.focus({ preventScroll: true });
      } else if (switchingView) {
        mainHeadingEl?.focus({ preventScroll: true });
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

  function parseHashAndRoute() {
    const rawHash = window.location.hash.replace(/^#/, "");
    if (!rawHash || rawHash === "home") {
      applyRouteUpdate(null, null);
      return;
    }
    const [itemId, queryPart] = rawHash.split("?");
    let mode = state.docMode;
    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      if (params.get("mode")) {
        mode = params.get("mode");
      }
    }
    if (itemsById.has(itemId)) {
      applyRouteUpdate(itemId, mode);
    } else {
      applyRouteUpdate(null, null);
    }
  }

  window.addEventListener("hashchange", parseHashAndRoute);

  // 7. UI Event Listeners
  document.querySelectorAll(".horizon-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.horizonFilter = btn.dataset.horizon;
      document.querySelectorAll(".horizon-pill").forEach((b) => {
        const active = b === btn;
        b.classList.toggle("active", active);
        b.setAttribute("aria-selected", String(active));
      });
      renderSidebar();
      if (!state.activeItemId) {
        renderHomeCatalog();
      }
    });
  });

  document.querySelectorAll(".track-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.trackFilter = btn.dataset.track;
      document.querySelectorAll(".track-chip").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });
      renderSidebar();
      if (!state.activeItemId) {
        renderHomeCatalog();
      }
    });
  });

  globalSearchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    if (state.activeItemId && state.searchQuery.trim().length > 1) {
      window.location.hash = "#home";
    } else {
      renderSidebar();
      renderHomeCatalog();
    }
  });

  clearSearchBtn.addEventListener("click", () => {
    state.searchQuery = "";
    state.horizonFilter = "all";
    state.trackFilter = "all";
    globalSearchInput.value = "";
    document.querySelectorAll(".horizon-pill").forEach((b) => {
      b.classList.toggle("active", b.dataset.horizon === "all");
    });
    document.querySelectorAll(".track-chip").forEach((b) => {
      b.classList.toggle("active", b.dataset.track === "all");
    });
    renderSidebar();
    renderHomeCatalog();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== globalSearchInput) {
      e.preventDefault();
      globalSearchInput.focus();
    }
  });

  backToAtlasBtn.addEventListener("click", () => {
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

  tocListEl.addEventListener("click", (e) => {
    const link = e.target.closest("[data-scroll-to]");
    if (!link) return;
    e.preventDefault();
    const targetEl = document.getElementById(link.dataset.scrollTo);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  mobileMenuBtn.addEventListener("click", () => {
    sidebarEl.classList.toggle("open");
  });

  // Initial render
  parseHashAndRoute();
})();
