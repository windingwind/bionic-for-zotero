import hooks from "./hooks";

// Mock dependencies
jest.mock("./modules/menu", () => ({
  initMenus: jest.fn(),
}));

jest.mock("./modules/preferences", () => ({
  initPreferencePane: jest.fn(),
}));

jest.mock("./modules/settings", () => ({
  initSettings: jest.fn(),
  unInitSettings: jest.fn(),
}));

jest.mock("./modules/reader", () => ({
  initReader: jest.fn(),
  refreshReaders: jest.fn(),
  unInitReader: jest.fn(),
}));

jest.mock("./utils/locale", () => ({
  initLocale: jest.fn(),
}));

jest.mock("./utils/window", () => ({
  showRestartDialog: jest.fn(),
}));

jest.mock("../package.json", () => ({
  config: {
    addonRef: "bionicReader",
    addonInstance: "BionicReader",
  },
}));

// Mock Zotero global
const mockZotero = {
  initializationPromise: Promise.resolve(),
  unlockPromise: Promise.resolve(),
  uiReadyPromise: Promise.resolve(),
  getMainWindows: jest.fn().mockReturnValue([]),
  Reader: {
    _readers: [],
    registerEventListener: jest.fn(),
    getByTabID: jest.fn(),
  },
  PreferencePanes: {
    register: jest.fn(),
  },
  Prefs: {
    registerObserver: jest.fn().mockReturnValue(Symbol("observer")),
    unregisterObserver: jest.fn(),
  },
  File: {
    getContentsFromURLAsync: jest.fn(),
  },
  Utilities: {
    Internal: {
      quit: jest.fn(),
    },
  },
  getString: jest.fn().mockReturnValue("Test String"),
  appName: "Zotero",
};

// Mock ztoolkit global
const mockZToolkit = {
  log: jest.fn(),
  Menu: {
    register: jest.fn(),
  },
  UI: {
    createElement: jest.fn().mockReturnValue({
      title: "",
      innerHTML: "",
      disabled: false,
    }),
  },
  unregisterAll: jest.fn(),
  getGlobal: jest.fn(),
};

// Mock addon global
const mockAddon = {
  data: {
    config: {
      addonID: "bionicReader @euclpts.com",
      addonRef: "bionicReader",
      prefsPrefix: "extensions.bionicReader",
    },
    alive: true,
    locale: {
      current: {
        formatMessagesSync: jest.fn(),
      },
    },
  },
  hooks: {
    onRefreshReaders: jest.fn(),
  },
};

// Set up globals before each test
beforeEach(() => {
  (globalThis as any).Zotero = mockZotero;
  (globalThis as any).ztoolkit = mockZToolkit;
  (globalThis as any).addon = mockAddon;
  (globalThis as any).rootURI = "chrome://bionicReader/";
  (globalThis as any).Localization = undefined;
  (globalThis as any).Components = {
    utils: {
      isDeadWrapper: jest.fn().mockReturnValue(false),
    },
  };
  (globalThis as any).Services = {
    prompt: {
      confirmEx: jest.fn().mockReturnValue(0),
      BUTTON_POS_0: 0,
      BUTTON_POS_1: 1,
      BUTTON_TITLE_IS_STRING: 0,
    },
  };

  // Clear all mocks
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up globals
  delete (globalThis as any).Zotero;
  delete (globalThis as any).ztoolkit;
  delete (globalThis as any).addon;
  delete (globalThis as any).rootURI;
  delete (globalThis as any).Localization;
  delete (globalThis as any).Components;
  delete (globalThis as any).Services;
});

