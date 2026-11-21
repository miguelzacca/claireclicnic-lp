const clamp = (value) => Math.max(0, Math.min(1, value));
const firstFrameAt = .12;
const lastFrameAt = .79;
const choicesAt = .825;
const frameRate = 30;
const scrollKeys = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Tab"]);

function segment(progress, start, end) {
  const t = clamp((progress - start) / (end - start));
  return t * t * (3 - 2 * t);
}

function prepareMovie(video, track) {
  let source = "";
  let progress = 0;
  let seekTimeout;
  let broken = false;

  function fail() {
    if (!source || !video.hasAttribute("src")) return;
    clearTimeout(seekTimeout);
    broken = true;
    track.classList.remove("has-movie");
    video.removeAttribute("src");
    video.load();
  }

  function seek() {
    if (!source || broken || video.seeking || !video.seekable.length || !Number.isFinite(video.duration)) return;

    const lastFrame = Math.max(0, Math.round(video.duration * frameRate) - 1);
    const wantedFrame = Math.round(progress * lastFrame);
    const time = wantedFrame === 0 ? 0 : (wantedFrame + .06) / frameRate;
    if (Math.abs(video.currentTime - time) >= .5 / frameRate) {
      clearTimeout(seekTimeout);
      seekTimeout = setTimeout(fail, 2800);
      video.currentTime = time;
    } else if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      track.classList.add("has-movie");
    }
  }

  video.addEventListener("loadeddata", seek);
  video.addEventListener("progress", seek);
  video.addEventListener("seeked", () => {
    clearTimeout(seekTimeout);
    seek();
  });
  video.addEventListener("error", fail);

  return {
    setSource(nextSource) {
      if (nextSource === source) return;
      clearTimeout(seekTimeout);
      source = nextSource;
      broken = false;
      track.classList.remove("has-movie");
      video.preload = source ? "auto" : "none";
      if (source) {
        video.src = source;
      } else if (video.hasAttribute("src")) {
        video.removeAttribute("src");
        video.load();
      }
    },
    render(nextProgress) {
      if (nextProgress === progress) return;
      progress = nextProgress;
      seek();
    },
  };
}

