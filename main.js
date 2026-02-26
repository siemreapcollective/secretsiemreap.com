(() => {
  // -------------------------
  // Utilities
  // -------------------------
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // -------------------------
  // Analytics (lightweight + graceful)
  // -------------------------
  const track = (eventName, params = {}) => {
    try {
      // Google Analytics (gtag)
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
        return;
      }

      // Plausible
      if (typeof window.plausible === "function") {
        window.plausible(eventName, { props: params });
        return;
      }

      // Google Tag Manager / generic dataLayer
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: eventName, ...params });
        return;
      }

      // Safe fallback (no-op in production; helpful during setup)
      // eslint-disable-next-line no-console
      console.debug("[analytics]", eventName, params);
    } catch {
      // swallow
    }
  };

  // Track a basic page view (safe to keep even before analytics is installed)
  track("page_view", {
    path: location.pathname,
    title: document.title,
  });

  // Track CTA clicks (anything with data-cta)
  document.addEventListener("click", (e) => {
    const a = e.target?.closest?.("a[data-cta]");
    if (!a) return;

    track("cta_click", {
      cta: a.getAttribute("data-cta") || "",
      href: a.getAttribute("href") || "",
      path: location.pathname,
    });
  });

  // -------------------------
  // Hero timed reveal
  // -------------------------
  const timed1 = qs("#timed1");
  const timed2 = qs("#timed2");
  const timed3 = qs("#timed3");
  const timed4 = qs("#timed4");

  const show = (el) => el && el.classList.add("is-visible");
  const hide = (el) => el && el.classList.remove("is-visible");

  [timed1, timed2, timed3, timed4].forEach(hide);

  window.addEventListener("load", () => {
    window.setTimeout(() => show(timed1), 400);
    window.setTimeout(() => show(timed2), 1900);
    window.setTimeout(() => show(timed3), 3400);
    window.setTimeout(() => show(timed4), 4900);
  });

  // -------------------------
  // Hero rotator (word roll)
  // -------------------------
  const adjTrack = qs("#adjTrack");
  const countryTrack = qs("#countryTrack");
  let rotatorStarted = false;

  const shuffleInPlace = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const buildTrack = (trackEl, items) => {
    if (!trackEl) return;
    trackEl.innerHTML = "";
    items.forEach((text) => {
      const span = document.createElement("span");
      span.className = "word-roller__word";
      span.textContent = text;
      trackEl.appendChild(span);
    });
    // Clone first item for seamless wrap
    if (trackEl.firstElementChild) {
      trackEl.appendChild(trackEl.firstElementChild.cloneNode(true));
    }
  };

  const startRotator = () => {
    if (rotatorStarted) return;
    if (!timed4 || !adjTrack || !countryTrack) return;
    rotatorStarted = true;

    // Curated terms for Secret Siem Reap
    const adjectives = ["Quiet", "Hidden", "After-dark"];
    const placesRest = shuffleInPlace(["Angkor", "Cambodia"]);
    // Start blank so the first visible location appears after 1.5s
    const places = ["", "Siem Reap", ...placesRest];

    buildTrack(adjTrack, adjectives);
    buildTrack(countryTrack, places);

    let adjIndex = 0;
    let placeIndex = 0;

    const moveDuration = 520;
    const delayBetween = 1500;
    const cycleMs = 4200;

    const move = (trackEl, index) => {
      trackEl.style.transform = `translateY(${-index}em)`;
      timed4.classList.add("is-moving");
      window.setTimeout(() => timed4.classList.remove("is-moving"), moveDuration + 80);
    };

    const snapIfNeeded = (trackEl, index, length) => {
      if (index === length) {
        window.setTimeout(() => {
          trackEl.style.transition = "none";
          trackEl.style.transform = "translateY(0em)";
          // force reflow
          trackEl.offsetHeight;
          trackEl.style.transition = "transform 520ms cubic-bezier(.22,.9,.26,1)";
        }, moveDuration + 30);
        return 0;
      }
      return index;
    };

    // init
    adjTrack.style.transform = "translateY(0em)";
    countryTrack.style.transform = "translateY(0em)";

    // First location appears after 1.5s: "" -> Siem Reap
    window.setTimeout(() => {
      placeIndex = 1;
      move(countryTrack, placeIndex);
    }, delayBetween);

    const cycle = () => {
      // adjective now
      adjIndex += 1;
      move(adjTrack, adjIndex);
      adjIndex = snapIfNeeded(adjTrack, adjIndex, adjectives.length);

      // location after 1.5s
      window.setTimeout(() => {
        placeIndex += 1;
        move(countryTrack, placeIndex);
        placeIndex = snapIfNeeded(countryTrack, placeIndex, places.length);
      }, delayBetween);
    };

    window.setInterval(cycle, cycleMs);
  };

  // Start rotator when timed4 becomes visible
  if (timed4 && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          startRotator();
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(timed4);
  } else {
    startRotator();
  }

  // -------------------------
  // Scroll reveal animations (no CSS changes needed)
  // -------------------------
  const revealTargets = [
    ...qsa("[data-reveal]"),
    ...qsa(".paper, .paper-card, .paper-note, .paper-actions, .tile, .section, .callout"),
  ].filter((el, idx, arr) => arr.indexOf(el) === idx); // dedupe

  const prefersReducedMotion = (() => {
    try {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  })();

  const animateIn = (el) => {
    if (!el || el.dataset.revealed === "1") return;
    el.dataset.revealed = "1";

    if (prefersReducedMotion) return;

    el.animate(
      [
        { opacity: 0, transform: "translateY(10px)" },
        { opacity: 1, transform: "translateY(0px)" },
      ],
      {
        duration: 520,
        easing: "cubic-bezier(.22,.9,.26,1)",
        fill: "both",
      }
    );
  };

  if (revealTargets.length) {
    if ("IntersectionObserver" in window) {
      const rio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateIn(entry.target);
              rio.unobserve(entry.target);
            }
          });
        },
        { root: null, threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
      );

      revealTargets.forEach((el) => rio.observe(el));
    } else {
      revealTargets.forEach(animateIn);
    }
  }

  // -------------------------
  // Mobile nav drawer
  // -------------------------
  const navToggle = qs(".nav-toggle");
  const navPanel = qs("#nav-panel");
  const drawerState = { open: false };

  const openDrawer = () => {
    if (!navPanel) return;
    navPanel.hidden = false;
    navPanel.classList.add("is-open"); // required for slide-in CSS
    navToggle?.setAttribute("aria-expanded", "true");
    drawerState.open = true;
    track("nav_open", { path: location.pathname });
  };

  const closeDrawer = () => {
    if (!navPanel) return;
    navPanel.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
    drawerState.open = false;

    // Wait for slide-out transition, then hide (prevents click-through)
    window.setTimeout(() => {
      if (!drawerState.open) navPanel.hidden = true;
    }, 260);
  };

  navToggle?.addEventListener("click", () => {
    drawerState.open ? closeDrawer() : openDrawer();
  });

  // -------------------------
  // Desktop dropdowns: click-to-open + hover still works
  // -------------------------
  const dropdownItems = qsa(".nav-item.has-dropdown");
  const closeAllDropdowns = () => dropdownItems.forEach((i) => i.classList.remove("is-open"));

  dropdownItems.forEach((item) => {
    const link = qs(".top-link", item);
    if (!link) return;

    link.addEventListener("click", (e) => {
      // If it's already open, allow navigation on second click
      if (item.classList.contains("is-open")) return;

      // First click opens the dropdown instead of navigating
      e.preventDefault();

      // Close others, open this one
      closeAllDropdowns();
      item.classList.add("is-open");
    });
  });

  // Close dropdowns on outside click (but ignore clicks inside dropdown)
  document.addEventListener("click", (e) => {
    const clickedDropdownItem = e.target?.closest?.(".nav-item.has-dropdown");
    const clickedDropdownPanel = e.target?.closest?.(".dropdown");

    if (!clickedDropdownItem && !clickedDropdownPanel) {
      closeAllDropdowns();
    }
  });

  // -------------------------
  // Global ESC + outside click handling
  // -------------------------
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllDropdowns();
      closeDrawer();
    }
  });

  document.addEventListener("click", (e) => {
    if (!drawerState.open) return;
    const isInside = navPanel?.contains(e.target) || navToggle?.contains(e.target);
    if (!isInside) closeDrawer();
  });

  // -------------------------
  // Auto year in footer
  // -------------------------
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();