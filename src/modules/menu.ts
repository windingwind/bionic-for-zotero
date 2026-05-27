import { getPref, setPref } from "../utils/prefs";
import { toggleCurrentItemStatus, getCurrentItemStatus } from "../utils/status";

export { initMenus };

function initMenus(_win: _ZoteroTypes.MainWindow): void {
  Zotero.MenuManager.registerMenu({
    menuID: "bionicReaderMenu",
    pluginID: addon.data.config.addonID,
    target: "main/menubar/view",
    menus: [
      { menuType: "separator", enableForTabTypes: ["reader/pdf"] },
      {
        menuType: "menuitem",
        l10nID: `${addon.data.config.addonRef}-menu-enableBionic`,
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
        l10nID: `${addon.data.config.addonRef}-menu-enableBionicForCurrentItem`,
        enableForTabTypes: ["reader/pdf"],
        onShowing: (_ev, context) => {
          const itemID = (
            context as _ZoteroTypes.MenuManager.MenubarMenuContext
          ).items?.[0]?.id;
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
        onCommand: (_ev, context) => {
          const itemID = (
            context as _ZoteroTypes.MenuManager.MenubarMenuContext
          ).items?.[0]?.id;
          if (!itemID) {
            return;
          }
          toggleCurrentItemStatus(itemID);
        },
      },
      {
        menuType: "menuitem",
        l10nID: `${addon.data.config.addonRef}-menu-refreshReaders`,
        enableForTabTypes: ["reader/pdf"],
        onCommand: () => {
          addon.hooks.onRefreshReaders();
        },
      },
    ],
  });
}
