const clamp = (value) => Math.max(0, Math.min(1, value));

function segment(progress, start, end) {
  const t = clamp((progress - start) / (end - start));
  return t * t * (3 - 2 * t);
}

export function mountFilm(track) {
  const stage = track.querySelector(".film-stage");
  const deck = stage.querySelector(".scene-choices");
  const choiceTitle = deck.querySelector(".scene-choice-title");
  const copy = stage.querySelector(".hero-copy");
  const jump = copy.querySelector("[data-scene-jump]");
  const sceneImages = [...stage.querySelectorAll(".scene-portrait img, .scene-card img")];
  const motion = matchMedia("(prefers-reduced-motion: no-preference) and (min-height: 31.5rem)");
  const narrow = matchMedia("(max-width: 47rem)");
  let directed = false;
  let introShown = false;
  let pendingFocus = false;
  let frame = 0;
  let range = 0;
  let origin = 0;
  let previous;

  function syncFocus(progress) {
    const revealed = progress >= .635;
    deck.inert = !revealed;
    if (revealed && pendingFocus) {
      pendingFocus = false;
      choiceTitle.focus({ preventScroll: true });
    }
    copy.inert = progress >= .29 && !copy.contains(document.activeElement);
    track.classList.toggle("is-choosing", progress >= .29);
  }

  // The portrait and the glass cross before the two book leaves unfold from their common spine.
  function paint(progress) {
    const camera = segment(progress, .06, .45);
    const ink = segment(progress, .12, .48);
    const print = segment(progress, .31, .632);
    const fold = segment(progress, .27, .69);
    const labels = segment(progress, .465, .695);
    const copyMove = segment(progress, .065, .31);
    const landing = segment(progress, .84, 1);
    const glassTurn = segment(progress, .055, .52);
    const glassFade = segment(progress, .43, .665);
    const mobile = narrow.matches;
    const properties = {
      "--scene-progress": progress.toFixed(4),
      "--ink-fade": ink.toFixed(3),
      "--paper-visibility": (1 - ink).toFixed(3),
      "--portrait-opacity": (1 - print).toFixed(3),
      "--portrait-transform": "translate3d(" + (-(mobile ? 15 : 49) * camera) + "%," + ((mobile ? 11 : 1) * camera) + "%,0) rotateY(" + (-23 * camera) + "deg) rotateZ(" + (-8 * camera) + "deg) scale(" + (1 + .48 * camera) + ")",
      "--glass-transform": "perspective(800px) translate3d(" + ((mobile ? -66 : 55) * glassTurn) + "%," + ((mobile ? 56 : 14) * glassTurn) + "%,0) rotateY(" + (69 * glassTurn) + "deg) rotateZ(" + (-9 + 56 * glassTurn) + "deg) scale(" + (1 + .82 * glassTurn) + ")",
      "--glass-opacity": (1 - glassFade).toFixed(3),
      "--copy-opacity": (1 - copyMove).toFixed(3),
      "--copy-transform": "translate3d(" + (mobile ? 0 : -5.2 * copyMove) + "vw," + (-3.4 * copyMove) + "rem,0)",
      "--cards-opacity": segment(progress, .255, .43).toFixed(3),
      "--scene-angle": (79 * (1 - fold)).toFixed(2) + "deg",
      "--choice-label": labels.toFixed(3),
      "--choice-lift": (.95 * (1 - labels)).toFixed(3) + "rem",
      "--deck-transform": "translate3d(0," + (-1.2 * landing) + "rem,0) scale(" + (1 - .037 * landing) + ")",
      "--landing-travel": (105 * (1 - landing)).toFixed(2) + "%",
      "--rail-opacity": (1 - segment(progress, .07, .225)).toFixed(3),
      "--meter-grow": (.13 + .87 * progress).toFixed(3),
    };
    for (const [name, value] of Object.entries(properties)) stage.style.setProperty(name, value);
    syncFocus(progress);
    if (progress > .012) track.classList.remove("film-intro");
  }

  function draw() {
    frame = 0;
    const progress = clamp((scrollY - origin) / range);
    if (previous === progress) return;
    previous = progress;
    paint(progress);
  }

  function schedule() {
    if (directed && !frame && !document.hidden) frame = requestAnimationFrame(draw);
  }

  function measure() {
    if (!directed) return;
    const inset = Number.parseFloat(getComputedStyle(stage).top) || 0;
    origin = track.getBoundingClientRect().top + scrollY - inset;
    range = Math.max(1, track.offsetHeight - stage.offsetHeight);
    previous = undefined;
    schedule();
  }

  function configure() {
    const enabled = motion.matches && !sceneImages.some((image) => image.hidden);
    if (enabled === directed) return;
    directed = enabled;
    track.classList.toggle("is-directed", directed);
    if (!directed) {
      cancelAnimationFrame(frame);
      frame = 0;
      pendingFocus = false;
      track.classList.remove("film-intro", "is-choosing");
      stage.removeAttribute("style");
      copy.inert = false;
      deck.inert = true;
      return;
    }

    for (const image of sceneImages) image.loading = "eager";
    if (!introShown && scrollY < 2 && !location.hash && performance.now() < 1400) {
      track.classList.add("film-intro");
    }
    introShown = true;
    measure();
  }

  jump.addEventListener("click", (event) => {
    if (!directed || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    pendingFocus = event.detail === 0;
    scrollTo({ top: origin + range * .735, behavior: "smooth" });
  });

  stage.addEventListener("animationend", (event) => {
    if (event.animationName === "glass-enter") track.classList.remove("film-intro");
  });

  if (typeof ResizeObserver === "function") {
    const geometry = new ResizeObserver(measure);
    geometry.observe(track);
    geometry.observe(stage);
  }
  for (const image of sceneImages) image.addEventListener("error", configure, { once: true });
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", measure);
  addEventListener("pageshow", measure);
  document.addEventListener("visibilitychange", schedule);
  motion.addEventListener("change", configure);
  narrow.addEventListener("change", measure);
  configure();
}

