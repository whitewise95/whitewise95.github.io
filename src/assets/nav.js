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
    return hash === "#top" || hash === "#" || href === "./" || href === "/" || href === ".";
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
    indicator.style.width = `${link.offsetWidth}px`;
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
    indicator.classList.add("is-ready");
  }

  function syncFromLocation() {
    const hash = location.hash;
    const match = links.find((link) => {
      const linkHash = pageHash(link);
      if (hash && linkHash === hash) return true;
      if (!hash || hash === "#top" || hash === "#") return isHomeLink(link);
      return false;
    });
    setCurrent(match || links.find(isHomeLink) || links[0]);
  }

  const sectionLinks = links
    .map((link) => {
      const hash = pageHash(link);
      const target = hash ? document.querySelector(hash) : null;
      return target ? { link, target } : null;
    })
    .filter(Boolean);

  let scrollFrame = 0;
  function syncFromScroll() {
    scrollFrame = 0;
    if (sectionLinks.length < 2) return;

    const marker = window.scrollY + Math.min(window.innerHeight * 0.28, 220);
    let current = sectionLinks[0];

    for (const item of sectionLinks) {
      const top = item.target.getBoundingClientRect().top + window.scrollY;
      if (top <= marker) current = item;
    }

    setCurrent(current.link);
  }

  pill.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || !pill.contains(link) || !pageHash(link)) return;
    setCurrent(link);
  });

  window.addEventListener("hashchange", syncFromLocation);
  window.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(syncFromScroll);
  }, { passive: true });
  window.addEventListener("resize", () => {
    const current = pill.querySelector("[aria-current='page']");
    if (current) moveIndicator(current);
  });

  syncFromLocation();
  syncFromScroll();
})();
