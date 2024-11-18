export { initPreferencePane };

function initPreferencePane() {
  Zotero.PreferencePanes.register({
    src: rootURI + "chrome/content/preferences.xhtml",
    pluginID: addon.data.config.addonID,
    label: "Bionic",
    scripts: [
      `chrome://${addon.data.config.addonRef}/content/scripts/preferences.js`,
    ],
    stylesheets: [
      `chrome://${addon.data.config.addonRef}/content/preferences.css`,
    ],
  });
}
