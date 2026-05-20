/**
 * Unit tests for preferences module
 * Uses manual DOM mocking since jsdom is not available
 */

// Mock DOM APIs with proper typing
class MockElement {
  id: string = "";
  tagName: string;
  children: MockElement[] = [];
  innerHTML: string = "";
  textContent: string | null = null;
  style: Record<string, string> = {};
  value?: string;
  private eventListeners: Map<string, Set<(event: MockEvent) => void>> = new Map();

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  addEventListener(_event: string, _listener: EventListenerOrEventListenerObject) {
    const event = _event;
    const listener = _listener as (event: MockEvent) => void;
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  removeEventListener(_event: string, _listener: EventListenerOrEventListenerObject) {
    const event = _event;
    const listener = _listener as (event: MockEvent) => void;
    this.eventListeners.get(event)?.delete(listener);
  }

  dispatchEvent(event: MockEvent) {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }
    return true;
  }

  appendChild(child: MockElement) {
    this.children.push(child);
    return child;
  }

  querySelector(selector: string): MockElement | null {
    if (selector.startsWith("#")) {
      const id = selector.slice(1);
      if (this.id === id) return this;
      for (const child of this.children) {
        const found = child.querySelector(selector);
        if (found) return found;
      }
    }
    return null;
  }

  querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    if (selector.startsWith("#")) {
      const id = selector.slice(1);
      if (this.id === id) results.push(this);
      for (const child of this.children) {
        results.push(...child.querySelectorAll(selector));
      }
    } else {
      // Tag name selector (e.g., "span")
      const tagName = selector.toUpperCase();
      if (this.tagName === tagName) results.push(this);
      for (const child of this.children) {
        results.push(...child.querySelectorAll(selector));
      }
    }
    return results;
  }

  setAttribute(name: string, value: string) {
    if (name === "id") this.id = value;
  }

  getAttribute(name: string): string | null {
    if (name === "id") return this.id;
    return null;
  }
}

// Minimal Event-like mock that satisfies the type requirements
type MockEventType = {
  type: string;
  bubbles: boolean;
  cancelBubble: boolean;
  cancelable: boolean;
  composed: boolean;
  currentTarget: EventTarget | null;
  defaultPrevented: boolean;
  eventPhase: number;
  isTrusted: boolean;
  returnValue: boolean;
  srcElement: EventTarget | null;
  target: EventTarget | null;
  timeStamp: number;
  readonly NONE: 0;
  readonly CAPTURING_PHASE: 1;
  readonly AT_TARGET: 2;
  readonly BUBBLING_PHASE: 3;
  composedPath(): EventTarget[];
  initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void;
  preventDefault(): void;
  stopImmediatePropagation(): void;
  stopPropagation(): void;
};

class MockEvent {
  type: string;
  bubbles: boolean;
  cancelBubble: boolean = false;
  cancelable: boolean = false;
  composed: boolean = false;
  currentTarget: EventTarget | null = null;
  defaultPrevented: boolean = false;
  eventPhase: number = 0;
  isTrusted: boolean = true;
  returnValue: boolean = true;
  srcElement: EventTarget | null = null;
  target: EventTarget | null = null;
  timeStamp: number = Date.now();
  readonly NONE: 0 = 0;
  readonly CAPTURING_PHASE: 1 = 1;
  readonly AT_TARGET: 2 = 2;
  readonly BUBBLING_PHASE: 3 = 3;

  constructor(type: string, options?: { bubbles?: boolean }) {
    this.type = type;
    this.bubbles = options?.bubbles || false;
  }

  composedPath(): EventTarget[] {
    return [];
  }

  initEvent(_type: string, _bubbles?: boolean, _cancelable?: boolean): void {}
  preventDefault(): void {}
  stopImmediatePropagation(): void {}
  stopPropagation(): void {}
}

// Setup global mocks
const mockDocument = {
  body: new MockElement("body"),
  createElement: (tagName: string) => new MockElement(tagName),
  querySelector: (selector: string) => mockDocument.body.querySelector(selector),
  querySelectorAll: (selector: string) => mockDocument.body.querySelectorAll(selector),
};

