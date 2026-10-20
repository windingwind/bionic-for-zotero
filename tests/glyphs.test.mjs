import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

const module = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(new URL("../src/utils/glyphs.ts", import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
  { exports: module.exports },
);
const parse = module.exports.computeBionicGlyphs;
const glyphs = (text) =>
  Array.from(text, (unicode) => ({ unicode, isSpace: unicode === " " }));
const marked = (groups) =>
  groups
    .filter((g) => g.isBold)
    .flatMap((g) => g.glyphs)
    .filter((g) => typeof g !== "number")
    .map((g) => g.unicode)
    .join("");
function check(input, expected, offset = 0) {
  const groups = parse(input, offset);
  assert.equal(marked(groups), expected);
  const flat = groups.flatMap((g) => g.glyphs);
  assert.equal(flat.length, input.length);
  flat.forEach((g, i) =>
    assert.equal(
      g,
      input[i],
      "Preserve each glyph/adjustment identity and order",
    ),
  );
}

test("normal words and separators", () =>
  check(glyphs("hello world!"), "helwor"));
test("kerning never becomes a word boundary or part of word length", () => {
  const input = glyphs("responsibility").flatMap((g, i) => [g, i % 2 ? -3 : 2]);
  check(input, marked(parse(glyphs("responsibility"))));
});
test("trailing kerning must not bold the entire word or affect next call", () => {
  check([...glyphs("hello"), -2], "hel");
  check(glyphs("world"), "wor");
});
test("negative offset can disable short-word emphasis", () =>
  check(glyphs("a an of that"), "t", -1));
test("large negative offset can disable all emphasis", () =>
  check(glyphs("hello world"), "", -5));
test("spaces and punctuation are never included in emphasis", () =>
  check(glyphs("hi, hi; hi."), "hihihi", 5));
test("positive offset is clamped at each word", () =>
  check(glyphs("hi, world!"), "hiworld", 5));
test("large spacing-only gap separates words", () =>
  check([...glyphs("hello"), -250, ...glyphs("world")], "helwor"));
test("explicit isSpace is respected even without Unicode space", () =>
  check(
    [...glyphs("hello"), { unicode: "", isSpace: true }, ...glyphs("world")],
    "helwor",
  ));
test("ligatures count characters but are not split", () =>
  check([{ unicode: "ffi" }, ...glyphs("ce")], "ffi"));
test("numeric tokens and whitespace alone are untouched", () =>
  check([...glyphs("123 456. !"), 2, -250], ""));
test("empty input and a single letter", () => {
  check([], "");
  check(glyphs("a"), "a");
});
test("deterministic across interleaved pages and offsets", () => {
  const input = [...glyphs("hello"), 2];
  const first = marked(parse(input));
  parse([...glyphs("different"), -1], -5);
  assert.equal(marked(parse(input)), first);
});
