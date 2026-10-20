/* eslint-disable no-restricted-globals */
import { config } from "../../package.json";
import { computeFont } from "../utils/font";
import { computeBionicGlyphs } from "../utils/glyphs";

function main() {
  document.querySelector("#prefs-navigation")?.addEventListener("select", init);

  setTimeout(() => {
    init();
  }, 1000);
}

main();

let initialized = false;

function init() {
  if (initialized) {
    return;
  }
  const parsingContainer = document.querySelector(
    `#${config.addonRef}-parsing`,
  );
  if (!parsingContainer) {
    return;
  }
  initialized = true;
  document
    .querySelector("#prefs-navigation")
    ?.removeEventListener("select", init);

  parsingContainer.addEventListener("input", (event) => {
    updatePreview();
  });
  updatePreview();
}

const PREVIEW_STRING =
  "Zotero is a free, easy-to-use tool to help you collect, organize, annotate, cite, and share research.";

function updatePreview() {
  const previewContainer = document.querySelector(
    `#${config.addonRef}-parsingPreview`,
  );

  if (!previewContainer) {
    return;
  }

  const fontData = computeFont({
    alpha: 1,
    font: 'normal normal 14px "Roboto", sans-serif',
    opacityContrast:
      parseInt(
        (
          document.querySelector(
            `#${config.addonRef}-opacityContrast`,
          ) as HTMLInputElement
        )?.value,
      ) || 1,
    weightContrast:
      parseInt(
        (
          document.querySelector(
            `#${config.addonRef}-weightContrast`,
          ) as HTMLInputElement
        )?.value,
      ) || 3,
    weightOffset:
      parseInt(
        (
          document.querySelector(
            `#${config.addonRef}-weightOffset`,
          ) as HTMLInputElement
        )?.value,
      ) || 0,
  });

  const parsingOffset =
    parseInt(
      (
        document.querySelector(
          `#${config.addonRef}-parsingOffset`,
        ) as HTMLInputElement
      )?.value,
    ) || 0;

  previewContainer.innerHTML = "";

  const groups = computeBionicGlyphs(
    Array.from(PREVIEW_STRING, (unicode) => ({ unicode })),
    parsingOffset,
  );
  for (const group of groups) {
    const span = document.createElement("span");
    span.textContent = group.glyphs.map((glyph) => glyph.unicode).join("");
    span.style.font = group.isBold ? fontData.bold.font : fontData.light.font;
    if (!group.isBold) {
      span.style.opacity = String(fontData.light.alpha);
    }
    previewContainer.appendChild(span);
  }
}
