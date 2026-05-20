/**
 * @jest-environment node
 */

// Define __env__ global used by the addon
(globalThis as any).__env__ = "development";

// Mock zotero-plugin-toolkit - must be hoisted
jest.mock(
  "zotero-plugin-toolkit",
  () => {
    class MockUITool {
      basicOptions = {
        ui: {
          enableElementJSONLog: false,
          enableElementDOMLog: false,
        },
      };
    }
    class MockMenuManager {
      constructor() {}
    }
    class MockBasicTool {
      basicOptions = {
        log: {
          prefix: "",
          disableConsole: false,
        },
        api: {
          pluginID: "",
        },
      };
      log = jest.fn();
    }
    return {
      BasicTool: MockBasicTool,
      MenuManager: MockMenuManager,
      UITool: MockUITool,
      unregister: jest.fn(),
      __esModule: true,
    };
  },
  { virtual: true }
);

// Mock hooks
jest.mock("./hooks", () => ({
  onStartup: jest.fn(),
  onShutdown: jest.fn(),
  onMainWindowLoad: jest.fn(),
  onMainWindowUnload: jest.fn(),
  onRefreshReaders: jest.fn(),
  onShowRestartDialog: jest.fn(),
  default: {
    onStartup: jest.fn(),
    onShutdown: jest.fn(),
    onMainWindowLoad: jest.fn(),
    onMainWindowUnload: jest.fn(),
    onRefreshReaders: jest.fn(),
    onShowRestartDialog: jest.fn(),
  },
}));

// Mock package.json config
jest.mock("../package.json", () => ({
  config: {
    addonName: "Bionic for Zotero",
    addonID: "bionicReader@euclpts.com",
    addonRef: "bionicReader",
    addonInstance: "BionicReader",
    prefsPrefix: "extensions.bionicReader",
  },
}));

import Addon from "./addon";
import hooks from "./hooks";
import { config } from "../package.json";

describe("Addon", () => {
  let addon: Addon;

  beforeEach(() => {
    addon = new Addon();
  });

  describe("constructor", () => {
    it("should create an instance of Addon", () => {
      expect(addon).toBeInstanceOf(Addon);
    });

    it("should initialize data.config with config from package.json", () => {
      expect(addon.data.config).toEqual(config);
    });

    it("should initialize data.alive to true", () => {
      expect(addon.data.alive).toBe(true);
    });

    it("should initialize data.env", () => {
      expect(addon.data.env).toBeDefined();
      expect(typeof addon.data.env).toBe("string");
    });

    it("should initialize data.ztoolkit", () => {
      expect(addon.data.ztoolkit).toBeDefined();
    });

    it("should initialize hooks", () => {
      expect(addon.hooks).toEqual(hooks);
    });

    it("should initialize api as an empty object", () => {
      expect(addon.api).toEqual({});
    });
  });

  describe("data property", () => {
    it("should have all required properties", () => {
      expect(addon.data).toHaveProperty("config");
      expect(addon.data).toHaveProperty("alive");
      expect(addon.data).toHaveProperty("env");
      expect(addon.data).toHaveProperty("ztoolkit");
    });

    it("should allow modifying data.alive", () => {
      addon.data.alive = false;
      expect(addon.data.alive).toBe(false);
    });
  });
});
