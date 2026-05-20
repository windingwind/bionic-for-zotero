/**
 * @jest-environment node
 */

// Mock zotero-plugin-toolkit - must be hoisted
jest.mock(
  "zotero-plugin-toolkit",
  () => {
    const mockWaitForReader = jest.fn();
    const mockWaitUtilAsync = jest.fn();

    return {
      wait: {
        waitForReader: mockWaitForReader,
        waitUtilAsync: mockWaitUtilAsync,
      },
      __esModule: true,
    };
  },
  { virtual: true }
);

import { initReader, unInitReader, refreshReaders } from "./reader";

// Mock the prefs module
jest.mock("../utils/prefs", () => ({
  getPref: jest.fn(),
}));

// Mock the status module
jest.mock("../utils/status", () => ({
  getCurrentItemStatus: jest.fn(),
  toggleCurrentItemStatus: jest.fn(),
}));

import { getPref } from "../utils/prefs";
import { getCurrentItemStatus } from "../utils/status";

import { wait } from "zotero-plugin-toolkit";

// Mock ztoolkit
const mockLog = jest.fn();
(global as any).ztoolkit = {
  log: mockLog,
  UI: {
    createElement: jest.fn(),
  },
};

// Mock addon
(global as any).addon = {
  data: {
    config: {
      addonID: "bionicReader@euclpts.com",
      addonRef: "bionicReader",
    },
  },
  hooks: {
    onRefreshReaders: jest.fn(),
  },
};

// Mock Zotero.File
const mockGetContentsFromURLAsync = jest.fn();
(global as any).Zotero = {
  File: {
    getContentsFromURLAsync: mockGetContentsFromURLAsync,
  },
  Reader: {
    registerEventListener: jest.fn(),
    _readers: [],
  },
  Items: {
    get: jest.fn(),
    getTopLevel: jest.fn(),
  },
  Prefs: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  },
} as unknown as typeof Zotero;

// Mock document and window
const mockDoc = {
  createElement: jest.fn(),
  head: {
    appendChild: jest.fn(),
  },
  getElementById: jest.fn(),
  querySelector: jest.fn(),
};

const mockScript = {
  id: "",
  textContent: "",
};

mockDoc.createElement.mockImplementation((tag: string) => {
  if (tag === "script") {
    return { ...mockScript, id: "", textContent: "" };
  }
  return {};
});

const mockButton = {
  title: "",
  innerHTML: "",
  disabled: false,
};

(global as any).ztoolkit.UI.createElement.mockImplementation((_doc: any, _tag: any, _options: any) => {
  if (_tag === "button") {
    return { ...mockButton };
  }
  return {};
});

