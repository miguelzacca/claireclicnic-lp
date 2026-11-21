import { prepareMovie } from "./video.js";

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

function ease(progress, from, to) {
  const t = clamp((progress - from) / (to - from));
  return t * t * (3 - 2 * t);
}

export function mountContactFilm(backdrop) {
  const camera = backdrop.querySelector(".contact-film-camera");
  const video = backdrop.querySelector("video");
  if (!video.dataset.src) return;

  const stage = backdrop.closest(".contact-stage");
  const story = stage.closest(".contact-story");
  const team = stage.querySelector(".team");
  const contact = stage.querySelector(".visit");
  const stills = backdrop.querySelectorAll("img");
  const motion = matchMedia("(prefers-reduced-motion: no-preference) and (min-height: 31.5rem)");
  const narrow = matchMedia("(max-width: 47rem)");
  const movie = prepareMovie(video, 24, (ready) => backdrop.classList.toggle("has-movie", ready));
  let origin = 0;
  let range = 1;
  let stageHeight = 0;
  let previous;

  function mediaPath(element) {
    return (narrow.matches && element.dataset.mobile) || element.dataset.src;
  }

  function render(scrollPosition) {
    if (backdrop.hidden) return;

    const offset = scrollPosition - origin;
    if (!navigator.connection?.saveData && offset > -stageHeight * 1.35 && offset < range + stageHeight) {
      movie.setSource(mediaPath(video));
    }
    const progress = clamp(offset / range);
    if (progress === previous) return;
    previous = progress;

    const frame = clamp((progress - .035) / .865);
    // The light in the take reaches the water before the contact details come in.
    const teamExit = ease(progress, .43, .595);
    const arrival = ease(progress, .65, .82);
    const cameraPush = ease(progress, .09, .45) * (1 - ease(progress, .55, .89));
    movie.render(frame);

    const properties = {
      "--contact-film-progress": progress,
      "--contact-footage-alpha": ease(progress, .045, .115) * (1 - ease(progress, .935, .995)),
      "--contact-film-impact": ease(progress, .17, .38),
      "--contact-film-ending": ease(progress, .56, .84),
      "--contact-dolly": 1 + .10 * cameraPush,
      "--contact-shade-alpha": 1 - ease(progress, .47, .76),
      "--contact-daylight": (100 * ease(progress, .59, .79)) + "%",
      "--contact-team-alpha": 1 - teamExit,
      "--contact-team-y": (-1.45 * teamExit) + "rem",
      "--contact-visit-alpha": arrival,
      "--contact-visit-y": (1.7 * (1 - arrival)) + "rem",
    };
    for (const [name, value] of Object.entries(properties)) stage.style.setProperty(name, value);
    team.inert = progress >= .55;
    contact.inert = progress < .77;
  }

  function measure() {
    if (backdrop.hidden) return;

    const inset = Number.parseFloat(getComputedStyle(stage).top) || 0;
    origin = story.getBoundingClientRect().top + scrollY - inset;
    stageHeight = stage.offsetHeight;
    range = Math.max(1, story.offsetHeight - stageHeight);

    // Keep the drop fixed as the framing moves in at impact.
    const [width, height, impactX, impactY] = narrow.matches
      ? [448, 896, .50, .521]
      : [1280, 720, .518, .546];
    const cover = Math.max(camera.offsetWidth / width, camera.offsetHeight / height);
    const x = camera.offsetWidth / 2 + (impactX - .5) * width * cover;
    const y = camera.offsetHeight / 2 + (impactY - .5) * height * cover;
    stage.style.setProperty("--contact-camera-origin", x + "px " + y + "px");
    previous = undefined;
    render(scrollY);
  }

  function disable() {
    backdrop.hidden = true;
    story.classList.remove("has-contact-film");
    stage.removeAttribute("style");
    movie.setSource("");
    team.inert = false;
    contact.inert = false;
  }

  function configure() {
    if (!motion.matches || !CSS.supports("mask-image", "linear-gradient(black, transparent)")) {
      disable();
      return;
    }

    story.classList.add("has-contact-film");
    const stageLimit = Number.parseFloat(getComputedStyle(stage).minBlockSize);
    if (stage.offsetHeight > stageLimit + 2) {
      disable();
      return;
    }

    backdrop.hidden = false;
    for (const still of stills) {
      const source = mediaPath(still);
      if (still.getAttribute("src") === source) continue;
      still.hidden = false;
      still.src = source;
    }
    measure();
  }

  function destination(hash) {
    if (hash === "#" + contact.id) return contact;
    if (hash === "#" + team.id || hash === "#" + story.id) return team;
    return null;
  }

  function jump(target, focus) {
    measure();
    scrollTo({ top: origin + (target === contact ? range : 0), behavior: "instant" });
    render(scrollY);
    if (focus) target.focus({ preventScroll: true });
  }

  document.addEventListener("click", (event) => {
    if (backdrop.hidden || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const hash = event.target.closest('a[href^="#"]')?.getAttribute("href");
    const target = destination(hash);
    if (!target) return;

    event.preventDefault();
    if (location.hash !== hash) history.pushState(history.state, "", hash);
    jump(target, true);
  });

  function followHash() {
    const target = destination(location.hash);
    if (!target) return;
    if (backdrop.hidden) target.scrollIntoView({ behavior: "instant" });
    else jump(target, false);
  }

  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    observer.observe(stage);
  }
  addEventListener("resize", configure);
  addEventListener("hashchange", followHash);
  addEventListener("pageshow", measure);
  motion.addEventListener("change", configure);
  narrow.addEventListener("change", configure);
  configure();
  if (destination(location.hash)) requestAnimationFrame(followHash);

  return render;
}

