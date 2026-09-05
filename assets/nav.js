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
    if (hash === "#top") return document.querySelector("#cover") || document.querySelector("#top");
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

  window.addEventListener("resize", () => {
    const current = pill.querySelector("[aria-current='page']");
    if (current) moveIndicator(current);
  });

  const slides = [...document.querySelectorAll(".slide")];
  if (!slides.length) {
    const hash = location.hash;
    const match = links.find((link) => pageHash(link) === hash);
    setCurrent(match || links.find(isHomeLink) || links[0]);
    return;
  }

  const prevBtn = document.querySelector("[data-deck='prev']");
  const nextBtn = document.querySelector("[data-deck='next']");
  const progress = document.querySelector(".deck-progress");
  const pad = (value) => String(value).padStart(2, "0");

  let index = Math.max(0, slides.findIndex((slide) => slide.id && `#${slide.id}` === location.hash));
  if (index < 0) index = 0;
  let busyUntil = 0;

  function updateChrome() {
    const slide = slides[index];
    setCurrent(linkForNav(slide.dataset.nav || "cover"));
    if (progress) progress.textContent = `${pad(index + 1)} / ${pad(slides.length)}`;
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === slides.length - 1;
  }

  function showSlide(next, { historyMode = "push" } = {}) {
    next = Math.max(0, Math.min(next, slides.length - 1));
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === next);
      if (i === next) slide.scrollTop = 0;
    });
    index = next;
    busyUntil = Date.now() + 420;
    updateChrome();

    const hash = `#${slides[index].id}`;
    if (location.hash !== hash) {
      if (historyMode === "replace") history.replaceState({ slide: index }, "", hash);
      else if (historyMode === "push") history.pushState({ slide: index }, "", hash);
    }
  }

  function step(delta) {
    if (Date.now() < busyUntil) return;
    showSlide(index + delta);
  }

  document.addEventListener("click", (event) => {
    const control = event.target.closest("[data-deck]");
    if (control) {
      event.preventDefault();
      step(control.getAttribute("data-deck") === "next" ? 1 : -1);
      return;
    }

    const link = event.target.closest("a[href]");
    if (!link) return;
    const target = resolveTarget(pageHash(link));
    if (!target || !target.classList.contains("slide")) return;
    event.preventDefault();
    showSlide(slides.indexOf(target));
  });

  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest("input, textarea, select, [contenteditable='true']")) return;

    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Spacebar"].includes(event.key)) {
      event.preventDefault();
      step(1);
    } else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(event.key)) {
      event.preventDefault();
      step(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      showSlide(0);
    } else if (event.key === "End") {
      event.preventDefault();
      showSlide(slides.length - 1);
    }
  });

  window.addEventListener("wheel", (event) => {
    const active = slides[index];
    if (!active) return;
    const scrolling = active.scrollHeight - active.clientHeight > 4;
    if (scrolling) {
      const atTop = active.scrollTop <= 2;
      const atBottom = active.scrollTop + active.clientHeight >= active.scrollHeight - 2;
      if ((event.deltaY < 0 && !atTop) || (event.deltaY > 0 && !atBottom)) return;
    }
    if (Math.abs(event.deltaY) < 24) return;
    event.preventDefault();
    step(event.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  let touchStartY = 0;
  window.addEventListener("touchstart", (event) => {
    touchStartY = event.changedTouches[0]?.clientY || 0;
  }, { passive: true });
  window.addEventListener("touchend", (event) => {
    const y = event.changedTouches[0]?.clientY || 0;
    const delta = touchStartY - y;
    if (Math.abs(delta) < 56) return;
    step(delta > 0 ? 1 : -1);
  }, { passive: true });

  window.addEventListener("popstate", () => {
    const slide = resolveTarget(location.hash || "#cover");
    const next = slide ? slides.indexOf(slide) : 0;
    showSlide(next < 0 ? 0 : next, { historyMode: "none" });
  });

  showSlide(index, { historyMode: location.hash ? "replace" : "replace" });
})();
