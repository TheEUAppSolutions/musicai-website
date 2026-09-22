(() => {
  document.documentElement.classList.remove("no-js");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header: glass once you scroll, burger menu on small screens. */
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", scrollY > 12);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const menu = document.querySelector(".menu-btn");
  menu?.addEventListener("click", () => {
    const open = header.classList.toggle("menu-open");
    menu.setAttribute("aria-expanded", open);
  });
  header.querySelectorAll(".nav-links a").forEach((a) => a.addEventListener("click", () => header.classList.remove("menu-open")));

  /* Reveal on scroll. */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* Hero field: one thick braid of waveform on the left that fans out into six
     separate lines on the right — the split, as a background. */
  const field = document.getElementById("field");
  if (field) {
    const g = field.getContext("2d");
    let w, h, dpr, t = 0, visible = true;
    const LINES = 6;
    const fit = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = field.clientWidth; h = field.clientHeight;
      field.width = w * dpr; field.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const frame = () => {
      g.clearRect(0, 0, w, h);
      const cy = h * 0.56;
      for (let k = 0; k < LINES; k++) {
        const spread = (k - (LINES - 1) / 2) * Math.min(h * 0.085, 70);
        const freq = 0.006 + k * 0.0017;
        const amp = 16 + k * 5;
        g.beginPath();
        for (let x = -10; x <= w + 10; x += 6) {
          const p = x / w;
          const fan = Math.pow(Math.max(0, (p - 0.18) / 0.82), 1.6);   // 0 on the left → 1 on the right
          const y = cy + spread * fan
            + Math.sin(x * freq + t * (0.9 + k * 0.17) + k) * amp * (0.35 + fan * 0.65)
            + Math.sin(x * 0.021 - t * 1.3 + k * 2) * 5;
          x < -4 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        const grad = g.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, "rgba(15,227,154,0)");
        grad.addColorStop(0.35, `rgba(15,227,154,${0.18 + k * 0.03})`);
        grad.addColorStop(1, `rgba(15,227,154,${0.35 + k * 0.08})`);
        g.strokeStyle = grad;
        g.lineWidth = k === 0 ? 2.2 : 1.4;
        g.shadowColor = "rgba(15,227,154,0.6)"; g.shadowBlur = 12;
        g.stroke();
      }
      t += 0.012;
      if (visible && !reduced) requestAnimationFrame(frame);
    };
    new IntersectionObserver(([e]) => {
      const was = visible; visible = e.isIntersecting;
      if (visible && !was && !reduced) requestAnimationFrame(frame);
    }).observe(field);
    addEventListener("resize", () => { fit(); if (reduced) frame(); });
    fit(); frame();
  }

  /* Feature scroller: whichever feature is centred drives the sticky phone. */
  const features = [...document.querySelectorAll(".feature")];
  const shots = document.querySelectorAll(".features-phone img");
  if (features.length && shots.length) {
    const fio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = features.indexOf(e.target);
      features.forEach((f, j) => f.classList.toggle("is-active", i === j));
      shots.forEach((s, j) => s.classList.toggle("is-active", i === j));
    }), { rootMargin: "-45% 0px -45% 0px" });
    features.forEach((f) => fio.observe(f));
  }

  /* DAW clips: seeded waveform shapes so they look like audio, not boxes. */
  document.querySelectorAll(".clip[data-wave]").forEach((clip, n) => {
    const kind = clip.dataset.wave, bars = 90;
    let seed = n * 97 + 13;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let d = "";
    for (let i = 0; i < bars; i++) {
      let v;
      if (kind === "click") v = i % 11 === 0 ? 0.9 : i % 11 < 2 ? 0.2 : 0.02;
      else if (kind === "drums") v = i % 6 === 0 ? 0.95 : 0.15 + rnd() * 0.25;
      else v = Math.abs(Math.sin(i * 0.31) * Math.sin(i * 0.07 + n)) * 0.75 + rnd() * 0.2;
      const hgt = Math.max(0.04, v) * 40;
      d += `M${i * 2 + 1} ${20 - hgt / 2}v${hgt}`;
    }
    clip.innerHTML = `<svg viewBox="0 0 ${bars * 2} 40" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" stroke="currentColor" stroke-width="1.1" fill="none"/></svg>`;
  });

  /* Final CTA equaliser. */
  const bars = document.querySelector(".cta .bars");
  if (bars) {
    const n = innerWidth < 620 ? 28 : 64;
    bars.innerHTML = Array.from({ length: n }, (_, i) =>
      `<i style="animation-delay:${(-Math.random() * 1.6).toFixed(2)}s;animation-duration:${(1.1 + Math.random() * 1.2).toFixed(2)}s;height:${(35 + Math.sin(i / 3) * 25 + Math.random() * 40).toFixed(0)}%"></i>`
    ).join("");
  }

  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
