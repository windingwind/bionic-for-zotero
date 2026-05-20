/**
 * @jest-environment node
 */

// Mock __env__ global variable
(global as any).__env__ = "development";

// Mock the config module
jest.mock("../package.json", () => ({
  config: {
    addonName: "Bionic for Zotero",
    addonID: "bionicReader@euclpts.com",
    addonRef: "bionicReader",
    addonInstance: "BionicReader",
  },
}));

// Store mock functions for later access
const mockGetGlobal = jest.fn().mockReturnValue(undefined);

// Mock zotero-plugin-toolkit - must be hoisted
jest.mock(
  "zotero-plugin-toolkit",
  () => {
    class MockBasicTool {
      getGlobal = mockGetGlobal;
    }

    return {
      BasicTool: MockBasicTool,
      __esModule: true,
    };
  },
  { virtual: true }
);

// Mock Addon class
jest.mock("./addon", () => {
  return {
    default: class MockAddon {
      data = {
        ztoolkit: { test: "ztoolkit" },
      };
    },
  };
});

describe("index", () => {
  const originalGlobalThis = { ...globalThis };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock to return empty Zotero by default
    mockGetGlobal.mockReturnValue({});

    // Reset global state
    delete (globalThis as any).addon;
    delete (globalThis as any).ztoolkit;
    delete (globalThis as any).Zotero;
    delete (globalThis as any)._globalThis;

    // Set up _globalThis (used by the source code)
    (globalThis as any)._globalThis = globalThis;

    // Set up mock Zotero global (used directly in the source code)
    (globalThis as any).Zotero = {};

    // Clean up any previously defined globals
    const globalsToClean = ["ztoolkit"];
    globalsToClean.forEach((name) => {
      try {
        Object.defineProperty(globalThis, name, {
          value: undefined,
          configurable: true,
          writable: true,
        });
      } catch {
        // Ignore if property doesn't exist
      }
    });

    // Clear the module cache to ensure fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original globalThis
    Object.keys(originalGlobalThis).forEach((key) => {
      if (!(key in globalThis)) {
        delete (globalThis as any)[key];
      }
    });
    Object.entries(originalGlobalThis).forEach(([key, value]) => {
      try {
        (globalThis as any)[key] = value;
      } catch {
        // Ignore read-only properties
      }
    });
  });

  describe("global state initialization", () => {
    it("should create addon instance when Zotero[addonInstance] does not exist", () => {
      // Mock getGlobal to return empty Zotero (no addon instance)
      mockGetGlobal.mockReturnValue({});

      // Import the module to trigger side effects
      require("./index");

      expect((globalThis as any).addon).toBeDefined();
    });

    it("should not create addon instance when Zotero[addonInstance] already exists", () => {
      // Mock getGlobal to return Zotero with existing addon instance
      const existingAddon = { existing: true };
      mockGetGlobal.mockReturnValue({
        BionicReader: existingAddon,
      });

      // Import the module to trigger side effects
      require("./index");

      // The addon should not be overwritten
      expect((globalThis as any).addon).toBeUndefined();
    });

    it("should define ztoolkit global with getter function", () => {
      mockGetGlobal.mockReturnValue({});

      require("./index");

      // ztoolkit should be defined on globalThis
      expect((globalThis as any).ztoolkit).toBeDefined();
      expect((globalThis as any).ztoolkit).toEqual({ test: "ztoolkit" });
    });

    it("should set Zotero[addonInstance] to addon instance", () => {
      mockGetGlobal.mockReturnValue({});

      require("./index");

      expect((globalThis as any).Zotero.BionicReader).toBeDefined();
    });

    it("should call getGlobal with Zotero argument", () => {
      mockGetGlobal.mockReturnValue({});

      require("./index");

      expect(mockGetGlobal).toHaveBeenCalledWith("Zotero");
    });
  });

  describe("defineGlobal function", () => {
    it("should define global with getter that returns value from getter function", () => {
      mockGetGlobal.mockReturnValue({});

      require("./index");

      // The ztoolkit global should return the value from the getter
      expect((globalThis as any).ztoolkit).toEqual({ test: "ztoolkit" });
    });

    it("should create configurable global property", () => {
      mockGetGlobal.mockReturnValue({});

      require("./index");

      // The property should be configurable
      const descriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        "ztoolkit"
      );
      expect(descriptor?.get).toBeDefined();
    });
  });

  describe("module exports", () => {
    it("should execute without throwing errors", () => {
      mockGetGlobal.mockReturnValue({});

      expect(() => {
        require("./index");
      }).not.toThrow();
    });

    it("should handle multiple imports gracefully (idempotent)", () => {
      mockGetGlobal.mockReturnValue({});

      // First import
      require("./index");
      const firstAddon = (globalThis as any).addon;

      // Second import should not recreate addon
      require("./index");
      const secondAddon = (globalThis as any).addon;

      // Should be the same instance
      expect(firstAddon).toBe(secondAddon);
    });
  });
});
