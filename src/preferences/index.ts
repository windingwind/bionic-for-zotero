/* eslint-disable no-restricted-globals */
import { config } from "../../package.json";
import { computeFont } from "../utils/font";

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
const BIONIC_GROUPS = [
  { startIdx: 0, endIdx: 3, isBold: true },
  { startIdx: 3, endIdx: 7, isBold: false },
  { startIdx: 7, endIdx: 8, isBold: true },
  { startIdx: 8, endIdx: 10, isBold: false },
  { startIdx: 10, endIdx: 11, isBold: true },
  { startIdx: 11, endIdx: 12, isBold: false },
  { startIdx: 12, endIdx: 14, isBold: true },
  { startIdx: 14, endIdx: 18, isBold: false },
  { startIdx: 18, endIdx: 20, isBold: true },
  { startIdx: 20, endIdx: 23, isBold: false },
  { startIdx: 23, endIdx: 24, isBold: true },
  { startIdx: 24, endIdx: 26, isBold: false },
  { startIdx: 26, endIdx: 27, isBold: true },
  { startIdx: 27, endIdx: 30, isBold: false },
  { startIdx: 30, endIdx: 32, isBold: true },
  { startIdx: 32, endIdx: 35, isBold: false },
  { startIdx: 35, endIdx: 36, isBold: true },
  { startIdx: 36, endIdx: 38, isBold: false },
  { startIdx: 38, endIdx: 40, isBold: true },
  { startIdx: 40, endIdx: 43, isBold: false },
  { startIdx: 43, endIdx: 44, isBold: true },
  { startIdx: 44, endIdx: 47, isBold: false },
  { startIdx: 47, endIdx: 51, isBold: true },
  { startIdx: 51, endIdx: 56, isBold: false },
  { startIdx: 56, endIdx: 60, isBold: true },
  { startIdx: 60, endIdx: 66, isBold: false },
  { startIdx: 66, endIdx: 70, isBold: true },
  { startIdx: 70, endIdx: 76, isBold: false },
  { startIdx: 76, endIdx: 78, isBold: true },
  { startIdx: 78, endIdx: 82, isBold: false },
  { startIdx: 82, endIdx: 83, isBold: true },
  { startIdx: 83, endIdx: 86, isBold: false },
  { startIdx: 86, endIdx: 89, isBold: true },
  { startIdx: 89, endIdx: 92, isBold: false },
  { startIdx: 92, endIdx: 96, isBold: true },
  { startIdx: 96, endIdx: 101, isBold: false },
];

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

  for (let i = 0; i < BIONIC_GROUPS.length; i++) {
    const group = BIONIC_GROUPS[i];
    let startIdx = group.startIdx;
    let endIdx = group.endIdx;
    if (parsingOffset) {
      const nextGroup = BIONIC_GROUPS[i + 1];
      const prevGroup = BIONIC_GROUPS[i - 1];
      if (group.isBold && nextGroup) {
        endIdx = Math.max(
          // Can grow until the next group ends
          Math.min(endIdx + parsingOffset, nextGroup.endIdx),
          startIdx + 1,
        );
      } else if (!group.isBold && prevGroup) {
        startIdx = Math.min(
          // Can shrink until the previous group starts
          Math.max(startIdx + parsingOffset, prevGroup.startIdx + 1),
          endIdx,
        );
      }
    }

    if (startIdx >= endIdx) {
      continue;
    }

    const span = document.createElement("span");
    span.textContent = PREVIEW_STRING.slice(startIdx, endIdx);
    span.style.font = group.isBold ? fontData.bold.font : fontData.light.font;
    if (!group.isBold) {
      span.style.opacity = String(fontData.light.alpha);
    }
    previewContainer.appendChild(span);
  }
}
