export { initPreferencePane };

function initPreferencePane() {
  Zotero.PreferencePanes.register({
    src: rootURI + "chrome/content/preferences.xhtml",
    pluginID: addon.data.config.addonID,
    label: "Bionic",
  });
}
