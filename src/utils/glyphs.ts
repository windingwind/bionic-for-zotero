/** PDF TJ numbers adjust placement; they are not characters in a word. */
export interface TextGlyph {
  unicode: string;
  isSpace?: boolean;
}

export type TextPart = TextGlyph | number;

export interface BionicGroup<T> {
  glyphs: T[];
  isBold: boolean;
}

/**
 * Partition a single showText operation without changing or discarding any
 * glyphs or spacing adjustments. Deliberately stateless: PDF pages/render tasks
 * can be interleaved, so one operation must not change another's parsing.
 * Words split across separate showText operations remain a known limitation.
 */
export function computeBionicGlyphs<T extends TextPart>(
  glyphs: T[],
  parsingOffset = 0,
): BionicGroup<T>[] {
  const bold = new Array<boolean>(glyphs.length).fill(false);
  let letters: { index: number; length: number }[] = [];
  let word = "";
  const offset = Number.isFinite(parsingOffset) ? Math.trunc(parsingOffset) : 0;

  function flush() {
    if (!letters.length || !/\p{L}/u.test(word)) {
      letters = [];
      word = "";
      return;
    }
    const length = Array.from(word).length;
    let count = length < 4 ? 1 : Math.ceil(length / 2);
    if (count > 6) {
      const candidates = Array.from(word)
        .map((char, index) => ({ char, index }))
        .filter(({ char }) => /[^aeiou]/i.test(char))
        .sort((a, b) => Math.abs(a.index - count) - Math.abs(b.index - count));
      if (candidates[0] && Math.abs(candidates[0].index - count) < 2) {
        count = candidates[0].index + 1;
      }
    }
    // Zero is intentional: negative offsets can leave short words unbolded.
    count = Math.max(0, Math.min(length, count + offset));
    let consumed = 0;
    for (const letter of letters) {
      // A ligature is indivisible; count its Unicode characters, draw it once.
      bold[letter.index] = consumed < count;
      consumed += letter.length;
    }
    letters = [];
    word = "";
  }

  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];
    if (typeof glyph === "number") {
      // Preserve the existing large-gap heuristic for PDFs without space
      // glyphs. Small positive/negative kerning must not split words.
      if (glyph < -100) flush();
      continue;
    }
    const text = glyph.unicode;
    if (glyph.isSpace || /[\p{P}\p{S}\p{Z}\s]/u.test(text)) {
      flush();
      continue;
    }
    if (!text || /^[\p{Cf}]+$/u.test(text)) continue;
    letters.push({ index: i, length: Array.from(text).length });
    word += text;
  }
  flush();

  // Attach adjustments to the preceding style to avoid extra drawing calls.
  for (let i = 0; i < glyphs.length; i++) {
    if (typeof glyphs[i] === "number" && i > 0) bold[i] = bold[i - 1];
  }
  const groups: BionicGroup<T>[] = [];
  for (let i = 0; i < glyphs.length; i++) {
    const previous = groups[groups.length - 1];
    if (previous && previous.isBold === bold[i])
      previous.glyphs.push(glyphs[i]);
    else groups.push({ glyphs: [glyphs[i]], isBold: bold[i] });
  }
  return groups;
}
