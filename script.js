import { mountFilm } from "./film.js";
import { mountContactFilm } from "./contact-film.js";

const menu = document.querySelector(".mobile-menu");
const menuToggle = menu.querySelector("summary");

menu.addEventListener("click", (event) => {
  const link = event.target.closest("nav a");
  if (!link) return;

  menu.open = false;
  if (link.target === "_blank") menuToggle.focus({ preventScroll: true });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !menu.open) return;

  menu.open = false;
  menuToggle.focus({ preventScroll: true });
});

function closeMenuOutside(event) {
  if (menu.open && !menu.contains(event.target)) menu.open = false;
}

document.addEventListener("pointerdown", closeMenuOutside);
document.addEventListener("focusin", closeMenuOutside);

for (const picture of document.querySelectorAll("main img")) {
  const showFallback = () => { picture.hidden = true; };
  picture.addEventListener("error", showFallback, { once: true });
  if (picture.hasAttribute("src") && picture.complete && !picture.naturalWidth) showFallback();
}
document.documentElement.classList.add("js-ready");
const renderContactFilm = mountContactFilm(document.querySelector("[data-contact-film]"));
mountFilm(document.querySelector("[data-film]"), renderContactFilm);

const tabs = document.querySelector(".care-tabs");
const controls = [...tabs.querySelectorAll("[data-care-tab]")];
const panels = controls.map((button) => document.getElementById(button.dataset.careTab));
let activeCare;

function selectCare(id, animate = false) {
  if (activeCare === id || !panels.some((panel) => panel.id === id)) return;
  activeCare = id;

  controls.forEach((button, index) => {
    const panel = panels[index];
    const selected = id === panel.id;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    panel.hidden = !selected;
    panel.classList.toggle("is-switching", selected && animate);
  });
}

function selectFromHash() {
  selectCare(location.hash.slice(1));
}

function changeTab(button) {
  const id = button.dataset.careTab;
  selectCare(id, true);
  if (panels.some((panel) => location.hash === "#" + panel.id)) {
    history.replaceState(history.state, "", "#" + id);
  }
}

for (const [index, button] of controls.entries()) {
  const panel = panels[index];
  panel.setAttribute("role", "tabpanel");
  panel.setAttribute("aria-labelledby", button.id);
  button.addEventListener("click", () => changeTab(button));
  button.addEventListener("keydown", (event) => {
    const targets = {
      ArrowLeft: (index - 1 + controls.length) % controls.length,
      ArrowRight: (index + 1) % controls.length,
      Home: 0,
      End: controls.length - 1,
    };
    const target = targets[event.key];
    if (!Number.isInteger(target)) return;
    event.preventDefault();
    changeTab(controls[target]);
    controls[target].focus();
  });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-care-link]");
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  selectCare(link.dataset.careLink);
});
addEventListener("hashchange", selectFromHash);
selectFromHash();
selectCare(activeCare || panels[0].id);
tabs.hidden = false;

if (typeof IntersectionObserver === "function") {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("in-view");
      observer.unobserve(entry.target);
    }
  }, { threshold: .14 });
  for (const block of document.querySelectorAll("[data-reveal]")) observer.observe(block);
}