describe("hooks", () => {
  describe("onStartup", () => {
    it("should call all initialization functions in order", async () => {
      const { initLocale } = await import("./utils/locale");
      const { initPreferencePane } = await import("./modules/preferences");
      const { initReader } = await import("./modules/reader");
      const { initSettings } = await import("./modules/settings");

      await hooks.onStartup();

      expect(initLocale).toHaveBeenCalled();
      expect(initPreferencePane).toHaveBeenCalled();
      expect(initReader).toHaveBeenCalled();
      expect(initSettings).toHaveBeenCalled();
    });

    it("should wait for Zotero initialization promises", async () => {
      await hooks.onStartup();

      expect(Zotero.initializationPromise).toBeDefined();
      expect(Zotero.unlockPromise).toBeDefined();
      expect(Zotero.uiReadyPromise).toBeDefined();
    });

    it("should call onMainWindowLoad for each main window", async () => {
      const mockWindow1 = { MozXULElement: { insertFTLIfNeeded: jest.fn() } };
      const mockWindow2 = { MozXULElement: { insertFTLIfNeeded: jest.fn() } };
      (Zotero.getMainWindows as jest.Mock).mockReturnValue([
        mockWindow1,
        mockWindow2,
      ]);

      await hooks.onStartup();

      expect(Zotero.getMainWindows).toHaveBeenCalled();
    });
  });

  describe("onMainWindowLoad", () => {
    it("should insert FTL for main window", async () => {
      const mockWindow = {
        MozXULElement: {
          insertFTLIfNeeded: jest.fn(),
        },
      };

      await hooks.onMainWindowLoad(mockWindow as any);

      expect(mockWindow.MozXULElement.insertFTLIfNeeded).toHaveBeenCalledWith(
        "bionicReader-mainWindow.ftl",
      );
    });

    it("should log the window load event", async () => {
      const mockWindow = {
        MozXULElement: {
          insertFTLIfNeeded: jest.fn(),
        },
      };

      await hooks.onMainWindowLoad(mockWindow as any);

      expect(ztoolkit.log).toHaveBeenCalledWith("onMainWindowLoad", {
        win: mockWindow,
      });
    });

    it("should initialize menus for the window", async () => {
      const mockWindow = {
        MozXULElement: {
          insertFTLIfNeeded: jest.fn(),
        },
      };
      const { initMenus } = await import("./modules/menu");

      await hooks.onMainWindowLoad(mockWindow as any);

      expect(initMenus).toHaveBeenCalledWith(mockWindow);
    });
  });

  describe("onMainWindowUnload", () => {
    it("should be a function", () => {
      expect(typeof hooks.onMainWindowUnload).toBe("function");
    });

    it("should accept a window parameter", async () => {
      const mockWindow = { closed: false };
      await hooks.onMainWindowUnload(mockWindow as any);
      // Function should complete without error
      expect(true).toBe(true);
    });
  });

  describe("onShutdown", () => {
    it("should call unInitSettings", () => {
      hooks.onShutdown();

      const { unInitSettings } = require("./modules/settings");
      expect(unInitSettings).toHaveBeenCalled();
    });

    it("should call unInitReader", () => {
      hooks.onShutdown();

      const { unInitReader } = require("./modules/reader");
      expect(unInitReader).toHaveBeenCalled();
    });

    it("should call ztoolkit.unregisterAll", () => {
      hooks.onShutdown();

      expect(ztoolkit.unregisterAll).toHaveBeenCalled();
    });

    it("should set addon.data.alive to false", () => {
      hooks.onShutdown();

      expect(addon.data.alive).toBe(false);
    });

    it("should delete the addon instance from Zotero", () => {
      const addonInstance = "BionicReader";
      (globalThis as any).Zotero[addonInstance] = { test: "value" };

      hooks.onShutdown();

      expect((globalThis as any).Zotero[addonInstance]).toBeUndefined();
    });
  });

  describe("onRefreshReaders", () => {
    it("should be a reference to refreshReaders", async () => {
      const { refreshReaders } = await import("./modules/reader");

      expect(hooks.onRefreshReaders).toBe(refreshReaders);
    });

    it("should call refreshReaders with provided readers", async () => {
      const mockReaders = [{ itemID: 1, type: "pdf" }];
      const { refreshReaders } = await import("./modules/reader");

      await hooks.onRefreshReaders(mockReaders as any);

      expect(refreshReaders).toHaveBeenCalledWith(mockReaders);
    });
  });

  describe("onShowRestartDialog", () => {
    it("should be a reference to showRestartDialog", async () => {
      const { showRestartDialog } = await import("./utils/window");

      expect(hooks.onShowRestartDialog).toBe(showRestartDialog);
    });

    it("should call showRestartDialog", () => {
      const { showRestartDialog } = require("./utils/window");

      hooks.onShowRestartDialog();

      expect(showRestartDialog).toHaveBeenCalled();
    });
  });

  describe("default export", () => {
    it("should export all required hook functions", () => {
      expect(hooks).toHaveProperty("onStartup");
      expect(hooks).toHaveProperty("onShutdown");
      expect(hooks).toHaveProperty("onMainWindowLoad");
      expect(hooks).toHaveProperty("onMainWindowUnload");
      expect(hooks).toHaveProperty("onRefreshReaders");
      expect(hooks).toHaveProperty("onShowRestartDialog");
    });

    it("should have correct function types", () => {
      expect(typeof hooks.onStartup).toBe("function");
      expect(typeof hooks.onShutdown).toBe("function");
      expect(typeof hooks.onMainWindowLoad).toBe("function");
      expect(typeof hooks.onMainWindowUnload).toBe("function");
      expect(typeof hooks.onRefreshReaders).toBe("function");
      expect(typeof hooks.onShowRestartDialog).toBe("function");
    });
  });
});
