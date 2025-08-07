import { config } from "../package.json";
import { initMenus } from "./modules/menu";
import { initPreferencePane } from "./modules/preferences";
import { initSettings, unInitSettings } from "./modules/settings";
import { initReader, refreshReaders, unInitReader } from "./modules/reader";
import { initLocale } from "./utils/locale";
import { showRestartDialog } from "./utils/window";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  initLocale();

  initPreferencePane();

  initReader();

  initSettings();

  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  // @ts-ignore This is a moz feature
  win.MozXULElement.insertFTLIfNeeded(`${config.addonRef}-mainWindow.ftl`);

  ztoolkit.log("onMainWindowLoad", { win });

  initMenus(win);
}

async function onMainWindowUnload(
  win: _ZoteroTypes.MainWindow,
): Promise<void> {}

function onShutdown(): void {
  unInitSettings();

  unInitReader();

  ztoolkit.unregisterAll();
  // Remove addon object
  addon.data.alive = false;
  // @ts-ignore Plugin instance is not typed
  delete Zotero[config.addonInstance];
}

const onRefreshReaders = refreshReaders;

const onShowRestartDialog = showRestartDialog;

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onRefreshReaders,
  onShowRestartDialog,
};
