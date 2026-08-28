(() => {
  const toc = document.querySelector(".document-toc");
  const mobile = window.matchMedia("(max-width: 900px)");
  if (toc) {
    const setToc = () => { toc.open = !mobile.matches; };
    setToc();
    mobile.addEventListener("change", setToc);
    toc.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = document.getElementById(link.hash.slice(1));
        if (!target) return;
        event.preventDefault();
        if (mobile.matches) toc.open = false;
        history.replaceState(null, "", link.hash);
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: "start" });
      });
    });

    const sections = [...document.querySelectorAll(".legal-section h2")];
    let scheduled = false;
    const updateCurrent = () => {
      scheduled = false;
      const current = sections.filter((section) => section.getBoundingClientRect().top <= 120).at(-1);
      toc.querySelectorAll("a").forEach((link) => {
        if (current && link.hash === `#${current.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };
    window.addEventListener("scroll", () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(updateCurrent);
      }
    }, { passive: true });
    updateCurrent();
    // Collapsing the mobile contents changes layout before a deep-link destination.
    if (/^#section-\d+$/.test(location.hash)) requestAnimationFrame(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start" });
    });
  }
  const print = document.querySelector("[data-print]");
  if (print) {
    print.hidden = false;
    print.addEventListener("click", () => window.print());
  }
})();
