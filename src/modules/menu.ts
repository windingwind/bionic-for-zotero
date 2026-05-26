import { getPref, setPref } from "../utils/prefs";
import { toggleCurrentItemStatus, getCurrentItemStatus } from "../utils/status";

export { initMenus };

function initMenus(_win: _ZoteroTypes.MainWindow): void {
  const VIEW_MENU_ID = `${addon.data.config.addonRef}-menu-view`;
  Zotero.MenuManager.registerMenu({
    menuID: VIEW_MENU_ID,
    pluginID: addon.data.config.addonID,
    target: "main/menubar/view",
    menus: [
      { menuType: "separator", enableForTabTypes: ["reader/pdf"] },
      {
        menuType: "menuitem",
        l10nID: "menu-enableBionic",
        enableForTabTypes: ["reader/pdf"],
        onShowing: (_ev, context) => {
          context.menuElem.setAttribute("type", "checkbox");
          context.menuElem.setAttribute(
            "checked",
            getPref("enableBionicReader") ? "true" : "false",
          );
        },
        onCommand: () => {
          setPref("enableBionicReader", !getPref("enableBionicReader"));
        },
      },
      {
        menuType: "menuitem",
        l10nID: "menu-enableBionicForCurrentItem",
        enableForTabTypes: ["reader/pdf"],
        onShowing: (_ev, context) => {
          const itemID = Zotero.Reader.selectedReader?.itemID;
          if (!itemID) {
            context.setVisible(false);
            return;
          }
          context.menuElem.setAttribute("type", "checkbox");
          context.menuElem.setAttribute(
            "checked",
            getCurrentItemStatus(itemID) ? "true" : "false",
          );
        },
        onCommand: () => {
          const itemID = Zotero.Reader.selectedReader?.itemID;
          if (!itemID) {
            return;
          }
          toggleCurrentItemStatus(itemID);
        },
      },
      {
        menuType: "menuitem",
        l10nID: "menu-refreshReaders",
        enableForTabTypes: ["reader/pdf"],
        onCommand: () => {
          addon.hooks.onRefreshReaders();
        },
      },
    ],
  });
}
