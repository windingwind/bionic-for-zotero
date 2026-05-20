import { getPref, setPref, clearPref, getPrefJSON } from "./prefs";

// Mock Zotero.Prefs
const mockZoteroPrefs = {
  get: jest.fn(),
  set: jest.fn(),
  clear: jest.fn(),
};

global.Zotero = {
  Prefs: mockZoteroPrefs,
} as unknown as typeof Zotero;

// Mock config
jest.mock("../../package.json", () => ({
  config: {
    prefsPrefix: "test-pref",
  },
}));

describe("prefs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPref", () => {
    it("should call Zotero.Prefs.get with correct key", () => {
      mockZoteroPrefs.get.mockReturnValue("test-value");

      const result = getPref("myKey");

      expect(mockZoteroPrefs.get).toHaveBeenCalledWith("test-pref.myKey", true);
      expect(result).toBe("test-value");
    });

    it("should handle boolean values", () => {
      mockZoteroPrefs.get.mockReturnValue(true);

      const result = getPref("boolKey");

      expect(result).toBe(true);
    });

    it("should handle number values", () => {
      mockZoteroPrefs.get.mockReturnValue(42);

      const result = getPref("numberKey");

      expect(result).toBe(42);
    });
  });

  describe("setPref", () => {
    it("should call Zotero.Prefs.set with string value", () => {
      mockZoteroPrefs.set.mockReturnValue(true);

      const result = setPref("myKey", "test-value");

      expect(mockZoteroPrefs.set).toHaveBeenCalledWith("test-pref.myKey", "test-value", true);
      expect(result).toBe(true);
    });

    it("should call Zotero.Prefs.set with number value", () => {
      mockZoteroPrefs.set.mockReturnValue(true);

      const result = setPref("numberKey", 123);

      expect(mockZoteroPrefs.set).toHaveBeenCalledWith("test-pref.numberKey", 123, true);
      expect(result).toBe(true);
    });

    it("should call Zotero.Prefs.set with boolean value", () => {
      mockZoteroPrefs.set.mockReturnValue(true);

      const result = setPref("boolKey", false);

      expect(mockZoteroPrefs.set).toHaveBeenCalledWith("test-pref.boolKey", false, true);
      expect(result).toBe(true);
    });
  });

  describe("clearPref", () => {
    it("should call Zotero.Prefs.clear with correct key", () => {
      mockZoteroPrefs.clear.mockReturnValue(true);

      const result = clearPref("myKey");

      expect(mockZoteroPrefs.clear).toHaveBeenCalledWith("test-pref.myKey", true);
      expect(result).toBe(true);
    });
  });

  describe("getPrefJSON", () => {
    it("should parse JSON from preference value", () => {
      const mockData = { foo: "bar", count: 42 };
      mockZoteroPrefs.get.mockReturnValue(JSON.stringify(mockData));

      const result = getPrefJSON("jsonKey");

      expect(mockZoteroPrefs.get).toHaveBeenCalledWith("test-pref.jsonKey", true);
      expect(result).toEqual(mockData);
    });

    it("should handle undefined by returning empty object", () => {
      mockZoteroPrefs.get.mockReturnValue(undefined);

      const result = getPrefJSON("undefinedKey");

      // undefined || "{}" = "{}", JSON.parse("{}") returns {}
      expect(result).toEqual({});
      expect(mockZoteroPrefs.set).not.toHaveBeenCalled();
    });

    it("should handle null by returning empty object", () => {
      mockZoteroPrefs.get.mockReturnValue(null);

      const result = getPrefJSON("nullKey");

      // null || "{}" = "{}", JSON.parse("{}") returns {}
      expect(result).toEqual({});
      expect(mockZoteroPrefs.set).not.toHaveBeenCalled();
    });

    it("should handle invalid JSON by setting default and returning empty object", () => {
      mockZoteroPrefs.get.mockReturnValue("invalid-json");

      const result = getPrefJSON("invalidKey");

      expect(result).toEqual({});
      expect(mockZoteroPrefs.set).toHaveBeenCalledWith("test-pref.invalidKey", "{}", true);
    });

    it("should handle empty string by returning empty object", () => {
      mockZoteroPrefs.get.mockReturnValue("");

      const result = getPrefJSON("emptyKey");

      // "" || "{}" = "{}", JSON.parse("{}") returns {}
      expect(result).toEqual({});
      expect(mockZoteroPrefs.set).not.toHaveBeenCalled();
    });

    it("should parse complex nested JSON", () => {
      const mockData = {
        nested: {
          array: [1, 2, 3],
          obj: { a: "b" },
        },
      };
      mockZoteroPrefs.get.mockReturnValue(JSON.stringify(mockData));

      const result = getPrefJSON("complexKey");

      expect(result).toEqual(mockData);
    });
  });
});