describe("reader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).Zotero.Reader._readers = [];
    (global as any).Zotero.Reader.registerEventListener.mockClear();
    mockLog.mockClear();
    (getPref as jest.Mock).mockReturnValue(false);
    (getCurrentItemStatus as jest.Mock).mockReturnValue(false);
  });

  describe("initReader", () => {
    it("should register renderToolbar event listener", () => {
      initReader();

      expect(global.Zotero.Reader.registerEventListener).toHaveBeenCalledWith(
        "renderToolbar",
        expect.any(Function),
        "bionicReader@euclpts.com",
      );
    });

    it("should inject script for each existing reader", () => {
      const mockReader1 = { type: "pdf", itemID: 123 };
      const mockReader2 = { type: "pdf", itemID: 456 };
      (global as any).Zotero.Reader._readers = [mockReader1, mockReader2];

      const mockWin = {
        document: mockDoc,
        PDFViewerApplication: {
          pdfViewer: {},
        },
      };
      (wait.waitForReader as jest.Mock).mockResolvedValue(undefined);
      (wait.waitUtilAsync as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      Object.defineProperty(mockReader1, "_primaryView", {
        value: { _iframeWindow: mockWin },
        writable: true,
      });
      Object.defineProperty(mockReader2, "_primaryView", {
        value: { _iframeWindow: mockWin },
        writable: true,
      });

      initReader();

      expect(wait.waitForReader).toHaveBeenCalledTimes(2);
    });

    it("should handle empty readers array", () => {
      (global as any).Zotero.Reader._readers = [];

      initReader();

      expect(wait.waitForReader).not.toHaveBeenCalled();
    });
  });

  describe("unInitReader", () => {
    it("should remove script and delete window prefs for pdf readers", () => {
      const mockScript = { remove: jest.fn() };
      const mockWin = {
        document: {
          getElementById: jest.fn().mockReturnValue(mockScript),
        },
      };
      const mockReader = { type: "pdf" };
      Object.defineProperty(mockReader, "_primaryView", {
        value: { _iframeWindow: mockWin },
        writable: true,
      });
      (global as any).Zotero.Reader._readers = [mockReader];

      unInitReader();

      expect(mockScript.remove).toHaveBeenCalled();
      expect(mockWin.document.getElementById).toHaveBeenCalledWith("bionic-reader");
    });

    it("should skip non-pdf readers", () => {
      const mockReader = { type: "epub" };
      (global as any).Zotero.Reader._readers = [mockReader];

      unInitReader();

      expect(mockLog).not.toHaveBeenCalled();
    });

    it("should handle readers without script element", () => {
      const mockWin = {
        document: {
          getElementById: jest.fn().mockReturnValue(null),
        },
      };
      const mockReader = { type: "pdf" };
      Object.defineProperty(mockReader, "_primaryView", {
        value: { _iframeWindow: mockWin },
        writable: true,
      });
      (global as any).Zotero.Reader._readers = [mockReader];

      unInitReader();

      expect(mockWin.document.getElementById).toHaveBeenCalledWith("bionic-reader");
    });
  });

  describe("refreshReaders", () => {
    it("should refresh all readers when no readers array provided", async () => {
      const mockWin = {
        document: mockDoc,
        PDFViewerApplication: {
          pdfViewer: {
            refresh: jest.fn().mockResolvedValue(undefined),
          },
        },
        __BIONIC_READER_ENABLED: false,
      };
      const mockReader = { type: "pdf", itemID: 123 };
      Object.defineProperty(mockReader, "_primaryView", {
        value: { _iframeWindow: mockWin },
        writable: true,
      });
      Object.defineProperty(mockReader, "_iframeWindow", {
        value: mockWin,
        writable: true,
      });
      (global as any).Zotero.Reader._readers = [mockReader];

      (wait.waitForReader as jest.Mock).mockResolvedValue(undefined);
      (wait.waitUtilAsync as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      await refreshReaders();

      expect(wait.waitForReader).toHaveBeenCalled();
    });

    it("should refresh specific readers when readers array provided", async () => {
      const mockWin = {
        document: mockDoc,
        PDFViewerApplication: {
          pdfViewer: {
            refresh: jest.fn().mockResolvedValue(undefined),
          },
        },
        __BIONIC_READER_ENABLED: false,
      };
      const mockReader = { type: "pdf", itemID: 123 } as unknown as _ZoteroTypes.ReaderInstance;
      Object.defineProperty(mockReader, "_primaryView", {
        value: { _iframeWindow: mockWin },
        writable: true,
      });
      Object.defineProperty(mockReader, "_iframeWindow", {
        value: mockWin,
        writable: true,
      });

      (wait.waitForReader as jest.Mock).mockResolvedValue(undefined);
      (wait.waitUtilAsync as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      await refreshReaders([mockReader]);

      expect(wait.waitForReader).toHaveBeenCalled();
    });

    it("should skip non-pdf readers", async () => {
      const mockReader = { type: "epub", itemID: 123 } as _ZoteroTypes.ReaderInstance;
      (global as any).Zotero.Reader._readers = [mockReader];

      await refreshReaders();

      expect(wait.waitForReader).not.toHaveBeenCalled();
    });

    it("should handle readers without PDFViewerApplication", async () => {
      const mockWin = {
        document: mockDoc,
        PDFViewerApplication: null,
      };
      const mockReader = { type: "pdf", itemID: 123 };
      Object.defineProperty(mockReader, "_primaryView", {
        value: { _iframeWindow: mockWin },
        writable: true,
      });
      Object.defineProperty(mockReader, "_iframeWindow", {
        value: mockWin,
        writable: true,
      });
      (global as any).Zotero.Reader._readers = [mockReader];

      (wait.waitForReader as jest.Mock).mockResolvedValue(undefined);
      (wait.waitUtilAsync as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      await refreshReaders();

      expect(wait.waitForReader).toHaveBeenCalled();
    });
  });
});
