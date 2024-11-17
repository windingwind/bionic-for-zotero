export { initSettings, unInitSettings };

let prefsObservers: symbol[] = [];

const PREFS_TO_OBSERVE = [
  "enableBionicReader",
  "parsingOffset",
  "parsingContrast",
];

function initSettings() {
  prefsObservers = PREFS_TO_OBSERVE.map((pref) => {
    return Zotero.Prefs.registerObserver(
      `${addon.data.config.prefsPrefix}.${pref}`,
      () => addon.hooks.onRefreshReaders(),
      true,
    );
  });
}

function unInitSettings() {
  prefsObservers.forEach((observer) => {
    Zotero.Prefs.unregisterObserver(observer);
  });
}
