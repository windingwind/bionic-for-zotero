import { getString, getLocaleID } from "./locale";

// Mock the package.json config
jest.mock("../../package.json", () => ({
  config: {
    addonRef: "test-addon",
  },
}));

// Mock the addon global object
const mockFormatMessagesSync = jest.fn();
(global as any).addon = {
  data: {
    locale: {
      current: {
        formatMessagesSync: mockFormatMessagesSync,
      },
    },
  },
};

describe("locale", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getString", () => {
    describe("single argument (localeString only)", () => {
      it("should return the formatted string", () => {
        mockFormatMessagesSync.mockReturnValueOnce([
          { value: "Hello World", attributes: [] },
        ]);

        const result = getString("hello");

        expect(result).toBe("Hello World");
        expect(mockFormatMessagesSync).toHaveBeenCalledWith([
          { id: "test-addon-hello", args: undefined },
        ]);
      });

      it("should return the prefixed key when pattern is not found", () => {
        mockFormatMessagesSync.mockReturnValueOnce([null]);

        const result = getString("missing");

        expect(result).toBe("test-addon-missing");
      });

      it("should return the prefixed key when pattern value is empty", () => {
        mockFormatMessagesSync.mockReturnValueOnce([{ value: "", attributes: [] }]);

        const result = getString("empty");

        expect(result).toBe("test-addon-empty");
      });
    });

    describe("two arguments (localeString and branch string)", () => {
      it("should return the attribute value for the given branch", () => {
        mockFormatMessagesSync.mockReturnValueOnce([
          {
            value: "Default value",
            attributes: [{ name: "branch1", value: "Branch 1 value" }],
          },
        ]);

        const result = getString("example", "branch1");

        expect(result).toBe("Branch 1 value");
      });

      it("should return the prefixed key when branch is not found", () => {
        mockFormatMessagesSync.mockReturnValueOnce([
          {
            value: "Default value",
            attributes: [{ name: "other", value: "Other value" }],
          },
        ]);

        const result = getString("example", "missing");

        expect(result).toBe("test-addon-example");
      });

      it("should return the prefixed key when pattern is null", () => {
        mockFormatMessagesSync.mockReturnValueOnce([null]);

        const result = getString("missing", "branch1");

        expect(result).toBe("test-addon-missing");
      });
    });

    describe("two arguments (localeString and options object)", () => {
      it("should return the formatted string with args", () => {
        mockFormatMessagesSync.mockReturnValueOnce([
          { value: "I have 2 apples", attributes: [] },
        ]);

        const result = getString("count", { args: { count: 2 } });

        expect(result).toBe("I have 2 apples");
        expect(mockFormatMessagesSync).toHaveBeenCalledWith([
          { id: "test-addon-count", args: { count: 2 } },
        ]);
      });

      it("should return the branch value when branch is specified in options", () => {
        mockFormatMessagesSync.mockReturnValueOnce([
          {
            value: "Default",
            attributes: [{ name: "special", value: "Special branch" }],
          },
        ]);

        const result = getString("example", { branch: "special" });

        expect(result).toBe("Special branch");
      });

      it("should return the default value when branch is not specified", () => {
        mockFormatMessagesSync.mockReturnValueOnce([
          { value: "Default value", attributes: [] },
        ]);

        const result = getString("example", {});

        expect(result).toBe("Default value");
      });

      it("should return the prefixed key when pattern is null with options", () => {
        mockFormatMessagesSync.mockReturnValueOnce([null]);

        const result = getString("missing", { args: { count: 1 } });

        expect(result).toBe("test-addon-missing");
      });

      it("should return the prefixed key when branch is not found in attributes", () => {
        mockFormatMessagesSync.mockReturnValueOnce([
          {
            value: "Default",
            attributes: [{ name: "other", value: "Other" }],
          },
        ]);

        const result = getString("example", { branch: "missing" });

        expect(result).toBe("test-addon-example");
      });
    });

    describe("invalid arguments", () => {
      it("should throw error when called with no arguments", () => {
        expect(() => (getString as any)()).toThrow("Invalid arguments");
      });

      it("should throw error when called with more than 2 arguments", () => {
        expect(() => (getString as any)("a", "b", "c")).toThrow(
          "Invalid arguments",
        );
      });
    });
  });

  describe("getLocaleID", () => {
    it("should return the id with addonRef prefix", () => {
      const result = getLocaleID("my-id");

      expect(result).toBe("test-addon-my-id");
    });

    it("should handle empty string", () => {
      const result = getLocaleID("");

      expect(result).toBe("test-addon-");
    });

    it("should handle complex ids", () => {
      const result = getLocaleID("complex-id-with-dashes");

      expect(result).toBe("test-addon-complex-id-with-dashes");
    });
  });
});