export function mountFilm(track) {
  const stage = track.querySelector(".film-stage");
  const video = stage.querySelector(".scene-movie video");
  const deck = stage.querySelector(".scene-choices");
  const choiceTitle = deck.querySelector(".scene-choice-title");
  const copy = stage.querySelector(".hero-copy");
  const jump = copy.querySelector("[data-scene-jump]");
  const motion = matchMedia("(prefers-reduced-motion: no-preference) and (min-height: 31.5rem)");
  const wheel = matchMedia("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)");
  const narrow = matchMedia("(max-width: 47rem)");
  const movie = prepareMovie(video, track);
  let directed = false;
  let smoother;
  let introShown = false;
  let frame = 0;
  let range = 0;
  let origin = 0;
  let stageHeight = 0;
  let previous;

  function syncFocus(progress) {
    deck.inert = progress < choicesAt;
    copy.inert = progress >= .27 && !copy.contains(document.activeElement);
    track.classList.toggle("is-choosing", progress >= .27);
  }

  function syncMovie(progress, position) {
    // Load the selected film after the opening content, or as the visitor approaches the shot.
    const approaching = position <= origin + range + stageHeight;
    const readyToLoad = document.readyState === "complete" || progress > .025;
    if (approaching && readyToLoad && !navigator.connection?.saveData) {
      movie.setSource(narrow.matches ? video.dataset.mobile : video.dataset.desktop);
      movie.render(clamp((progress - firstFrameAt) / (lastFrameAt - firstFrameAt)));
    }
  }

  function paint(progress) {
    const camera = segment(progress, .055, .46);
    const ink = segment(progress, .12, .49);
    const print = segment(progress, .31, .675);
    const fold = segment(progress, .30, .79);
    const labels = segment(progress, .50, .79);
    const copyMove = segment(progress, .06, .265);
    const landing = segment(progress, .90, 1);
    const glassTurn = segment(progress, .055, .54);
    const glassFade = segment(progress, .44, .68);
    const movieExposure = segment(progress, .108, .174) * (1 - segment(progress, .777, .832));
    const movieCards = segment(progress, .754, .836);
    const movieLabels = segment(progress, .731, .822);
    const mobile = narrow.matches;

    const properties = {
      "--scene-progress": progress.toFixed(4),
      "--ink-fade": ink.toFixed(3),
      "--paper-visibility": (1 - ink).toFixed(3),
      "--portrait-opacity": (1 - print).toFixed(3),
      "--portrait-transform": "translate3d(" + (-(mobile ? 15 : 49) * camera) + "%," + ((mobile ? 11 : 1) * camera) + "%,0) rotateY(" + (-23 * camera) + "deg) rotateZ(" + (-8 * camera) + "deg) scale(" + (1 + .48 * camera) + ")",
      "--glass-transform": "perspective(800px) translate3d(" + ((mobile ? -66 : 54) * glassTurn) + "%," + ((mobile ? 56 : 14) * glassTurn) + "%,0) rotateY(" + (69 * glassTurn) + "deg) rotateZ(" + (-9 + 56 * glassTurn) + "deg) scale(" + (1 + .82 * glassTurn) + ")",
      "--glass-opacity": (1 - glassFade).toFixed(3),
      "--movie-glass-opacity": (1 - segment(progress, .146, .268)).toFixed(3),
      "--movie-alpha": movieExposure.toFixed(3),
      "--movie-cards": movieCards.toFixed(3),
      "--movie-label": movieLabels.toFixed(3),
      "--movie-lift": (.8 * (1 - movieLabels)).toFixed(3) + "rem",
      "--copy-opacity": (1 - copyMove).toFixed(3),
      "--copy-transform": "translate3d(" + (mobile ? 0 : -4.4 * copyMove) + "vw," + (-2.5 * copyMove) + "rem,0)",
      "--cards-opacity": segment(progress, .29, .52).toFixed(3),
      "--scene-angle": (79 * (1 - fold)).toFixed(2) + "deg",
      "--choice-label": labels.toFixed(3),
      "--choice-lift": (.95 * (1 - labels)).toFixed(3) + "rem",
      "--deck-transform": "translate3d(0," + (-1.05 * landing) + "rem,0) scale(" + (1 - .026 * landing) + ")",
      "--landing-travel": (105 * (1 - landing)).toFixed(2) + "%",
      "--rail-opacity": (1 - segment(progress, .045, .19)).toFixed(3),
      "--meter-grow": (.13 + .87 * progress).toFixed(3),
    };
    for (const [name, value] of Object.entries(properties)) stage.style.setProperty(name, value);
    syncFocus(progress);
    if (progress > .012) track.classList.remove("film-intro");
  }

  function draw(time) {
    frame = 0;
    smoother?.raf(time);

    if (directed) {
      const position = scrollY;
      const progress = clamp((position - origin) / range);
      if (previous !== progress) {
        previous = progress;
        paint(progress);
        syncMovie(progress, position);
      }
    }
    if (smoother) schedule();
  }

  function schedule() {
    if ((directed || smoother) && !frame && !document.hidden) frame = requestAnimationFrame(draw);
  }

  function measure() {
    if (!directed) return;
    const inset = Number.parseFloat(getComputedStyle(stage).top) || 0;
    origin = track.getBoundingClientRect().top + scrollY - inset;
    stageHeight = stage.offsetHeight;
    range = Math.max(1, track.offsetHeight - stageHeight);
    previous = undefined;
    schedule();
  }

  function configure() {
    const enabled = motion.matches;
    if (enabled === directed) return;
    directed = enabled;
    track.classList.toggle("is-directed", directed);
    if (!directed) {
      movie.setSource("");
      track.classList.remove("film-intro", "is-choosing");
      stage.removeAttribute("style");
      copy.inert = false;
      deck.inert = true;
      return;
    }

    for (const image of deck.querySelectorAll("img")) image.loading = "eager";
    if (!introShown && scrollY < 2 && !location.hash && performance.now() < 1000) {
      track.classList.add("film-intro");
    }
    introShown = true;
    measure();
  }

  async function configureWheel() {
    if (!wheel.matches) {
      smoother?.destroy();
      smoother = undefined;
      return;
    }
    const { default: Lenis } = await import("./assets/vendor/lenis-1.3.27.mjs").catch(() => ({}));
    if (!Lenis || !wheel.matches || smoother) return;
    smoother = new Lenis({
      autoRaf: false,
      lerp: .115,
      smoothWheel: true,
      syncTouch: false,
      stopInertiaOnNavigate: true,
      virtualScroll: ({ event }) => !event.shiftKey,
    });
    schedule();
  }

  function stopInertia() {
    if (smoother?.isScrolling !== "smooth") return;
    smoother.stop();
    smoother.start();
  }

  jump.addEventListener("click", (event) => {
    if (!directed || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    const top = origin + range * .861;
    if (event.detail === 0) {
      scrollTo({ top, behavior: "instant" });
      syncFocus(.861);
      choiceTitle.focus({ preventScroll: true });
    } else if (smoother) {
      smoother.scrollTo(top, { duration: 1.05, easing: (t) => 1 - (1 - t) ** 3 });
    } else {
      scrollTo({ top, behavior: "smooth" });
    }
  });

  stage.addEventListener("animationend", (event) => {
    if (event.animationName === "glass-enter") track.classList.remove("film-intro");
  });

  if (typeof ResizeObserver === "function") {
    const geometry = new ResizeObserver(measure);
    geometry.observe(track);
    geometry.observe(stage);
  }
  addEventListener("keydown", (event) => {
    if (!event.defaultPrevented && scrollKeys.has(event.key)) stopInertia();
  });
  addEventListener("click", (event) => {
    if (event.target.closest('a[href^="#"]')) stopInertia();
  }, { capture: true });
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", measure);
  addEventListener("load", measure, { once: true });
  addEventListener("pageshow", measure);
  document.addEventListener("visibilitychange", schedule);
  motion.addEventListener("change", configure);
  narrow.addEventListener("change", measure);
  wheel.addEventListener("change", configureWheel);
  configure();
  configureWheel();
}
