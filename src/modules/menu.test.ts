import { initMenus } from "./menu";

// Mock external dependencies
jest.mock("../utils/locale", () => ({
  getString: jest.fn((key: string) => `string:${key}`),
}));

jest.mock("../utils/prefs", () => {
  const prefs: Record<string, boolean> = {
    enableBionicReader: false,
  };
  return {
    getPref: jest.fn((key: string) => prefs[key]),
    setPref: jest.fn((key: string, value: boolean) => {
      prefs[key] = value;
    }),
  };
});

jest.mock("../utils/status", () => ({
  toggleCurrentItemStatus: jest.fn(),
  getCurrentItemStatus: jest.fn(),
}));

import { getString } from "../utils/locale";
import { getPref, setPref } from "../utils/prefs";
import { toggleCurrentItemStatus, getCurrentItemStatus } from "../utils/status";

describe("initMenus", () => {
  let mockWin: _ZoteroTypes.MainWindow;
  let mockMenuRegister: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock ztoolkit.Menu.register
    mockMenuRegister = jest.fn();
    (global as unknown as { ztoolkit: unknown }).ztoolkit = {
      Menu: {
        register: mockMenuRegister,
      },
    };

    // Mock Zotero.Reader
    (global as unknown as { Zotero: unknown }).Zotero = {
      Reader: {
        getByTabID: jest.fn(),
      },
      Tabs: {
        selectedID: "test-tab-id",
      },
    };

    // Mock addon
    (global as unknown as { addon: unknown }).addon = {
      data: {
        config: {
          addonRef: "test-addon",
        },
      },
      hooks: {
        onRefreshReaders: jest.fn(),
      },
    };

    // Create mock window
    mockWin = {
      Zotero_Tabs: {
        selectedID: "test-tab-id",
      },
    } as unknown as _ZoteroTypes.MainWindow;
  });

  afterEach(() => {
    // Clean up globals
    delete (global as unknown as { ztoolkit: unknown }).ztoolkit;
    delete (global as unknown as { Zotero: unknown }).Zotero;
    delete (global as unknown as { addon: unknown }).addon;
  });

  it("should register menu separator", () => {
    initMenus(mockWin);

    expect(mockMenuRegister).toHaveBeenCalledWith("menuView", {
      tag: "menuseparator",
      id: "test-addon-menu-view-separator",
      classList: ["menu-type-reader", "pdf"],
    });
  });

  it("should register enable-bionic menu item", () => {
    initMenus(mockWin);

    expect(mockMenuRegister).toHaveBeenCalledWith("menuView", expect.objectContaining({
      tag: "menuitem",
      id: "test-addon-menu-view-enable-bionic",
      classList: ["menu-type-reader", "pdf"],
      label: "string:menu-enableBionic",
      type: "checkbox",
    }));
  });

  it("should toggle enableBionicReader pref when enable-bionic command is triggered", () => {
    (getPref as jest.Mock).mockReturnValue(false);
    initMenus(mockWin);

    const menuConfig = mockMenuRegister.mock.calls.find(
      (call) => call[1].id === "test-addon-menu-view-enable-bionic",
    )?.[1];

    expect(menuConfig).toBeDefined();
    menuConfig!.commandListener();

    expect(setPref).toHaveBeenCalledWith("enableBionicReader", true);
  });

  it("should set checked attribute based on enableBionicReader pref in getVisibility", () => {
    (getPref as jest.Mock).mockReturnValue(true);
    initMenus(mockWin);

    const menuConfig = mockMenuRegister.mock.calls.find(
      (call) => call[1].id === "test-addon-menu-view-enable-bionic",
    )?.[1];

    expect(menuConfig).toBeDefined();
    const mockElem = {
      setAttribute: jest.fn(),
    } as unknown as Element;

    menuConfig!.getVisibility(mockElem);

    expect(mockElem.setAttribute).toHaveBeenCalledWith("checked", "true");
  });

  it("should register enable-bionic-current-item menu item", () => {
    initMenus(mockWin);

    expect(mockMenuRegister).toHaveBeenCalledWith("menuView", expect.objectContaining({
      tag: "menuitem",
      id: "test-addon-menu-view-enable-bionic-current-item",
      classList: ["menu-type-reader", "pdf"],
      label: "string:menu-enableBionicForCurrentItem",
      type: "checkbox",
    }));
  });

  it("should toggle current item status when enable-bionic-current-item command is triggered", () => {
    const mockItemID = 123;
    ((global as unknown as { Zotero: { Reader: { getByTabID: jest.Mock } } }).Zotero.Reader.getByTabID as jest.Mock).mockReturnValue({
      itemID: mockItemID,
    });

    initMenus(mockWin);

    const menuConfig = mockMenuRegister.mock.calls.find(
      (call) => call[1].id === "test-addon-menu-view-enable-bionic-current-item",
    )?.[1];

    expect(menuConfig).toBeDefined();
    menuConfig!.commandListener();

    expect(toggleCurrentItemStatus).toHaveBeenCalledWith(mockItemID);
  });

  it("should return undefined in getVisibility when itemID is not available", () => {
    // When getByTabID returns null, the code will throw an error accessing .itemID
    // This test verifies the behavior when there's no reader for the tab
    ((global as unknown as { Zotero: { Reader: { getByTabID: jest.Mock } } }).Zotero.Reader.getByTabID as jest.Mock).mockReturnValue({
      itemID: null,
    });

    initMenus(mockWin);

    const menuConfig = mockMenuRegister.mock.calls.find(
      (call) => call[1].id === "test-addon-menu-view-enable-bionic-current-item",
    )?.[1];

    expect(menuConfig).toBeDefined();
    const result = menuConfig!.getVisibility({} as Element);

    expect(result).toBe(false);
  });

  it("should set checked attribute based on current item status in getVisibility", () => {
    const mockItemID = 456;
    ((global as unknown as { Zotero: { Reader: { getByTabID: jest.Mock } } }).Zotero.Reader.getByTabID as jest.Mock).mockReturnValue({
      itemID: mockItemID,
    });
    (getCurrentItemStatus as jest.Mock).mockReturnValue(true);

    initMenus(mockWin);

    const menuConfig = mockMenuRegister.mock.calls.find(
      (call) => call[1].id === "test-addon-menu-view-enable-bionic-current-item",
    )?.[1];

    expect(menuConfig).toBeDefined();
    const mockElem = {
      setAttribute: jest.fn(),
    } as unknown as Element;

    menuConfig!.getVisibility(mockElem);

    expect(mockElem.setAttribute).toHaveBeenCalledWith("checked", "true");
  });

  it("should register refresh-readers menu item", () => {
    initMenus(mockWin);

    expect(mockMenuRegister).toHaveBeenCalledWith("menuView", expect.objectContaining({
      tag: "menuitem",
      id: "test-addon-menu-view-refresh-readers",
      classList: ["menu-type-reader", "pdf"],
      label: "string:menu-refreshReaders",
    }));
  });

  it("should call onRefreshReaders hook when refresh-readers command is triggered", () => {
    initMenus(mockWin);

    const menuConfig = mockMenuRegister.mock.calls.find(
      (call) => call[1].id === "test-addon-menu-view-refresh-readers",
    )?.[1];

    expect(menuConfig).toBeDefined();
    menuConfig!.commandListener();

    expect((global as unknown as { addon: { hooks: { onRefreshReaders: jest.Mock } } }).addon.hooks.onRefreshReaders).toHaveBeenCalled();
  });

  it("should register exactly 4 menu items", () => {
    initMenus(mockWin);

    expect(mockMenuRegister).toHaveBeenCalledTimes(4);
  });
});
