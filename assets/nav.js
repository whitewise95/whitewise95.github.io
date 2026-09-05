(() => {
  const pill = document.querySelector(".nav-pill");
  if (!pill) return;

  const links = [...pill.querySelectorAll("a[href]")];
  if (!links.length) return;

  let indicator = pill.querySelector(".nav-pill-indicator");
  if (!indicator) {
    indicator = document.createElement("span");
    indicator.className = "nav-pill-indicator";
    indicator.setAttribute("aria-hidden", "true");
    pill.prepend(indicator);
  }

  function pageHash(anchor) {
    try {
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname) return "";
      return url.hash;
    } catch {
      const href = anchor.getAttribute("href") || "";
      return href.startsWith("#") ? href : "";
    }
  }

  function isHomeLink(anchor) {
    const href = anchor.getAttribute("href") || "";
    const hash = pageHash(anchor);
    return hash === "#cover" || hash === "#top" || hash === "#" || href === "./" || href === "/" || href === ".";
  }

  function resolveTarget(hash) {
    if (!hash) return null;
    if (hash === "#top") {
      return document.querySelector("#cover") || document.querySelector("#top");
    }
    return document.querySelector(hash);
  }

  function setCurrent(link) {
    if (!link) return;
    for (const el of links) {
      if (el === link) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    }
    moveIndicator(link);
  }

  function moveIndicator(link) {
    const pillBox = pill.getBoundingClientRect();
    const linkBox = link.getBoundingClientRect();
    indicator.style.width = `${linkBox.width}px`;
    indicator.style.transform = `translateX(${linkBox.left - pillBox.left}px)`;
    indicator.classList.add("is-ready");
  }

  function navKey(hash) {
    if (!hash || hash === "#top" || hash === "#cover" || hash === "#about") return "cover";
    return hash.slice(1);
  }

  function linkForNav(key) {
    return links.find((link) => {
      const hash = pageHash(link);
      if (key === "cover") return isHomeLink(link);
      return navKey(hash) === key;
    }) || links[0];
  }

  function syncFromLocation() {
    const hash = location.hash;
    const slide = resolveTarget(hash);
    if (slide && slide.dataset && slide.dataset.nav) {
      setCurrent(linkForNav(slide.dataset.nav));
      return;
    }
    setCurrent(links.find(isHomeLink) || links[0]);
  }

  const slides = [...document.querySelectorAll(".slide[data-nav]")];

  let scrollFrame = 0;
  let lockUntil = 0;

  function syncFromScroll() {
    scrollFrame = 0;
    if (slides.length < 2) return;
    if (Date.now() < lockUntil) return;

    const marker = window.scrollY + window.innerHeight * 0.45;
    let current = slides[0];

    for (const slide of slides) {
      const top = slide.getBoundingClientRect().top + window.scrollY;
      if (top <= marker) current = slide;
    }

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0 && window.scrollY >= maxScroll - 8) {
      current = slides[slides.length - 1];
    }

    setCurrent(linkForNav(current.dataset.nav));
  }

  function scrollSlide(slide) {
    slide.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openSlide(slide, hash) {
    if (!slide) return;
    lockUntil = Date.now() + 900;
    setCurrent(linkForNav(slide.dataset.nav || "cover"));
    if (hash && location.hash !== hash) history.pushState(null, "", hash);
    scrollSlide(slide);
  }

  function goToSlide(index) {
    const target = slides[Math.max(0, Math.min(index, slides.length - 1))];
    if (!target) return;
    openSlide(target, `#${target.id}`);
  }

  function currentSlideIndex() {
    const marker = window.innerHeight * 0.45;
    let index = 0;
    slides.forEach((slide, i) => {
      if (slide.getBoundingClientRect().top <= marker) index = i;
    });
    return index;
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    const hash = pageHash(link);
    const target = resolveTarget(hash);
    if (!target || !target.classList.contains("slide")) return;
    event.preventDefault();
    openSlide(target, hash);
  });

  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = event.target.closest("input, textarea, select, [contenteditable='true']");
    if (tag) return;

    if (event.key === "ArrowDown" || event.key === "PageDown") {
      event.preventDefault();
      goToSlide(currentSlideIndex() + 1);
    } else if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      goToSlide(currentSlideIndex() - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goToSlide(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goToSlide(slides.length - 1);
    }
  });

  window.addEventListener("hashchange", () => {
    const slide = resolveTarget(location.hash);
    if (slide && slide.classList.contains("slide")) {
      lockUntil = Date.now() + 700;
      setCurrent(linkForNav(slide.dataset.nav || "cover"));
      scrollSlide(slide);
      return;
    }
    syncFromLocation();
  });
  window.addEventListener("popstate", () => {
    const slide = resolveTarget(location.hash || "#cover");
    if (!slide) return;
    lockUntil = Date.now() + 700;
    setCurrent(linkForNav(slide.dataset.nav || "cover"));
    scrollSlide(slide);
  });
  window.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(syncFromScroll);
  }, { passive: true });
  window.addEventListener("resize", () => {
    const current = pill.querySelector("[aria-current='page']");
    if (current) moveIndicator(current);
  });

  syncFromLocation();
  const initialSlide = resolveTarget(location.hash || "#cover");
  if (initialSlide && initialSlide.classList.contains("slide")) {
    lockUntil = Date.now() + 800;
    requestAnimationFrame(() => {
      scrollSlide(initialSlide);
    });
  } else {
    syncFromScroll();
  }
})();
