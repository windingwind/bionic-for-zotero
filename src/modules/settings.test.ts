import { initSettings, unInitSettings } from "./settings";

describe("settings", () => {
  const mockRegisterObserver = jest.fn();
  const mockUnregisterObserver = jest.fn();
  const mockOnRefreshReaders = jest.fn();

  beforeAll(() => {
    // Mock the global Zotero object
    (global as unknown as { Zotero: { Prefs: { registerObserver: jest.Mock; unregisterObserver: jest.Mock } } }).Zotero = {
      Prefs: {
        registerObserver: mockRegisterObserver,
        unregisterObserver: mockUnregisterObserver,
      },
    };

    // Mock the global addon object
    (global as unknown as { addon: { data: { config: { prefsPrefix: string } }; hooks: { onRefreshReaders: jest.Mock } } }).addon = {
      data: {
        config: {
          prefsPrefix: "extensions.bionicReader",
        },
      },
      hooks: {
        onRefreshReaders: mockOnRefreshReaders,
      },
    };
  });

  beforeEach(() => {
    mockRegisterObserver.mockClear();
    mockUnregisterObserver.mockClear();
    mockOnRefreshReaders.mockClear();
  });

  afterAll(() => {
    // Clean up globals
    delete (global as unknown as { Zotero?: unknown }).Zotero;
    delete (global as unknown as { addon?: unknown }).addon;
  });

  describe("initSettings", () => {
    it("should register observers for all prefs to observe", () => {
      initSettings();

      expect(mockRegisterObserver).toHaveBeenCalledTimes(5);
    });

    it("should register observer for enableBionicReader pref", () => {
      initSettings();

      expect(mockRegisterObserver).toHaveBeenCalledWith(
        "extensions.bionicReader.enableBionicReader",
        expect.any(Function),
        true,
      );
    });

    it("should register observer for parsingOffset pref", () => {
      initSettings();

      expect(mockRegisterObserver).toHaveBeenCalledWith(
        "extensions.bionicReader.parsingOffset",
        expect.any(Function),
        true,
      );
    });

    it("should register observer for opacityContrast pref", () => {
      initSettings();

      expect(mockRegisterObserver).toHaveBeenCalledWith(
        "extensions.bionicReader.opacityContrast",
        expect.any(Function),
        true,
      );
    });

    it("should register observer for weightContrast pref", () => {
      initSettings();

      expect(mockRegisterObserver).toHaveBeenCalledWith(
        "extensions.bionicReader.weightContrast",
        expect.any(Function),
        true,
      );
    });

    it("should register observer for weightOffset pref", () => {
      initSettings();

      expect(mockRegisterObserver).toHaveBeenCalledWith(
        "extensions.bionicReader.weightOffset",
        expect.any(Function),
        true,
      );
    });

    it("should register observers with onRefreshReaders callback", () => {
      initSettings();

      const calls = mockRegisterObserver.mock.calls;
      calls.forEach((call) => {
        const callback = call[1] as () => void;
        callback();
      });

      expect(mockOnRefreshReaders).toHaveBeenCalledTimes(5);
    });

    it("should register observers with true for third argument", () => {
      initSettings();

      const calls = mockRegisterObserver.mock.calls;
      calls.forEach((call) => {
        expect(call[2]).toBe(true);
      });
    });
  });

  describe("unInitSettings", () => {
    it("should unregister all registered observers", () => {
      initSettings();
      const registeredSymbols = mockRegisterObserver.mock.results.map((r) => r.value);

      unInitSettings();

      expect(mockUnregisterObserver).toHaveBeenCalledTimes(5);
      registeredSymbols.forEach((symbol) => {
        expect(mockUnregisterObserver).toHaveBeenCalledWith(symbol);
      });
    });

    it("should not throw when no observers are registered", () => {
      expect(() => unInitSettings()).not.toThrow();
    });

    it("should unregister observers after init", () => {
      initSettings();

      unInitSettings();

      expect(mockUnregisterObserver).toHaveBeenCalledTimes(5);
    });
  });

  describe("initSettings and unInitSettings together", () => {
    it("should register and then unregister observers", () => {
      initSettings();
      const registeredSymbols = mockRegisterObserver.mock.results.map((r) => r.value);

      unInitSettings();

      expect(mockRegisterObserver).toHaveBeenCalledTimes(5);
      expect(mockUnregisterObserver).toHaveBeenCalledTimes(5);
    });
  });
});
