import { computeFont } from "./font";

describe("computeFont", () => {
  it("should return computed font data with bold and light variants", () => {
    const result = computeFont({
      font: "400 16px Arial",
      alpha: 1,
      opacityContrast: 1,
      weightContrast: 1,
      weightOffset: 0,
    });

    expect(result).toEqual({
      bold: {
        font: "normal 500 16px Arial",
        alpha: 1,
      },
      light: {
        font: "normal 400 16px Arial",
        alpha: 1,
      },
    });
  });

  it("should handle bold font keyword", () => {
    const result = computeFont({
      font: "bold 16px Arial",
      alpha: 1,
      opacityContrast: 1,
      weightContrast: 1,
      weightOffset: 0,
    });

    expect(result.bold.font).toBe("normal 800 16px Arial");
    expect(result.light.font).toBe("normal 700 16px Arial");
  });

  it("should handle black font keyword", () => {
    const result = computeFont({
      font: "black 16px Arial",
      alpha: 1,
      opacityContrast: 1,
      weightContrast: 1,
      weightOffset: 0,
    });

    expect(result.bold.font).toBe("normal 900 16px Arial");
    expect(result.light.font).toBe("normal 800 16px Arial");
  });

  it("should handle italic font", () => {
    const result = computeFont({
      font: "italic 400 16px Arial",
      alpha: 1,
      opacityContrast: 1,
      weightContrast: 1,
      weightOffset: 0,
    });

    expect(result.bold.font).toBe("italic 500 16px Arial");
    expect(result.light.font).toBe("italic 400 16px Arial");
  });

  it("should apply opacity ratio when opacityContrast > 1 for light variant", () => {
    const result = computeFont({
      font: "400 16px Arial",
      alpha: 1,
      opacityContrast: 2,
      weightContrast: 1,
      weightOffset: 0,
    });

    const expectedOpacityRatio = 1 - (2 - 1) * 0.15;
    expect(result.light.alpha).toBeCloseTo(1 * expectedOpacityRatio);
    expect(result.bold.alpha).toBe(1);
  });

  it("should not apply opacity ratio when opacityContrast = 1", () => {
    const result = computeFont({
      font: "400 16px Arial",
      alpha: 1,
      opacityContrast: 1,
      weightContrast: 1,
      weightOffset: 0,
    });

    expect(result.light.alpha).toBe(1);
    expect(result.bold.alpha).toBe(1);
  });

  it("should apply weightOffset correctly", () => {
    const result = computeFont({
      font: "400 16px Arial",
      alpha: 1,
      opacityContrast: 1,
      weightContrast: 1,
      weightOffset: 1,
    });

    expect(result.bold.font).toBe("normal 600 16px Arial");
    expect(result.light.font).toBe("normal 500 16px Arial");
  });

  it("should apply weightContrast correctly", () => {
    const result = computeFont({
      font: "400 16px Arial",
      alpha: 1,
      opacityContrast: 1,
      weightContrast: 2,
      weightOffset: 0,
    });

    expect(result.bold.font).toBe("normal 600 16px Arial");
    expect(result.light.font).toBe("normal 400 16px Arial");
  });

  it("should clamp boldWeight to 900 and adjust lightWeight accordingly", () => {
    const result = computeFont({
      font: "black 16px Arial",
      alpha: 1,
      opacityContrast: 1,
      weightContrast: 2,
      weightOffset: 1,
    });

    expect(result.bold.font).toBe("normal 900 16px Arial");
    expect(result.light.font).toBe("normal 700 16px Arial");
  });

  it("should clamp lightWeight to minimum 100 and adjust boldWeight accordingly", () => {
    const result = computeFont({
      font: "100 16px Arial",
      alpha: 1,
      opacityContrast: 1,
      weightContrast: 1,
      weightOffset: -3,
    });

    expect(result.light.font).toBe("normal 100 16px Arial");
    expect(result.bold.font).toBe("normal 200 16px Arial");
  });

  it("should handle custom alpha value", () => {
    const result = computeFont({
      font: "400 16px Arial",
      alpha: 0.5,
      opacityContrast: 1,
      weightContrast: 1,
      weightOffset: 0,
    });

    expect(result.bold.alpha).toBe(0.5);
    expect(result.light.alpha).toBe(0.5);
  });

  it("should handle custom alpha value with opacityContrast > 1", () => {
    const result = computeFont({
      font: "400 16px Arial",
      alpha: 0.8,
      opacityContrast: 2,
      weightContrast: 1,
      weightOffset: 0,
    });

    const expectedOpacityRatio = 1 - (2 - 1) * 0.15;
    expect(result.light.alpha).toBeCloseTo(0.8 * expectedOpacityRatio);
    expect(result.bold.alpha).toBe(0.8);
  });

  it("should handle font with multiple parameters", () => {
    const result = computeFont({
      font: "italic 700 18px Helvetica Neue",
      alpha: 1,
      opacityContrast: 1,
      weightContrast: 1,
      weightOffset: 0,
    });

    expect(result.bold.font).toBe("italic 800 18px Helvetica Neue");
    expect(result.light.font).toBe("italic 700 18px Helvetica Neue");
  });
});
