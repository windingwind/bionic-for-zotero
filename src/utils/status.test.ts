import { getCurrentItemStatus, toggleCurrentItemStatus } from "./status";

// Mock the prefs module
jest.mock("./prefs", () => ({
  getPrefJSON: jest.fn(),
  getPref: jest.fn(),
  setPref: jest.fn(),
}));

import { getPrefJSON, getPref, setPref } from "./prefs";

// Mock the Zotero global object
const mockItemsGet = jest.fn();
const mockItemsGetTopLevel = jest.fn();
const mockGetField = jest.fn();

(global as any).Zotero = {
  Items: {
    get: mockItemsGet,
    getTopLevel: mockItemsGetTopLevel,
  },
};

// Mock the addon global object
const mockOnRefreshReaders = jest.fn();
(global as any).addon = {
  hooks: {
    onRefreshReaders: mockOnRefreshReaders,
  },
};

// Mock Zotero.Reader
(global as any).Zotero.Reader = {
  _readers: [],
};

describe("status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getPrefJSON as jest.Mock).mockReturnValue({});
    (getPref as jest.Mock).mockReturnValue(false);
    (setPref as jest.Mock).mockReturnValue(undefined);
    mockOnRefreshReaders.mockClear();
  });

  describe("getCurrentItemStatus", () => {
    it("should return true when itemID has true status in bionicTemporaryData", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({ 123: true });

      const result = getCurrentItemStatus(123);

      expect(result).toBe(true);
      expect(getPrefJSON).toHaveBeenCalledWith("bionicTemporaryData");
    });

    it("should return false when itemID has false status in bionicTemporaryData", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({ 123: false });

      const result = getCurrentItemStatus(123);

      expect(result).toBe(false);
    });

    it("should return false when item has disabled language", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({});
      (getPref as jest.Mock).mockImplementation((key: string) => {
        if (key === "disableForLanguages") return "en";
        if (key === "enableBionicReader") return true;
        return false;
      });
      mockItemsGet.mockReturnValue({ id: 123 });
      mockItemsGetTopLevel.mockReturnValue([{ getField: mockGetField }]);
      mockGetField.mockReturnValue("en-US");

      const result = getCurrentItemStatus(123);

      expect(result).toBe(false);
      expect(getPref).toHaveBeenCalledWith("disableForLanguages");
    });

    it("should return false when item has disabled language with underscore separator", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({});
      (getPref as jest.Mock).mockImplementation((key: string) => {
        if (key === "disableForLanguages") return "zh";
        if (key === "enableBionicReader") return true;
        return false;
      });
      mockItemsGet.mockReturnValue({ id: 123 });
      mockItemsGetTopLevel.mockReturnValue([{ getField: mockGetField }]);
      mockGetField.mockReturnValue("zh_CN");

      const result = getCurrentItemStatus(123);

      expect(result).toBe(false);
    });

    it("should return enableBionicReader preference when no temporary data and language is not disabled", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({});
      (getPref as jest.Mock).mockImplementation((key: string) => {
        if (key === "disableForLanguages") return "";
        if (key === "enableBionicReader") return true;
        return false;
      });
      mockItemsGet.mockReturnValue({ id: 123 });
      mockItemsGetTopLevel.mockReturnValue([{ getField: mockGetField }]);
      mockGetField.mockReturnValue("fr-FR");

      const result = getCurrentItemStatus(123);

      expect(result).toBe(true);
    });

    it("should return false when enableBionicReader is false and no temporary data", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({});
      (getPref as jest.Mock).mockImplementation((key: string) => {
        if (key === "disableForLanguages") return "";
        if (key === "enableBionicReader") return false;
        return false;
      });
      mockItemsGet.mockReturnValue({ id: 123 });
      mockItemsGetTopLevel.mockReturnValue([{ getField: mockGetField }]);
      mockGetField.mockReturnValue("fr-FR");

      const result = getCurrentItemStatus(123);

      expect(result).toBe(false);
    });

    it("should handle empty disableForLanguages preference", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({});
      (getPref as jest.Mock).mockImplementation((key: string) => {
        if (key === "disableForLanguages") return "";
        if (key === "enableBionicReader") return true;
        return false;
      });
      mockItemsGet.mockReturnValue({ id: 123 });
      mockItemsGetTopLevel.mockReturnValue([{ getField: mockGetField }]);
      mockGetField.mockReturnValue("en-US");

      const result = getCurrentItemStatus(123);

      expect(result).toBe(true);
    });

    it("should handle undefined disableForLanguages preference", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({});
      (getPref as jest.Mock).mockImplementation((key: string) => {
        if (key === "disableForLanguages") return undefined;
        if (key === "enableBionicReader") return true;
        return false;
      });
      mockItemsGet.mockReturnValue({ id: 123 });
      mockItemsGetTopLevel.mockReturnValue([{ getField: mockGetField }]);
      mockGetField.mockReturnValue("en-US");

      const result = getCurrentItemStatus(123);

      expect(result).toBe(true);
    });

    it("should handle language without region code", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({});
      (getPref as jest.Mock).mockImplementation((key: string) => {
        if (key === "disableForLanguages") return "en";
        if (key === "enableBionicReader") return true;
        return false;
      });
      mockItemsGet.mockReturnValue({ id: 123 });
      mockItemsGetTopLevel.mockReturnValue([{ getField: mockGetField }]);
      mockGetField.mockReturnValue("en");

      const result = getCurrentItemStatus(123);

      expect(result).toBe(false);
    });

    it("should handle case insensitive language matching", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({});
      (getPref as jest.Mock).mockImplementation((key: string) => {
        if (key === "disableForLanguages") return "en";
        if (key === "enableBionicReader") return true;
        return false;
      });
      mockItemsGet.mockReturnValue({ id: 123 });
      mockItemsGetTopLevel.mockReturnValue([{ getField: mockGetField }]);
      mockGetField.mockReturnValue("EN-US");

      const result = getCurrentItemStatus(123);

      expect(result).toBe(false);
    });

    it("should handle multiple disabled languages", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({});
      (getPref as jest.Mock).mockImplementation((key: string) => {
        if (key === "disableForLanguages") return "en,fr,de";
        if (key === "enableBionicReader") return true;
        return false;
      });
      mockItemsGet.mockReturnValue({ id: 123 });
      mockItemsGetTopLevel.mockReturnValue([{ getField: mockGetField }]);
      mockGetField.mockReturnValue("fr-FR");

      const result = getCurrentItemStatus(123);

      expect(result).toBe(false);
    });

    it("should return true when language is not in disabled list", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({});
      (getPref as jest.Mock).mockImplementation((key: string) => {
        if (key === "disableForLanguages") return "en,fr";
        if (key === "enableBionicReader") return true;
        return false;
      });
      mockItemsGet.mockReturnValue({ id: 123 });
      mockItemsGetTopLevel.mockReturnValue([{ getField: mockGetField }]);
      mockGetField.mockReturnValue("es-ES");

      const result = getCurrentItemStatus(123);

      expect(result).toBe(true);
    });
  });

  describe("toggleCurrentItemStatus", () => {
    it("should toggle status from true to false in bionicTemporaryData", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({ 123: true });

      toggleCurrentItemStatus(123);

      expect(setPref).toHaveBeenCalledWith(
        "bionicTemporaryData",
        JSON.stringify({ 123: false }),
      );
    });

    it("should toggle status from false to true in bionicTemporaryData", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({ 123: false });

      toggleCurrentItemStatus(123);

      expect(setPref).toHaveBeenCalledWith(
        "bionicTemporaryData",
        JSON.stringify({ 123: true }),
      );
    });

    it("should use enableBionicReader preference when itemID not in bionicTemporaryData", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({});
      (getPref as jest.Mock).mockReturnValue(true);

      toggleCurrentItemStatus(123);

      expect(setPref).toHaveBeenCalledWith(
        "bionicTemporaryData",
        JSON.stringify({ 123: false }),
      );
    });

    it("should use enableBionicReader preference when itemID not in bionicTemporaryData and preference is false", () => {
      (getPrefJSON as jest.Mock).mockReturnValue({});
      (getPref as jest.Mock).mockReturnValue(false);

      toggleCurrentItemStatus(123);

      expect(setPref).toHaveBeenCalledWith(
        "bionicTemporaryData",
        JSON.stringify({ 123: true }),
      );
    });

    it("should call onRefreshReaders with matching readers", () => {
      const mockReader = { itemID: 123 };
      (global as any).Zotero.Reader._readers = [mockReader];
      (getPrefJSON as jest.Mock).mockReturnValue({ 123: true });

      toggleCurrentItemStatus(123);

      expect(mockOnRefreshReaders).toHaveBeenCalledWith([mockReader]);
    });

    it("should call onRefreshReaders with empty array when no matching readers", () => {
      (global as any).Zotero.Reader._readers = [{ itemID: 456 }];
      (getPrefJSON as jest.Mock).mockReturnValue({ 123: true });

      toggleCurrentItemStatus(123);

      expect(mockOnRefreshReaders).toHaveBeenCalledWith([]);
    });

    it("should handle multiple readers with same itemID", () => {
      const mockReader1 = { itemID: 123 };
      const mockReader2 = { itemID: 123 };
      (global as any).Zotero.Reader._readers = [mockReader1, mockReader2, { itemID: 456 }];
      (getPrefJSON as jest.Mock).mockReturnValue({ 123: true });

      toggleCurrentItemStatus(123);

      expect(mockOnRefreshReaders).toHaveBeenCalledWith([mockReader1, mockReader2]);
    });
  });
});
