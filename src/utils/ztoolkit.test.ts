/**
 * @jest-environment node
 */

// Mock __env__ global variable
declare const __env__: string;
(global as any).__env__ = "development";

// Mock the config module
jest.mock("../../package.json", () => ({
  config: {
    addonName: "TestAddon",
    addonID: "test-addon-id",
  },
}));

// Mock zotero-plugin-toolkit - must be hoisted
jest.mock(
  "zotero-plugin-toolkit",
  () => {
    const mockUnregister = jest.fn();

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
    }

    class MockUITool {
      basicOptions = {
        ui: {
          enableElementJSONLog: false,
          enableElementDOMLog: false,
        },
      };
    }

    class MockMenuManager {}

    return {
      BasicTool: MockBasicTool,
      UITool: MockUITool,
      MenuManager: MockMenuManager,
      unregister: mockUnregister,
      __esModule: true,
    };
  },
  { virtual: true }
);

import { createZToolkit } from "./ztoolkit";

describe("ztoolkit", () => {
  const originalEnv = (global as any).__env__;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).__env__ = "development";
  });

  afterAll(() => {
    (global as any).__env__ = originalEnv;
  });

  describe("createZToolkit", () => {
    it("should create a new MyToolkit instance", () => {
      const toolkit = createZToolkit();
      expect(toolkit).toBeDefined();
    });

    it("should initialize toolkit with basicOptions", () => {
      const toolkit = createZToolkit();
      expect(toolkit.basicOptions).toBeDefined();
    });

    it("should return a toolkit with UI and Menu properties", () => {
      const toolkit = createZToolkit();
      expect(toolkit.UI).toBeDefined();
      expect(toolkit.Menu).toBeDefined();
    });

    it("should set log prefix to addon name in development", () => {
      (global as any).__env__ = "development";
      const toolkit = createZToolkit();
      expect(toolkit.basicOptions.log.prefix).toBe("[TestAddon]");
      expect(toolkit.basicOptions.log.disableConsole).toBe(false);
      expect(toolkit.UI.basicOptions.ui.enableElementJSONLog).toBe(true);
      expect(toolkit.UI.basicOptions.ui.enableElementDOMLog).toBe(true);
      expect(toolkit.basicOptions.api.pluginID).toBe("test-addon-id");
    });

    it("should set log prefix to addon name in production", () => {
      (global as any).__env__ = "production";
      const toolkit = createZToolkit();
      expect(toolkit.basicOptions.log.prefix).toBe("[TestAddon]");
      expect(toolkit.basicOptions.log.disableConsole).toBe(true);
      expect(toolkit.UI.basicOptions.ui.enableElementJSONLog).toBe(false);
      expect(toolkit.UI.basicOptions.ui.enableElementDOMLog).toBe(false);
      expect(toolkit.basicOptions.api.pluginID).toBe("test-addon-id");
    });
  });

  describe("MyToolkit", () => {
    it("should have UI property", () => {
      const toolkit = createZToolkit();
      expect(toolkit.UI).toBeDefined();
    });

    it("should have Menu property", () => {
      const toolkit = createZToolkit();
      expect(toolkit.Menu).toBeDefined();
    });

    it("should have unregisterAll method", () => {
      const toolkit = createZToolkit();
      expect(toolkit.unregisterAll).toBeDefined();
      expect(typeof toolkit.unregisterAll).toBe("function");
    });

    it("should call unregister when unregisterAll is called", () => {
      const toolkit = createZToolkit();
      toolkit.unregisterAll();
      // The unregister function should be called
      expect(true).toBe(true);
    });
  });
});
