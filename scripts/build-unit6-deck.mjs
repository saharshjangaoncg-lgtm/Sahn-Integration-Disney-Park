import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { unit6Slides } from "../public/lesson-slides-data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "output");
const previewDir = path.join(projectRoot, "previews");

const runtimeNodeRoot = "/Users/saharshjangaon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node";
const require = createRequire(import.meta.url);
const artifactPath = require.resolve("@oai/artifact-tool", { paths: [runtimeNodeRoot] });
const { Presentation, PresentationFile, shape, text } = await import(artifactPath);

const DESIGN_WIDTH = 960;
const DESIGN_HEIGHT = 540;
const WIDTH = 1280;
const HEIGHT = 720;
const SCALE = WIDTH / DESIGN_WIDTH;
const palette = {
  bg: "#0f1117",
  panel: "#191b22",
  panel2: "#242832",
  text: "#f8f5ee",
  muted: "#c3c8d3",
  gold: "#ffd166",
  blue: "#3f7cff",
  pink: "#ef476f",
  green: "#43aa8b",
  line: "#3a3f4d"
};

function blankPresentation() {
  return Presentation.load({
    id: "integral-imperial-intelligence-unit-6",
    slides: [],
    theme: {
      colorScheme: { name: "Integral Imperial Intelligence", colors: [] },
      backgroundFillStyleList: [],
      lineStyleList: [],
      effectStyleList: []
    },
    layouts: [],
    charts: [],
    images: [],
    contentReferences: [],
    textStyles: [],
    people: [],
    threads: []
  });
}

function addShape(slide, name, frame, fill, geometry = "rect") {
  return slide.compose(
    shape({ name, geometry, fill, width: "fill", height: "fill" }),
    { frame: scaleFrame(frame), baseUnit: 1 }
  );
}

function addText(slide, name, value, frame, style = {}) {
  const scaledStyle = { ...style };
  if (typeof scaledStyle.fontSize === "number") {
    scaledStyle.fontSize = Math.round(scaledStyle.fontSize * SCALE);
  }
  return slide.compose(
    text(value, {
      name,
      width: "fill",
      height: "fill",
      style: {
        typeface: "Aptos",
        color: palette.text,
        fontSize: 24,
        wrap: "square",
        autoFit: "shrinkText",
        ...scaledStyle
      }
    }),
    { frame: scaleFrame(frame), baseUnit: 1 }
  );
}

function scaleFrame(frame) {
  return {
    left: Math.round(frame.left * SCALE),
    top: Math.round(frame.top * SCALE),
    width: Math.round(frame.width * SCALE),
    height: Math.round(frame.height * SCALE)
  };
}

function iconFor(theme) {
  if (/Castle|Cinderella|Fantasyland|Happily/.test(theme)) return "🏰";
  if (/EPCOT|Pandora|Star/.test(theme)) return "🌐";
  if (/Main|Parade|Mickey/.test(theme)) return "📐";
  if (/Pirates|Moana|Jungle/.test(theme)) return "🧭";
  if (/Fireworks|Score|Quiz/.test(theme)) return "🏆";
  return "✨";
}

function bulletText(bullets) {
  return bullets.map((bullet) => `• ${bullet}`).join("\n");
}

