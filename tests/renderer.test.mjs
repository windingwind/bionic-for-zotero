import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

function moduleFrom(path) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(new URL(path, import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
    { exports },
  );
  return exports;
}
const { computeBionicGlyphs } = moduleFrom("../src/utils/glyphs.ts");
const { computeFont } = moduleFrom("../src/utils/font.ts");
function setup(original) {
  const source = fs.readFileSync(
    new URL("../src/reader/pdf.ts", import.meta.url),
    "utf8",
  );
  const start = source.indexOf("function patchCanvasGraphicsShowText(");
  const end = source.indexOf("function refresh()", start);
  const ctx = { font: '12px "test"', globalAlpha: 0.8 };
  const window = {
    __BIONIC_READER_ENABLED: false,
    __BIONIC_OPACITY_CONTRAST: 3,
  };
  const sandbox = {
    computeBionicGlyphs,
    computeFont,
    window,
    pdfjsLib: { OPS: { showText: 44 } },
    refresh() {},
    _log() {},
  };
  vm.createContext(sandbox);
  vm.runInContext(
    ts.transpileModule(
      "let firstRenderTriggered=false;\n" + source.slice(start, end),
      {
        compilerOptions: { target: ts.ScriptTarget.ES2022 },
      },
    ).outputText,
    sandbox,
  );
  const prototype = { 44: original };
  sandbox.patchCanvasGraphicsShowText(prototype);
  const instance = Object.assign(Object.create(prototype), { ctx });
  return { instance, window };
}
for (const indexed of [false, true])
  test(`preserves PDF.js ${indexed ? "indexed" : "legacy"} arguments, glyphs and opacity`, () => {
    const calls = [];
    const { instance, window } = setup(function (...args) {
      calls.push({ args, font: this.ctx.font, alpha: this.ctx.globalAlpha });
    });
    window.__BIONIC_READER_ENABLED = true;
    const glyphs = [..."hello"].flatMap((unicode) => [
      { unicode, isSpace: false },
      2,
    ]);
    instance[44](...(indexed ? [17, glyphs] : [glyphs]));
    const flat = calls.flatMap((c) => c.args[indexed ? 1 : 0]);
    assert.deepEqual(flat, glyphs);
    if (indexed) assert.ok(calls.every((c) => c.args[0] === 17));
    assert.equal(calls[0].alpha, 0.8);
    assert.ok(calls.some((c) => c.alpha < 0.8));
    assert.equal(instance.ctx.font, '12px "test"');
    assert.equal(instance.ctx.globalAlpha, 0.8);
  });
test("disabled mode passes the original operation through once", () => {
  const calls = [];
  const { instance } = setup(function (...args) {
    calls.push(args);
    return 123;
  });
  const glyphs = [{ unicode: "a", isSpace: false }];
  assert.equal(instance[44](7, glyphs), 123);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], glyphs);
});
test("renderer restores state even if PDF.js throws", () => {
  const { instance, window } = setup(() => {
    throw new Error("draw failed");
  });
  window.__BIONIC_READER_ENABLED = true;
  assert.throws(
    () => instance[44]([{ unicode: "a", isSpace: false }]),
    /draw failed/,
  );
  assert.equal(instance.ctx.font, '12px "test"');
  assert.equal(instance.ctx.globalAlpha, 0.8);
});
