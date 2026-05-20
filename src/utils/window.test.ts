import { isWindowAlive, showRestartDialog } from "./window";

describe("window utils", () => {
  beforeAll(() => {
    // Mock Components global object for isWindowAlive
    (global as any).Components = {
      utils: {
        isDeadWrapper: jest.fn().mockReturnValue(false),
      },
    };
  });

  describe("isWindowAlive", () => {
    it("should return falsy for undefined window", () => {
      expect(isWindowAlive(undefined)).toBeFalsy();
    });

    it("should return falsy when window is not provided", () => {
      expect(isWindowAlive()).toBeFalsy();
    });

    it("should return false for a dead window (closed)", () => {
      const mockWindow = {
        closed: true,
      } as unknown as Window;
      expect(isWindowAlive(mockWindow)).toBe(false);
    });

    it("should return true for a live window", () => {
      const mockWindow = {
        closed: false,
      } as unknown as Window;
      expect(isWindowAlive(mockWindow)).toBe(true);
    });

    it("should return false for a window with dead wrapper", () => {
      const mockWindow = {
        closed: false,
      } as unknown as Window;
      // Mock Components.utils.isDeadWrapper to return true
      (global as any).Components.utils.isDeadWrapper.mockReturnValueOnce(true);
      expect(isWindowAlive(mockWindow)).toBe(false);
    });
  });

  describe("showRestartDialog", () => {
    beforeEach(() => {
      // Mock Zotero global object
      (global as any).Zotero = {
        getString: jest.fn((key: string) => {
          if (key === "general.restartRequired") {
            return "Restart Required";
          }
          if (key === "general.restartRequiredForChange") {
            return "Restart required for change in Zotero";
          }
          if (key === "general.restartNow") {
            return "Restart Now";
          }
          if (key === "general.restartLater") {
            return "Restart Later";
          }
          return key;
        }),
        Utilities: {
          Internal: {
            quit: jest.fn(),
          },
        },
      };

      // Mock Services.prompt
      (global as any).Services = {
        prompt: {
          BUTTON_POS_0: 1,
          BUTTON_POS_1: 2,
          BUTTON_TITLE_IS_STRING: 1,
          confirmEx: jest.fn(),
        },
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should call confirmEx with correct parameters", () => {
      (global as any).Services.prompt.confirmEx.mockReturnValue(1);

      showRestartDialog();

      const ps = (global as any).Services.prompt;
      expect(ps.confirmEx).toHaveBeenCalledWith(
        null,
        "Restart Required",
        "Restart required for change in Zotero",
        ps.BUTTON_POS_0 * ps.BUTTON_TITLE_IS_STRING +
          ps.BUTTON_POS_1 * ps.BUTTON_TITLE_IS_STRING,
        "Restart Now",
        "Restart Later",
        null,
        null,
        {},
      );
    });

    it("should call quit with true when user clicks restart now (index 0)", () => {
      (global as any).Services.prompt.confirmEx.mockReturnValue(0);

      showRestartDialog();

      expect(Zotero.Utilities.Internal.quit).toHaveBeenCalledWith(true);
    });

    it("should not call quit when user clicks restart later (index 1)", () => {
      (global as any).Services.prompt.confirmEx.mockReturnValue(1);

      showRestartDialog();

      expect(Zotero.Utilities.Internal.quit).not.toHaveBeenCalled();
    });
  });
});
