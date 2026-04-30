import { unit6Slides } from "./lesson-slides-data.js";

const slideEl = document.querySelector("#slide");
const counterEl = document.querySelector("#counter");
const dotsEl = document.querySelector("#dots");
const prevBtn = document.querySelector("#prev");
const nextBtn = document.querySelector("#next");
let index = 0;

function iconFor(theme) {
  if (/Castle|Cinderella|Fantasyland|Happily/.test(theme)) return "🏰";
  if (/EPCOT|Pandora|Star/.test(theme)) return "🌐";
  if (/Main|Parade|Mickey/.test(theme)) return "📐";
  if (/Pirates|Moana|Jungle/.test(theme)) return "🧭";
  if (/Fireworks|Score|Quiz/.test(theme)) return "🏆";
  return "✨";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render() {
  const slide = unit6Slides[index];
  counterEl.textContent = `${index + 1} / ${unit6Slides.length}`;
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === unit6Slides.length - 1;
  dotsEl.innerHTML = unit6Slides.map((_, i) => `<span class="dot ${i === index ? "active" : ""}"></span>`).join("");
  slideEl.innerHTML = `
    <div class="lesson-main">
      <span class="kicker">${escapeHtml(slide.section)}</span>
      <h2>${escapeHtml(slide.title)}</h2>
      <h3>${escapeHtml(slide.subtitle)}</h3>
      <div class="formula-card">${escapeHtml(slide.formula)}</div>
      <ul>${slide.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>
    </div>
    <aside class="lesson-side">
      <div class="side-card">
        <strong>${iconFor(slide.theme)}</strong>
        <span>${escapeHtml(slide.theme)}</span>
      </div>
      ${slide.example ? `<div class="example"><strong>Example:</strong> ${escapeHtml(slide.example)}</div>` : ""}
      <p class="notes">${escapeHtml(slide.speakerNotes)}</p>
    </aside>
  `;
}

prevBtn.addEventListener("click", () => {
  index = Math.max(0, index - 1);
  render();
});

nextBtn.addEventListener("click", () => {
  index = Math.min(unit6Slides.length - 1, index + 1);
  render();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") prevBtn.click();
  if (event.key === "ArrowRight") nextBtn.click();
});

render();