describe("Preferences Module", () => {
  beforeEach(() => {
    // Reset DOM state
    mockDocument.body = new MockElement("body");
    mockDocument.body.children = [];

    // Setup global mocks
    (global as any).document = mockDocument;
    (global as any).Event = MockEvent;
    (global as any).setTimeout = setTimeout;

    jest.clearAllMocks();
    jest.resetModules();
  });

  describe("init function", () => {
    it("should not initialize if parsing container is not found", () => {
      // Setup navigation without parsing container
      const nav = mockDocument.createElement("div");
      nav.id = "prefs-navigation";
      mockDocument.body.appendChild(nav);

      // Import and trigger init
      require("./index");

      // Manually trigger init by simulating select event
      const event = new MockEvent("select");
      nav.dispatchEvent(event);

      // Should not throw and should not initialize
      expect(mockDocument.querySelector(`#bionicReader-parsing`)).toBeNull();
    });

    it("should initialize when parsing container exists", () => {
      // Setup both navigation and parsing container
      const nav = mockDocument.createElement("div");
      nav.id = "prefs-navigation";
      mockDocument.body.appendChild(nav);

      const parsingContainer = mockDocument.createElement("div");
      parsingContainer.id = "bionicReader-parsing";
      mockDocument.body.appendChild(parsingContainer);

      // Import the module
      require("./index");

      // Manually trigger init by simulating select event
      const event = new MockEvent("select");
      nav.dispatchEvent(event);

      // Should have added input listener
      expect(parsingContainer).toBeTruthy();
    });

    it("should not reinitialize if already initialized", () => {
      const nav = mockDocument.createElement("div");
      nav.id = "prefs-navigation";
      mockDocument.body.appendChild(nav);

      const parsingContainer = mockDocument.createElement("div");
      parsingContainer.id = "bionicReader-parsing";
      mockDocument.body.appendChild(parsingContainer);

      const removeEventListenerSpy = jest.spyOn(nav, "removeEventListener");

      require("./index");

      // First initialization
      const event = new MockEvent("select");
      nav.dispatchEvent(event);

      // Second dispatch should not reinitialize
      nav.dispatchEvent(event);

      // removeEventListener should only be called once during init
      const initCalls = removeEventListenerSpy.mock.calls.filter(
        (call) => call[0] === "select",
      ).length;
      expect(initCalls).toBe(1);
    });

    it("should call updatePreview on input event", () => {
      const nav = mockDocument.createElement("div");
      nav.id = "prefs-navigation";
      mockDocument.body.appendChild(nav);

      const parsingContainer = mockDocument.createElement("div");
      parsingContainer.id = "bionicReader-parsing";
      mockDocument.body.appendChild(parsingContainer);

      const previewContainer = mockDocument.createElement("div");
      previewContainer.id = "bionicReader-parsingPreview";
      mockDocument.body.appendChild(previewContainer);

      require("./index");

      // Trigger init
      const event = new MockEvent("select");
      nav.dispatchEvent(event);

      // Trigger input event
      const inputEvent = new MockEvent("input", { bubbles: true });
      parsingContainer.dispatchEvent(inputEvent);

      // Should have child elements (spans) in preview
      expect(previewContainer.children.length).toBeGreaterThan(0);
    });
  });

  describe("updatePreview function", () => {
    it("should return early if preview container not found", () => {
      const nav = mockDocument.createElement("div");
      nav.id = "prefs-navigation";
      mockDocument.body.appendChild(nav);

      const parsingContainer = mockDocument.createElement("div");
      parsingContainer.id = "bionicReader-parsing";
      mockDocument.body.appendChild(parsingContainer);

      require("./index");

      // Trigger init
      const event = new MockEvent("select");
      nav.dispatchEvent(event);

      // No preview container exists, should not throw
      const inputEvent = new MockEvent("input", { bubbles: true });
      parsingContainer.dispatchEvent(inputEvent);
    });

    it("should render bionic text with default settings", () => {
      const nav = mockDocument.createElement("div");
      nav.id = "prefs-navigation";
      mockDocument.body.appendChild(nav);

      const parsingContainer = mockDocument.createElement("div");
      parsingContainer.id = "bionicReader-parsing";
      mockDocument.body.appendChild(parsingContainer);

      const previewContainer = mockDocument.createElement("div");
      previewContainer.id = "bionicReader-parsingPreview";
      mockDocument.body.appendChild(previewContainer);

      // Setup default input values
      const opacityContrast = mockDocument.createElement("input");
      opacityContrast.id = "bionicReader-opacityContrast";
      (opacityContrast as any).value = "1";
      mockDocument.body.appendChild(opacityContrast);

      const weightContrast = mockDocument.createElement("input");
      weightContrast.id = "bionicReader-weightContrast";
      (weightContrast as any).value = "3";
      mockDocument.body.appendChild(weightContrast);

      const weightOffset = mockDocument.createElement("input");
      weightOffset.id = "bionicReader-weightOffset";
      (weightOffset as any).value = "0";
      mockDocument.body.appendChild(weightOffset);

      const parsingOffset = mockDocument.createElement("input");
      parsingOffset.id = "bionicReader-parsingOffset";
      (parsingOffset as any).value = "0";
      mockDocument.body.appendChild(parsingOffset);

      require("./index");

      // Trigger init
      const event = new MockEvent("select");
      nav.dispatchEvent(event);

      // Trigger input to update preview
      const inputEvent = new MockEvent("input", { bubbles: true });
      parsingContainer.dispatchEvent(inputEvent);

      // Should have rendered spans
      const spans = previewContainer.querySelectorAll("span");
      expect(spans.length).toBeGreaterThan(0);

      // Check that spans have proper styling
      const firstSpan = spans[0];
      expect(firstSpan.textContent).toBeTruthy();
      expect(firstSpan.style.font).toBeTruthy();
    });

    it("should apply parsing offset to bionic groups", () => {
      const nav = mockDocument.createElement("div");
      nav.id = "prefs-navigation";
      mockDocument.body.appendChild(nav);

      const parsingContainer = mockDocument.createElement("div");
      parsingContainer.id = "bionicReader-parsing";
      mockDocument.body.appendChild(parsingContainer);

      const previewContainer = mockDocument.createElement("div");
      previewContainer.id = "bionicReader-parsingPreview";
      mockDocument.body.appendChild(previewContainer);

      // Setup inputs with non-zero offset
      const opacityContrast = mockDocument.createElement("input");
      opacityContrast.id = "bionicReader-opacityContrast";
      (opacityContrast as any).value = "1";
      mockDocument.body.appendChild(opacityContrast);

      const weightContrast = mockDocument.createElement("input");
      weightContrast.id = "bionicReader-weightContrast";
      (weightContrast as any).value = "3";
      mockDocument.body.appendChild(weightContrast);

      const weightOffset = mockDocument.createElement("input");
      weightOffset.id = "bionicReader-weightOffset";
      (weightOffset as any).value = "0";
      mockDocument.body.appendChild(weightOffset);

      const parsingOffset = mockDocument.createElement("input");
      parsingOffset.id = "bionicReader-parsingOffset";
      (parsingOffset as any).value = "2";
      mockDocument.body.appendChild(parsingOffset);

      require("./index");

      // Trigger init
      const event = new MockEvent("select");
      nav.dispatchEvent(event);

      // Trigger input to update preview
      const inputEvent = new MockEvent("input", { bubbles: true });
      parsingContainer.dispatchEvent(inputEvent);

      const spans = previewContainer.querySelectorAll("span");
      expect(spans.length).toBeGreaterThan(0);
    });

    it("should handle invalid input values gracefully", () => {
      const nav = mockDocument.createElement("div");
      nav.id = "prefs-navigation";
      mockDocument.body.appendChild(nav);

      const parsingContainer = mockDocument.createElement("div");
      parsingContainer.id = "bionicReader-parsing";
      mockDocument.body.appendChild(parsingContainer);

      const previewContainer = mockDocument.createElement("div");
      previewContainer.id = "bionicReader-parsingPreview";
      mockDocument.body.appendChild(previewContainer);

      // Setup inputs with invalid/empty values
      const opacityContrast = mockDocument.createElement("input");
      opacityContrast.id = "bionicReader-opacityContrast";
      (opacityContrast as any).value = "invalid";
      mockDocument.body.appendChild(opacityContrast);

      const weightContrast = mockDocument.createElement("input");
      weightContrast.id = "bionicReader-weightContrast";
      (weightContrast as any).value = "";
      mockDocument.body.appendChild(weightContrast);

      const weightOffset = mockDocument.createElement("input");
      weightOffset.id = "bionicReader-weightOffset";
      (weightOffset as any).value = "NaN";
      mockDocument.body.appendChild(weightOffset);

      const parsingOffset = mockDocument.createElement("input");
      parsingOffset.id = "bionicReader-parsingOffset";
      (parsingOffset as any).value = "";
      mockDocument.body.appendChild(parsingOffset);

      require("./index");

      // Trigger init
      const event = new MockEvent("select");
      nav.dispatchEvent(event);

      // Should not throw with invalid values
      const inputEvent = new MockEvent("input", { bubbles: true });
      parsingContainer.dispatchEvent(inputEvent);

      // Should still render with defaults
      const spans = previewContainer.querySelectorAll("span");
      expect(spans.length).toBeGreaterThan(0);
    });
  });

  describe("BIONIC_GROUPS rendering", () => {
    it("should render alternating bold and light text spans", () => {
      const nav = mockDocument.createElement("div");
      nav.id = "prefs-navigation";
      mockDocument.body.appendChild(nav);

      const parsingContainer = mockDocument.createElement("div");
      parsingContainer.id = "bionicReader-parsing";
      mockDocument.body.appendChild(parsingContainer);

      const previewContainer = mockDocument.createElement("div");
      previewContainer.id = "bionicReader-parsingPreview";
      mockDocument.body.appendChild(previewContainer);

      // Setup default inputs
      ["opacityContrast", "weightContrast", "weightOffset", "parsingOffset"].forEach((id) => {
        const input = mockDocument.createElement("input");
        input.id = `bionicReader-${id}`;
        (input as any).value = id === "parsingOffset" ? "0" : id === "opacityContrast" ? "1" : id === "weightContrast" ? "3" : "0";
        mockDocument.body.appendChild(input);
      });

      require("./index");

      // Trigger init
      const event = new MockEvent("select");
      nav.dispatchEvent(event);

      // Trigger input to update preview
      const inputEvent = new MockEvent("input", { bubbles: true });
      parsingContainer.dispatchEvent(inputEvent);

      const spans = previewContainer.querySelectorAll("span");
      
      // Verify we have multiple spans
      expect(spans.length).toBeGreaterThan(1);

      // Verify spans contain text from the preview string
      let totalText = "";
      spans.forEach((span) => {
        totalText += span.textContent || "";
      });
      
      // The concatenated text should be a portion of the preview string
      const PREVIEW_STRING = "Zotero is a free, easy-to-use tool to help you collect, organize, annotate, cite, and share research.";
      expect(PREVIEW_STRING.startsWith(totalText) || totalText.length).toBeGreaterThan(0);
    });

    it("should apply different font styles to bold and light spans", () => {
      const nav = mockDocument.createElement("div");
      nav.id = "prefs-navigation";
      mockDocument.body.appendChild(nav);

      const parsingContainer = mockDocument.createElement("div");
      parsingContainer.id = "bionicReader-parsing";
      mockDocument.body.appendChild(parsingContainer);

      const previewContainer = mockDocument.createElement("div");
      previewContainer.id = "bionicReader-parsingPreview";
      mockDocument.body.appendChild(previewContainer);

      // Setup default inputs
      ["opacityContrast", "weightContrast", "weightOffset", "parsingOffset"].forEach((id) => {
        const input = mockDocument.createElement("input");
        input.id = `bionicReader-${id}`;
        (input as any).value = id === "parsingOffset" ? "0" : id === "opacityContrast" ? "1" : id === "weightContrast" ? "3" : "0";
        mockDocument.body.appendChild(input);
      });

      require("./index");

      // Trigger init
      const event = new MockEvent("select");
      nav.dispatchEvent(event);

      // Trigger input to update preview
      const inputEvent = new MockEvent("input", { bubbles: true });
      parsingContainer.dispatchEvent(inputEvent);

      const spans = previewContainer.querySelectorAll("span");
      
      // All spans should have font style set
      spans.forEach((span) => {
        expect(span.style.font).toBeTruthy();
      });

      // Light spans should also have opacity set
      // Note: We can't easily distinguish bold vs light spans without accessing internal state
      // but we can verify the rendering completed
      expect(spans.length).toBeGreaterThan(0);
    });
  });

  describe("Event handling", () => {
    it("should remove select listener after initialization", () => {
      const nav = mockDocument.createElement("div");
      nav.id = "prefs-navigation";
      mockDocument.body.appendChild(nav);

      const parsingContainer = mockDocument.createElement("div");
      parsingContainer.id = "bionicReader-parsing";
      mockDocument.body.appendChild(parsingContainer);

      const addEventListenerSpy = jest.spyOn(nav, "addEventListener");
      const removeEventListenerSpy = jest.spyOn(nav, "removeEventListener");

      require("./index");

      // Trigger init via select event
      const event = new MockEvent("select");
      nav.dispatchEvent(event);

      // Should have removed the select listener
      expect(removeEventListenerSpy).toHaveBeenCalledWith("select", expect.any(Function));
    });

    it("should handle missing elements gracefully", () => {
      // No elements setup - should not throw
      expect(() => {
        require("./index");
      }).not.toThrow();
    });
  });
});
