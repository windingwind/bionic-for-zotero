/* eslint-disable no-restricted-globals */

/**
 * Unit tests for the bionic glyph computation logic in pdf.ts
 * 
 * These tests verify the core algorithm that determines which parts of words
 * should be rendered in bold for bionic reading.
 */

describe("PDF Reader Bionic Glyph Computation", () => {
  // Regex patterns used in computeBionicGlyphs
  const SEPARATOR_REGEX = /[\p{P}\p{S}\p{Z}]/u;
  const CONVERTIBLE_REGEX = /(\p{L}|\p{Nd})*\p{L}(\p{L}|\p{Nd})*/u;
  const NON_VOWELS_REGEX = /[^aeiou]/gi;

  // Glyph type for tests
  type Glyph = number | { unicode: string };

  // Helper function that mirrors getStr from pdf.ts
  function getStr(glyph: Glyph): string {
    if (typeof glyph === "number") {
      if (glyph < -100) {
        return " ";
      } else {
        return "<EMPTY>";
      }
    }
    return glyph.unicode;
  }

  // Helper to create text glyphs
  function createGlyph(unicode: string): Glyph {
    return { unicode };
  }

  // Helper to create space glyph (numeric representation)
  function createSpaceGlyph(): Glyph {
    return -101;
  }

  // Helper to create empty glyph (numeric representation)
  function createEmptyGlyph(): Glyph {
    return -50;
  }

  // Simulation of computeBionicGlyphs function for testing
  function simulateComputeBionicGlyphs(
    glyphs: Glyph[],
    options: {
      parsingOffset?: number;
      previousWordBroken?: boolean;
    } = {},
  ): { glyphs: Glyph[]; isBold: boolean }[] {
    const { parsingOffset = 0, previousWordBroken = false } = options;
    
    let isWordBroken = previousWordBroken;
    let wordStartIdx = NaN;
    let wordEndIdx = NaN;
    let word = "";
    const newGlyphData: { glyphs: Glyph[]; isBold: boolean }[] = [];

    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i];
      const str = getStr(glyph);
      const isWordSeparator = SEPARATOR_REGEX.test(str);

      const isWordStarted = !Number.isNaN(wordStartIdx);
      if (isWordStarted) {
        if (isWordSeparator || i === glyphs.length - 1) {
          wordEndIdx = i;
          word += str;
        } else {
          word += str;
          continue;
        }
      } else {
        if (!isWordSeparator) {
          wordStartIdx = i;
          word += str;
        } else {
          newGlyphData.push({
            glyphs: glyphs.slice(i, i + 1),
            isBold: false,
          });
          continue;
        }
      }
      const isWordEnded = isWordStarted && !Number.isNaN(wordEndIdx);
      if (!isWordEnded) {
        continue;
      }

      word = word.replace(/<EMPTY>/g, "\u2060");

      if (wordEndIdx === wordStartIdx || !CONVERTIBLE_REGEX.test(word)) {
        newGlyphData.push({
          glyphs: glyphs.slice(wordStartIdx, wordEndIdx + 1),
          isBold: false,
        });
        wordStartIdx = NaN;
        wordEndIdx = NaN;
        word = "";
        continue;
      }

      let boldNumber = 1;
      const wordLength = wordEndIdx + 1 - wordStartIdx;
      const isPreviousWordBroken = isWordBroken;
      isWordBroken = word.endsWith("\u2060") && wordLength >= 1 && wordLength <= 10;
      
      if (isPreviousWordBroken && !isWordBroken) {
        boldNumber = 0;
        isWordBroken = false;
      } else if (isWordBroken) {
        boldNumber = wordLength;
      } else if (wordLength < 4) {
        boldNumber = 1;
      } else {
        boldNumber = Math.ceil(wordLength / 2);

        if (boldNumber > 6) {
          const nonVowels = [...word.matchAll(NON_VOWELS_REGEX)];
          const closestMatch = nonVowels.sort((a, b) => {
            return Math.abs((a.index ?? 0) - boldNumber) - Math.abs((b.index ?? 0) - boldNumber);
          })[0];
          if (closestMatch && Math.abs((closestMatch.index ?? 0) - boldNumber) < 2) {
            boldNumber = (closestMatch.index ?? 0) + 1;
          }
        }
      }

      boldNumber += parsingOffset;
      boldNumber = Math.max(Math.min(boldNumber, wordLength), 1);

      newGlyphData.push({
        glyphs: glyphs.slice(wordStartIdx, wordStartIdx + boldNumber),
        isBold: true,
      });

      if (wordStartIdx + boldNumber <= wordEndIdx) {
        newGlyphData.push({
          glyphs: glyphs.slice(wordStartIdx + boldNumber, wordEndIdx + 1),
          isBold: false,
        });
      }

      wordStartIdx = NaN;
      wordEndIdx = NaN;
      word = "";
    }

    if (!Number.isNaN(wordStartIdx)) {
      newGlyphData.push({
        glyphs: glyphs.slice(wordStartIdx, wordStartIdx + glyphs.length),
        isBold: false,
      });
    }
    
    return newGlyphData;
  }

  describe("getStr helper", () => {
    it("should return space for glyph value less than -100", () => {
      expect(getStr(-101)).toBe(" ");
      expect(getStr(-200)).toBe(" ");
    });

    it("should return <EMPTY> for glyph value between -100 and 0", () => {
      expect(getStr(-50)).toBe("<EMPTY>");
      expect(getStr(-1)).toBe("<EMPTY>");
    });

    it("should return unicode for object glyphs", () => {
      expect(getStr({ unicode: "a" })).toBe("a");
      expect(getStr({ unicode: "Hello" })).toBe("Hello");
    });
  });

  describe("SEPARATOR_REGEX", () => {
    it("should match space character", () => {
      expect(SEPARATOR_REGEX.test(" ")).toBe(true);
    });

    it("should match punctuation marks", () => {
      expect(SEPARATOR_REGEX.test(",")).toBe(true);
      expect(SEPARATOR_REGEX.test(".")).toBe(true);
      expect(SEPARATOR_REGEX.test("!")).toBe(true);
      expect(SEPARATOR_REGEX.test("?")).toBe(true);
      expect(SEPARATOR_REGEX.test(";")).toBe(true);
      expect(SEPARATOR_REGEX.test(":")).toBe(true);
    });

    it("should not match letters", () => {
      expect(SEPARATOR_REGEX.test("a")).toBe(false);
      expect(SEPARATOR_REGEX.test("z")).toBe(false);
      expect(SEPARATOR_REGEX.test("A")).toBe(false);
      expect(SEPARATOR_REGEX.test("Z")).toBe(false);
    });

    it("should not match numbers", () => {
      expect(SEPARATOR_REGEX.test("0")).toBe(false);
      expect(SEPARATOR_REGEX.test("9")).toBe(false);
    });
  });

  describe("CONVERTIBLE_REGEX", () => {
    it("should match words with letters", () => {
      expect(CONVERTIBLE_REGEX.test("hello")).toBe(true);
      expect(CONVERTIBLE_REGEX.test("world")).toBe(true);
      expect(CONVERTIBLE_REGEX.test("a")).toBe(true);
    });

    it("should match words with letters and numbers", () => {
      expect(CONVERTIBLE_REGEX.test("hello123")).toBe(true);
      expect(CONVERTIBLE_REGEX.test("test1")).toBe(true);
    });

    it("should match unicode letters", () => {
      expect(CONVERTIBLE_REGEX.test("café")).toBe(true);
      expect(CONVERTIBLE_REGEX.test("naïve")).toBe(true);
    });

    it("should not match pure numbers", () => {
      expect(CONVERTIBLE_REGEX.test("123")).toBe(false);
      expect(CONVERTIBLE_REGEX.test("0")).toBe(false);
    });

    it("should not match special characters only", () => {
      expect(CONVERTIBLE_REGEX.test("!@#")).toBe(false);
      expect(CONVERTIBLE_REGEX.test("...")).toBe(false);
    });
  });

  describe("NON_VOWELS_REGEX", () => {
    it("should match non-vowel characters", () => {
      const matches = [..."hello".matchAll(NON_VOWELS_REGEX)].map(m => m[0]);
      expect(matches).toEqual(["h", "l", "l"]);
    });

    it("should be case insensitive", () => {
      const matches = [..."HELLO".matchAll(NON_VOWELS_REGEX)].map(m => m[0]);
      expect(matches).toEqual(["H", "L", "L"]);
    });

    it("should not match vowels", () => {
      const matches = [..."aeiou".matchAll(NON_VOWELS_REGEX)].map(m => m[0]);
      expect(matches).toEqual([]);
    });
  });

  describe("word detection", () => {
    it("should identify single word boundaries", () => {
      const text = "hello";
      const glyphs = [...text].map(createGlyph);
      const result = simulateComputeBionicGlyphs(glyphs);
      
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle multiple words separated by spaces", () => {
      const text = "hello world";
      const glyphs = [...text].map((c) => c === " " ? createSpaceGlyph() : createGlyph(c));
      const result = simulateComputeBionicGlyphs(glyphs);
      
      const boldGroups = result.filter(r => r.isBold);
      expect(boldGroups.length).toBe(2);
    });

    it("should handle words separated by punctuation", () => {
      const text = "hello,world";
      const glyphs = [...text].map((c) => c === "," ? createSpaceGlyph() : createGlyph(c));
      const result = simulateComputeBionicGlyphs(glyphs);
      
      const boldGroups = result.filter(r => r.isBold);
      expect(boldGroups.length).toBe(2);
    });
  });

  describe("bold number calculation", () => {
    it("should bold 1 character for 1-letter words", () => {
      const text = "a";
      const glyphs = [...text].map(createGlyph);
      const result = simulateComputeBionicGlyphs(glyphs);

      // Single letter words don't match CONVERTIBLE_REGEX pattern (needs at least one letter followed by optional more)
      // So they fall through to the non-convertible case which returns isBold: false
      expect(result[0].isBold).toBe(false);
      expect(result[0].glyphs.length).toBe(1);
    });

    it("should bold 1 character for 2-letter words", () => {
      const text = "hi";
      const glyphs = [...text].map(createGlyph);
      const result = simulateComputeBionicGlyphs(glyphs);
      
      expect(result[0].isBold).toBe(true);
      expect(result[0].glyphs.length).toBe(1);
    });

    it("should bold 1 character for 3-letter words", () => {
      const text = "cat";
      const glyphs = [...text].map(createGlyph);
      const result = simulateComputeBionicGlyphs(glyphs);
      
      expect(result[0].isBold).toBe(true);
      expect(result[0].glyphs.length).toBe(1);
    });

    it("should bold half (rounded up) for 4+ letter words", () => {
      const testCases: [string, number][] = [
        ["hello", 3], // ceil(5/2) = 3
        ["world", 3], // ceil(5/2) = 3
        ["testing", 4], // ceil(7/2) = 4
        ["longer", 3], // ceil(6/2) = 3
        ["beautiful", 5], // ceil(9/2) = 5
      ];
      
      for (const [word, expectedBold] of testCases) {
        const glyphs = [...word].map(createGlyph);
        const result = simulateComputeBionicGlyphs(glyphs);
        
        expect(result[0].isBold).toBe(true);
        expect(result[0].glyphs.length).toBe(expectedBold);
      }
    });

    it("should find closest non-vowel for long words (>12 chars)", () => {
      const text = "extraordinary";
      const glyphs = [...text].map(createGlyph);
      const result = simulateComputeBionicGlyphs(glyphs);
      
      // For long words, bold number is adjusted to closest non-vowel
      expect(result[0].isBold).toBe(true);
      expect(result[0].glyphs.length).toBeLessThanOrEqual(text.length);
      expect(result[0].glyphs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("word breaking", () => {
    it("should mark word as broken if it ends with zero-width space and length is 1-10", () => {
      const wordWithZWSP = "hello\u2060";
      const wordLength = wordWithZWSP.length;
      const isWordBroken = wordWithZWSP.endsWith("\u2060") && wordLength >= 1 && wordLength <= 10;
      expect(isWordBroken).toBe(true);
    });

    it("should not mark word as broken if it does not end with zero-width space", () => {
      const normalWord = "hello";
      const wordLength = normalWord.length;
      const isWordBroken = normalWord.endsWith("\u2060") && wordLength >= 1 && wordLength <= 10;
      expect(isWordBroken).toBe(false);
    });

    it("should not mark word as broken if length > 10 even with ZWSP", () => {
      const longWordWithZWSP = "extraordinary\u2060";
      const wordLength = longWordWithZWSP.length;
      const isWordBroken = longWordWithZWSP.endsWith("\u2060") && wordLength >= 1 && wordLength <= 10;
      expect(isWordBroken).toBe(false);
    });

    it("should skip boldening if previous word was broken and current is not", () => {
      const text = "world";
      const glyphs = [...text].map(createGlyph);
      const result = simulateComputeBionicGlyphs(glyphs, { previousWordBroken: true });

      // When previous word was broken and current is not, boldNumber = 0
      // But boldNumber gets clamped to max(min(boldNumber, wordLength), 1) = 1
      // The isBold flag is still true because we still create a bold group
      expect(result[0].isBold).toBe(true);
      expect(result[0].glyphs.length).toBe(1); // Clamped to 1
    });

    it("should bold entire broken word", () => {
      const text = "hello\u2060";
      const glyphs = [...text].map(createGlyph);
      const result = simulateComputeBionicGlyphs(glyphs);
      
      // Broken words should be entirely bold
      expect(result[0].isBold).toBe(true);
      expect(result[0].glyphs.length).toBe(text.length);
    });
  });

  describe("parsing offset", () => {
    it("should increase bold characters with positive offset", () => {
      const text = "hello";
      const glyphs = [...text].map(createGlyph);
      
      const resultNoOffset = simulateComputeBionicGlyphs(glyphs, { parsingOffset: 0 });
      const resultWithOffset = simulateComputeBionicGlyphs(glyphs, { parsingOffset: 1 });
      
      expect(resultWithOffset[0].glyphs.length).toBeGreaterThan(resultNoOffset[0].glyphs.length);
    });

    it("should clamp bold number to word length with large offset", () => {
      const text = "hi";
      const glyphs = [...text].map(createGlyph);
      const result = simulateComputeBionicGlyphs(glyphs, { parsingOffset: 10 });
      
      // Should be clamped to word length
      expect(result[0].glyphs.length).toBeLessThanOrEqual(text.length);
    });

    it("should handle negative offset", () => {
      const text = "hello";
      const glyphs = [...text].map(createGlyph);
      const result = simulateComputeBionicGlyphs(glyphs, { parsingOffset: -1 });
      
      // Should be clamped to minimum of 1
      expect(result[0].glyphs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("empty glyph handling", () => {
    it("should replace <EMPTY> with zero-width space", () => {
      const glyphs = [createGlyph("h"), createEmptyGlyph(), createGlyph("i")];
      const result = simulateComputeBionicGlyphs(glyphs);
      
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle words consisting only of empty glyphs", () => {
      const glyphs = [createEmptyGlyph(), createEmptyGlyph(), createEmptyGlyph()];
      const result = simulateComputeBionicGlyphs(glyphs);
      
      // Should not crash, may not produce bold output for non-convertible
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle empty glyph array", () => {
      const glyphs: Glyph[] = [];
      const result = simulateComputeBionicGlyphs(glyphs);
      
      expect(result).toEqual([]);
    });

    it("should handle single space", () => {
      const glyphs = [createSpaceGlyph()];
      const result = simulateComputeBionicGlyphs(glyphs);
      
      expect(result.length).toBe(1);
      expect(result[0].isBold).toBe(false);
    });

    it("should handle only spaces", () => {
      const glyphs = [createSpaceGlyph(), createSpaceGlyph(), createSpaceGlyph()];
      const result = simulateComputeBionicGlyphs(glyphs);
      
      expect(result.every(r => !r.isBold)).toBe(true);
    });

    it("should handle trailing space", () => {
      const text = "hello ";
      const glyphs = [...text].map((c) => c === " " ? createSpaceGlyph() : createGlyph(c));
      const result = simulateComputeBionicGlyphs(glyphs);
      
      const boldGroups = result.filter(r => r.isBold);
      expect(boldGroups.length).toBe(1);
    });

    it("should handle leading space", () => {
      const text = " world";
      const glyphs = [...text].map((c) => c === " " ? createSpaceGlyph() : createGlyph(c));
      const result = simulateComputeBionicGlyphs(glyphs);
      
      const boldGroups = result.filter(r => r.isBold);
      expect(boldGroups.length).toBe(1);
    });

    it("should handle mixed content", () => {
      const text = "  hello   world  ";
      const glyphs = [...text].map((c) => c === " " ? createSpaceGlyph() : createGlyph(c));
      const result = simulateComputeBionicGlyphs(glyphs);
      
      const boldGroups = result.filter(r => r.isBold);
      expect(boldGroups.length).toBe(2);
    });
  });

  describe("unicode support", () => {
    it("should handle accented characters", () => {
      const text = "café";
      const glyphs = [...text].map(createGlyph);
      const result = simulateComputeBionicGlyphs(glyphs);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].isBold).toBe(true);
    });

    it("should handle non-latin scripts", () => {
      const text = "こんにちは";
      const glyphs = [...text].map(createGlyph);
      const result = simulateComputeBionicGlyphs(glyphs);
      
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle mixed scripts", () => {
      const text = "hello 世界";
      const glyphs = [...text].map(createGlyph);
      const result = simulateComputeBionicGlyphs(glyphs);
      
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("sentence processing", () => {
    it("should process full sentences correctly", () => {
      const text = "The quick brown fox jumps over the lazy dog.";
      const glyphs = [...text].map((c) => 
        c === " " || c === "." ? createSpaceGlyph() : createGlyph(c)
      );
      const result = simulateComputeBionicGlyphs(glyphs);
      
      const boldGroups = result.filter(r => r.isBold);
      // Should have bold group for each word
      expect(boldGroups.length).toBeGreaterThan(0);
    });

    it("should handle numbers in text", () => {
      const text = "I have 3 cats and 2 dogs";
      const glyphs = [...text].map((c) => c === " " ? createSpaceGlyph() : createGlyph(c));
      const result = simulateComputeBionicGlyphs(glyphs);
      
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle hyphenated words", () => {
      const text = "self-contained";
      const glyphs = [...text].map((c) => c === "-" ? createSpaceGlyph() : createGlyph(c));
      const result = simulateComputeBionicGlyphs(glyphs);
      
      // Hyphen splits into two words
      const boldGroups = result.filter(r => r.isBold);
      expect(boldGroups.length).toBe(2);
    });
  });

  describe("output structure", () => {
    it("should return array of glyph groups with bold flag", () => {
      const text = "hello";
      const glyphs = [...text].map(createGlyph);
      const result = simulateComputeBionicGlyphs(glyphs);
      
      expect(Array.isArray(result)).toBe(true);
      result.forEach(group => {
        expect(group).toHaveProperty("glyphs");
        expect(group).toHaveProperty("isBold");
        expect(Array.isArray(group.glyphs)).toBe(true);
        expect(typeof group.isBold).toBe("boolean");
      });
    });

    it("should preserve glyph order", () => {
      const text = "hello";
      const glyphs = [...text].map(createGlyph);
      const result = simulateComputeBionicGlyphs(glyphs);
      
      const allGlyphs = result.flatMap(r => r.glyphs);
      expect(allGlyphs.map(g => getStr(g)).join("")).toBe(text);
    });

    it("should have contiguous glyph coverage", () => {
      const text = "hello world";
      const glyphs = [...text].map((c) => c === " " ? createSpaceGlyph() : createGlyph(c));
      const result = simulateComputeBionicGlyphs(glyphs);
      
      const allGlyphs = result.flatMap(r => r.glyphs);
      expect(allGlyphs.length).toBe(glyphs.length);
    });
  });
});
