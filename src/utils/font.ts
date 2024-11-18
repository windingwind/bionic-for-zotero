export { computeFont };

function computeFont(options: {
  font: string;
  alpha: number;
  opacityContrast: number;
  weightContrast: number;
  weightOffset: number;
}) {
  const { font, alpha, opacityContrast, weightContrast, weightOffset } =
    options;
  const computedData = {
    bold: {
      font: "",
      alpha: alpha,
    },
    light: {
      font: "",
      alpha: alpha,
    },
  };

  const fontParams = font.split(" ");

  const fontSizeIndex = fontParams.findIndex((font) => font.includes("px"));

  const baseFont = fontParams.slice(fontSizeIndex).join(" ");

  // Compute alpha
  const opacityRatio = 1 - (opacityContrast - 1) * 0.15;
  if (opacityContrast > 1) {
    computedData.light.alpha *= opacityRatio;
  }

  let baseWeight = 400;
  if (font.includes("black")) {
    baseWeight = 900;
  } else if (font.includes("bold")) {
    baseWeight = 700;
  } else {
    baseWeight = parseInt(fontParams[fontSizeIndex - 1]) || 400;
  }

  baseWeight += weightOffset * 100;

  let boldWeight = baseWeight + 100 * weightContrast;
  let lightWeight = baseWeight;

  if (boldWeight > 900) {
    const diff = boldWeight - 900;
    boldWeight -= diff;
    lightWeight -= diff;
  }

  if (lightWeight < 100) {
    const diff = 100 - lightWeight;
    lightWeight += diff;
    boldWeight += diff;
  }

  const italic = font.includes("italic") ? "italic" : "normal";

  computedData.bold.font = `${italic} ${boldWeight} ${baseFont}`;
  computedData.light.font = `${italic} ${lightWeight} ${baseFont}`;
  return computedData;
}
