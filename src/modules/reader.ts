import { wait } from "zotero-plugin-toolkit";
import { getPref } from "../utils/prefs";
import { getCurrentItemStatus, toggleCurrentItemStatus } from "../utils/status";

export { initReader, unInitReader, refreshReaders };

const scriptContent = {
  pdf: "",
  epub: "",
  snapshot: "",
};

function initReader() {
  Zotero.Reader.registerEventListener(
    "renderToolbar",
    (event) => {
      injectScript(event);
      injectToolbarButton(event);
    },
    addon.data.config.addonID,
  );

  Zotero.Reader._readers.forEach((reader) => {
    injectScript({ reader });
  });
}

function unInitReader() {
  Zotero.Reader._readers.forEach((reader) => {
    if (reader.type !== "pdf") {
      return;
    }
    // @ts-ignore  Not typed yet
    const win = reader._primaryView._iframeWindow as Window;
    deleteWindowPrefs(win);
    const script = win.document.getElementById("bionic-reader");
    if (script) {
      script.remove();
    }
  });
}

async function injectScript(event: { reader: _ZoteroTypes.ReaderInstance }) {
  const { reader } = event;
  const win = await waitForReaderPDFViewer(reader);
  if (!win) {
    return;
  }
  setWindowPrefs(reader, win);
  const doc = win.document;
  const type = reader.type;
  if (type !== "pdf") {
    return;
  }
  ztoolkit.log("Injecting reader script", type);
  const script = doc.createElement("script");
  script.id = "bionic-reader";
  if (!(type in scriptContent)) {
    ztoolkit.log("Unknown reader type", type);
    return;
  }
  if (!scriptContent[type]) {
    scriptContent[type] = await Zotero.File.getContentsFromURLAsync(
      `chrome://${addon.data.config.addonRef}/content/scripts/reader/${type}.js`,
    );
  }
  script.textContent = scriptContent[type];
  doc.head.appendChild(script);
}

function injectToolbarButton(event: {
  reader: _ZoteroTypes.ReaderInstance;
  doc: Document;
  append: (...elems: Node[]) => void;
}) {
  if (!getPref("enableReaderToolbarButton")) {
    return;
  }

  const { reader, doc, append } = event;

  if (reader.type !== "pdf") {
    return;
  }

  const button = ztoolkit.UI.createElement(doc, "button", {
    namespace: "html",
    classList: [
      "toolbar-button",
      `${addon.data.config.addonRef}-reader-button`,
    ],
    properties: {
      tabIndex: -1,
    },
    listeners: [
      {
        type: "click",
        listener: async (ev: Event) => {
          ev.preventDefault();
          ev.stopPropagation();
          (ev.target as HTMLButtonElement).disabled = true;
          const currentWin = await waitForReaderPDFViewer(reader);
          if (!currentWin) {
            return;
          }
          toggleCurrentItemStatus(reader.itemID || -1);
        },
      },
    ],
    enableElementRecord: false,
  });
  updateReaderToolbarButton(button, reader);
  append(button);
}

function updateReaderToolbarButton(
  button: HTMLButtonElement,
  reader: _ZoteroTypes.ReaderInstance,
  enableBionicReader?: boolean,
) {
  if (!button) {
    return;
  }
  if (enableBionicReader === undefined) {
    enableBionicReader = getCurrentItemStatus(reader.itemID || -1);
  }
  button.title = enableBionicReader ? "Bionic Mode" : "Normal Mode";
  button.innerHTML = enableBionicReader
    ? `<b>Bi</b><span style="font-weight: lighter">o</span>`
    : "Bio";
  button.disabled = false;
}

async function waitForReaderPDFViewer(
  reader: _ZoteroTypes.ReaderInstance,
): Promise<Window | null> {
  if (reader.type !== "pdf") {
    return null;
  }
  await wait.waitForReader(reader);
  await wait.waitUtilAsync(
    // @ts-ignore  Not typed yet
    () => reader._primaryView?._iframeWindow,
    100,
    10000,
  );
  // @ts-ignore  Not typed yet
  const win = reader._primaryView._iframeWindow;
  await wait.waitUtilAsync(
    () => win.PDFViewerApplication?.pdfViewer,
    100,
    10000,
  );
  return win;
}

async function refreshReader(reader: _ZoteroTypes.ReaderInstance) {
  const win = await waitForReaderPDFViewer(reader);
  if (!win) {
    return;
  }
  setWindowPrefs(reader, win);
  const button = reader._iframeWindow?.document.querySelector(
    `.${addon.data.config.addonRef}-reader-button`,
  ) as HTMLButtonElement;
  if (button) {
    updateReaderToolbarButton(button, reader, win.__BIONIC_READER_ENABLED);
  }
  await win.PDFViewerApplication?.pdfViewer?.refresh();
}

async function refreshReaders(readers?: _ZoteroTypes.ReaderInstance[]) {
  if (!readers) {
    readers = Zotero.Reader._readers;
  }
  await Promise.all(
    readers.map(async (reader) => {
      return await refreshReader(reader);
    }),
  );
}

function setWindowPrefs(reader: _ZoteroTypes.ReaderInstance, win: Window) {
  win.__BIONIC_READER_ENABLED = getCurrentItemStatus(reader.itemID || -1);
  win.__BIONIC_PARSING_OFFSET = getPref("parsingOffset") || 0;
  win.__BIONIC_PARSING_CONTRAST = getPref("parsingContrast") || 1;
}

function deleteWindowPrefs(win: Window) {
  delete win.__BIONIC_READER_ENABLED;
  delete win.__BIONIC_PARSING_OFFSET;
  delete win.__BIONIC_PARSING_CONTRAST;
}
