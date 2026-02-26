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
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
        return;
      }
      if (typeof window.plausible === "function") {
        window.plausible(eventName, { props: params });
        return;
      }
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: eventName, ...params });
        return;
      }
      console.debug("[analytics]", eventName, params);
    } catch {
      // swallow
    }
  };

  track("page_view", { path: location.pathname, title: document.title });

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
    if (trackEl.firstElementChild) {
      trackEl.appendChild(trackEl.firstElementChild.cloneNode(true));
    }
  };

  const startRotator = () => {
    if (rotatorStarted) return;
    if (!timed4 || !adjTrack || !countryTrack) return;
    rotatorStarted = true;

    const adjectives = ["Quiet", "Hidden", "After-dark"];
    const placesRest = shuffleInPlace(["Angkor", "Cambodia"]);
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
          trackEl.offsetHeight;
          trackEl.style.transition = "transform 520ms cubic-bezier(.22,.9,.26,1)";
        }, moveDuration + 30);
        return 0;
      }
      return index;
    };

    adjTrack.style.transform = "translateY(0em)";
    countryTrack.style.transform = "translateY(0em)";

    window.setTimeout(() => {
      placeIndex = 1;
      move(countryTrack, placeIndex);
    }, delayBetween);

    const cycle = () => {
      adjIndex += 1;
      move(adjTrack, adjIndex);
      adjIndex = snapIfNeeded(adjTrack, adjIndex, adjectives.length);

      window.setTimeout(() => {
        placeIndex += 1;
        move(countryTrack, placeIndex);
        placeIndex = snapIfNeeded(countryTrack, placeIndex, places.length);
      }, delayBetween);
    };

    window.setInterval(cycle, cycleMs);
  };

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
  // Scroll reveal animations
  // -------------------------
  const revealTargets = [
    ...qsa("[data-reveal]"),
    ...qsa(".paper, .paper-card, .paper-note, .paper-actions, .tile, .section, .callout"),
  ].filter((el, idx, arr) => arr.indexOf(el) === idx);

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
      [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0px)" }],
      { duration: 520, easing: "cubic-bezier(.22,.9,.26,1)", fill: "both" }
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
        { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
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
    navPanel.classList.add("is-open");
    navToggle?.setAttribute("aria-expanded", "true");
    drawerState.open = true;
    track("nav_open", { path: location.pathname });
  };

  const closeDrawer = () => {
    if (!navPanel) return;
    navPanel.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
    drawerState.open = false;

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
      if (item.classList.contains("is-open")) return; // second click navigates
      e.preventDefault();
      closeAllDropdowns();
      item.classList.add("is-open");
    });
  });

  document.addEventListener("click", (e) => {
    const clickedDropdownItem = e.target?.closest?.(".nav-item.has-dropdown");
    const clickedDropdownPanel = e.target?.closest?.(".dropdown");
    if (!clickedDropdownItem && !clickedDropdownPanel) closeAllDropdowns();
  });

  // -------------------------
  // Compact header on scroll (45px)
  // -------------------------
  const headerEl = qs(".site-header");
  let lastCompact = null;
  let ticking = false;

  const computeCompact = () => {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    return y > 40; // adjust trigger if you want earlier/later
  };

  const applyCompact = () => {
    ticking = false;
    if (!headerEl) return;

    const shouldCompact = computeCompact();
    if (shouldCompact === lastCompact) return;

    lastCompact = shouldCompact;
    headerEl.classList.toggle("is-compact", shouldCompact);
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(applyCompact);
    },
    { passive: true }
  );

  // Set initial state (if page loads scrolled)
  applyCompact();

  // -------------------------
  // Global ESC + outside click
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