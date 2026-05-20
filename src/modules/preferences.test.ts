import { initPreferencePane } from "./preferences";

describe("initPreferencePane", () => {
  const mockRegister = jest.fn();

  beforeAll(() => {
    // Mock the global Zotero object
    (global as unknown as { Zotero: { PreferencePanes: { register: jest.Mock } } }).Zotero = {
      PreferencePanes: {
        register: mockRegister,
      },
    };

    // Mock the global rootURI
    (global as unknown as { rootURI: string }).rootURI = "chrome://bionicReader/";

    // Mock the global addon object
    (global as unknown as { addon: { data: { config: { addonID: string; addonRef: string } } } }).addon = {
      data: {
        config: {
          addonID: "bionicReader@euclpts.com",
          addonRef: "bionicReader",
        },
      },
    };
  });

  beforeEach(() => {
    mockRegister.mockClear();
  });

  afterAll(() => {
    // Clean up globals
    delete (global as unknown as { Zotero?: unknown }).Zotero;
    delete (global as unknown as { rootURI?: unknown }).rootURI;
    delete (global as unknown as { addon?: unknown }).addon;
  });

  it("should register the preference pane with Zotero", () => {
    initPreferencePane();

    expect(mockRegister).toHaveBeenCalledTimes(1);
  });

  it("should register with correct pluginID", () => {
    initPreferencePane();

    const callArgs = mockRegister.mock.calls[0][0];
    expect(callArgs.pluginID).toBe("bionicReader@euclpts.com");
  });

  it("should register with correct label", () => {
    initPreferencePane();

    const callArgs = mockRegister.mock.calls[0][0];
    expect(callArgs.label).toBe("Bionic");
  });

  it("should register with correct src path", () => {
    initPreferencePane();

    const callArgs = mockRegister.mock.calls[0][0];
    expect(callArgs.src).toBe("chrome://bionicReader/chrome/content/preferences.xhtml");
  });

  it("should register with correct scripts path", () => {
    initPreferencePane();

    const callArgs = mockRegister.mock.calls[0][0];
    expect(callArgs.scripts).toEqual([
      "chrome://bionicReader/content/scripts/preferences.js",
    ]);
  });

  it("should register with correct stylesheets path", () => {
    initPreferencePane();

    const callArgs = mockRegister.mock.calls[0][0];
    expect(callArgs.stylesheets).toEqual([
      "chrome://bionicReader/content/preferences.css",
    ]);
  });

  it("should register with all required properties", () => {
    initPreferencePane();

    const callArgs = mockRegister.mock.calls[0][0];
    expect(callArgs).toHaveProperty("src");
    expect(callArgs).toHaveProperty("pluginID");
    expect(callArgs).toHaveProperty("label");
    expect(callArgs).toHaveProperty("scripts");
    expect(callArgs).toHaveProperty("stylesheets");
  });
});
