/* Homepage hero: layered parallax.
 * Each .hl layer carries data-depth. Positive depth lags behind the scroll
 * (reads as far away), negative depth runs ahead of it (reads as close).
 * The handset layer also drifts a few pixels toward the pointer on
 * devices that have one. Transforms only; nothing here touches layout.
 */
(function () {
  const hero = document.querySelector('.hero-scene');
  if (!hero) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return;

  const layers = Array.from(hero.querySelectorAll('.hl[data-depth]')).map((el) => ({
    el,
    depth: parseFloat(el.dataset.depth) || 0,
    tilt: el.dataset.tilt === '1',
  }));
  if (!layers.length) return;

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let scrollY = 0;
  let heroH = 1;
  let px = 0; // pointer offset, -1..1
  let py = 0;
  let tx = 0; // smoothed pointer offset
  let ty = 0;
  let ticking = false;
  let pointerActive = false;

  function measure() {
    heroH = hero.offsetHeight || 1;
  }

  function render() {
    ticking = false;
    // Progress through the hero: 0 at top of page, 1 once the hero has left.
    const p = Math.min(Math.max(scrollY / heroH, 0), 1.25);
    // total parallax distance budget in px; capped by the viewport so a tall
    // mobile hero doesn't lift the treeline off its ground
    const travel = Math.min(heroH, window.innerHeight || heroH) * 0.5;

    // ease the pointer target so the drift feels weighted, not twitchy
    tx += (px - tx) * 0.08;
    ty += (py - ty) * 0.08;

    for (const L of layers) {
      const y = p * travel * L.depth;
      let x = 0;
      let dy = 0;
      if (canHover) {
        // near layers move with the pointer, far layers against it, scaled by depth
        // (handsets sit between the near ridge and the treeline)
        const k = L.tilt ? 10 : -L.depth * 70;
        x = tx * k;
        dy = ty * k * 0.6;
      }
      L.el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + (y + dy).toFixed(2) + 'px,0)';
    }

    if (pointerActive && (Math.abs(px - tx) > 0.002 || Math.abs(py - ty) > 0.002)) request();
  }

  function request() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  function onScroll() {
    scrollY = window.scrollY || window.pageYOffset || 0;
    if (scrollY > heroH * 1.3) return; // hero is gone; skip work
    request();
  }

  function onPointer(e) {
    const r = hero.getBoundingClientRect();
    px = ((e.clientX - r.left) / r.width) * 2 - 1;
    py = ((e.clientY - r.top) / r.height) * 2 - 1;
    pointerActive = true;
    request();
  }

  function onLeave() {
    px = 0;
    py = 0;
    request();
  }

  measure();
  onScroll();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); request(); }, { passive: true });
  if (canHover) {
    hero.addEventListener('pointermove', onPointer, { passive: true });
    hero.addEventListener('pointerleave', onLeave, { passive: true });
  }

  // If the user flips reduced motion on mid-session, park every layer.
  reduce.addEventListener?.('change', (ev) => {
    if (ev.matches) {
      for (const L of layers) L.el.style.transform = '';
      window.removeEventListener('scroll', onScroll);
      hero.removeEventListener('pointermove', onPointer);
    }
  });
})();