function buildSlide(deck, slideData, index) {
  const slide = deck.slides.add();
  slide.background.fill = palette.bg;
  addShape(slide, `bg.${index}`, { left: 0, top: 0, width: WIDTH, height: HEIGHT }, palette.bg);
  addShape(slide, `accent.${index}`, { left: 0, top: 0, width: 16, height: HEIGHT }, index % 3 === 0 ? palette.gold : index % 3 === 1 ? palette.blue : palette.pink);
  addShape(slide, `glow.${index}`, { left: 610, top: -80, width: 420, height: 300 }, index % 2 === 0 ? "#253b83" : "#5c2341", "ellipse");
  addShape(slide, `mainPanel.${index}`, { left: 44, top: 44, width: 572, height: 452 }, palette.panel);
  addShape(slide, `sidePanel.${index}`, { left: 644, top: 44, width: 272, height: 452 }, palette.panel2);

  addShape(slide, `kickerPill.${index}`, { left: 72, top: 72, width: 160, height: 32 }, "#2d3342");
  addText(slide, `kicker.${index}`, slideData.section, { left: 84, top: 78, width: 140, height: 22 }, {
    fontSize: 12,
    bold: true,
    color: palette.gold,
    alignment: "center",
    wrap: "none"
  });

  addText(slide, `title.${index}`, slideData.title, { left: 72, top: 122, width: 510, height: 86 }, {
    typeface: "Georgia",
    fontSize: 34,
    bold: true,
    color: palette.text,
    lineSpacing: 0.95
  });

  addText(slide, `subtitle.${index}`, slideData.subtitle, { left: 72, top: 212, width: 500, height: 42 }, {
    fontSize: 17,
    color: palette.muted,
    lineSpacing: 1.1
  });

  addShape(slide, `formulaCard.${index}`, { left: 72, top: 272, width: 500, height: 72 }, index % 2 === 0 ? palette.gold : "#93c5fd");
  addText(slide, `formula.${index}`, slideData.formula, { left: 92, top: 288, width: 460, height: 42 }, {
    fontSize: 20,
    bold: true,
    color: "#111827",
    alignment: "center",
    lineSpacing: 1
  });

  addText(slide, `bullets.${index}`, bulletText(slideData.bullets), { left: 76, top: 366, width: 500, height: 112 }, {
    fontSize: 16,
    color: palette.text,
    lineSpacing: 1.18
  });

  addShape(slide, `iconCard.${index}`, { left: 684, top: 78, width: 192, height: 134 }, index % 2 === 0 ? palette.blue : palette.pink);
  addText(slide, `icon.${index}`, iconFor(slideData.theme), { left: 714, top: 100, width: 132, height: 72 }, {
    fontSize: 48,
    alignment: "center",
    wrap: "none"
  });
  addText(slide, `theme.${index}`, slideData.theme, { left: 684, top: 174, width: 192, height: 26 }, {
    fontSize: 15,
    bold: true,
    alignment: "center",
    color: "#ffffff"
  });

  if (slideData.example) {
    addShape(slide, `exampleCard.${index}`, { left: 674, top: 242, width: 214, height: 104 }, "#111827");
    addText(slide, `example.${index}`, `Example\n${slideData.example}`, { left: 690, top: 254, width: 182, height: 80 }, {
      fontSize: 14,
      color: palette.text,
      lineSpacing: 1.08
    });
  }

  addText(slide, `notes.${index}`, slideData.speakerNotes, { left: 674, top: slideData.example ? 366 : 242, width: 214, height: slideData.example ? 78 : 178 }, {
    fontSize: 12,
    color: palette.muted,
    lineSpacing: 1.18
  });

  addShape(slide, `footerLine.${index}`, { left: 72, top: 508, width: 816, height: 2 }, "#343a46");
  addText(slide, `footerLeft.${index}`, "Integral Imperial Intelligence • Unit 6 Calc BC", { left: 72, top: 516, width: 430, height: 16 }, {
    fontSize: 9,
    color: palette.muted,
    wrap: "none"
  });
  addText(slide, `footerRight.${index}`, `${index + 1}/${unit6Slides.length}`, { left: 820, top: 516, width: 68, height: 16 }, {
    fontSize: 9,
    color: palette.muted,
    alignment: "right",
    wrap: "none"
  });

  slide.speakerNotes.setText(slideData.speakerNotes);
  return slide;
}

async function writeBlob(filePath, blobLike) {
  if (blobLike.data) {
    await fs.writeFile(filePath, Buffer.from(blobLike.data));
    return;
  }
  await fs.writeFile(filePath, Buffer.from(await blobLike.arrayBuffer()));
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const deck = blankPresentation();
unit6Slides.forEach((slide, index) => buildSlide(deck, slide, index));

const pptxFile = await PresentationFile.exportPptx(deck);
const pptxPath = path.join(outputDir, "integral-imperial-intelligence-unit-6-calc-bc.pptx");
await writeBlob(pptxPath, pptxFile);

const snapshotPath = path.join(outputDir, "unit6-slide-layout-snapshot.json");
await fs.writeFile(snapshotPath, JSON.stringify(deck.toSnapshot(), null, 2));

const previewItems = [];
for (const [index, slide] of deck.slides.items.entries()) {
  const png = await slide.export({ format: "png" });
  const filename = `unit6-slide-${String(index + 1).padStart(2, "0")}.png`;
  await writeBlob(path.join(previewDir, filename), png);
  previewItems.push(filename);
}

const contactSheet = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Unit 6 Deck Contact Sheet</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #111318; color: #f8f5ee; }
    main { width: min(1400px, calc(100vw - 32px)); margin: 0 auto; padding: 24px 0; }
    h1 { margin: 0 0 18px; font-family: Georgia, serif; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    figure { margin: 0; border: 1px solid rgba(255,255,255,.14); border-radius: 8px; overflow: hidden; background: #191b22; }
    img { width: 100%; display: block; }
    figcaption { padding: 8px 10px; color: #c3c8d3; font-weight: 800; }
  </style>
</head>
<body>
  <main>
    <h1>Unit 6 Calc BC Lesson Deck Contact Sheet</h1>
    <section class="grid">
      ${previewItems.map((filename, index) => `<figure><img src="../previews/${filename}" alt="Slide ${index + 1}" /><figcaption>Slide ${index + 1}</figcaption></figure>`).join("")}
    </section>
  </main>
</body>
</html>`;

const contactPath = path.join(outputDir, "unit6-slide-contact-sheet.html");
await fs.writeFile(contactPath, contactSheet);

console.log(JSON.stringify({
  slides: unit6Slides.length,
  pptxPath,
  snapshotPath,
  previewDir,
  contactPath
}, null, 2));
