import { getString } from "../utils/locale";
import { getPref, setPref } from "../utils/prefs";
import { toggleCurrentItemStatus, getCurrentItemStatus } from "../utils/status";

export { initMenus };

function initMenus(win: _ZoteroTypes.MainWindow): void {
  ztoolkit.Menu.register("menuView", {
    tag: "menuseparator",
    id: `${addon.data.config.addonRef}-menu-view-separator`,
    classList: ["menu-type-reader", "pdf"],
  });

  ztoolkit.Menu.register("menuView", {
    tag: "menuitem",
    id: `${addon.data.config.addonRef}-menu-view-enable-bionic`,
    classList: ["menu-type-reader", "pdf"],
    label: getString("menu-enableBionic"),
    type: "checkbox",
    commandListener: () => {
      setPref("enableBionicReader", !getPref("enableBionicReader"));
    },
    getVisibility(elem, ev) {
      elem.setAttribute(
        "checked",
        getPref("enableBionicReader") ? "true" : "false",
      );
      return undefined;
    },
  });

  ztoolkit.Menu.register("menuView", {
    tag: "menuitem",
    id: `${addon.data.config.addonRef}-menu-view-enable-bionic-current-item`,
    classList: ["menu-type-reader", "pdf"],
    label: getString("menu-enableBionicForCurrentItem"),
    type: "checkbox",
    commandListener: () => {
      const itemID = Zotero.Reader.getByTabID(
        win.Zotero_Tabs.selectedID,
      ).itemID;
      if (!itemID) {
        return;
      }
      toggleCurrentItemStatus(itemID);
    },
    getVisibility(elem, ev) {
      const itemID = Zotero.Reader.getByTabID(
        win.Zotero_Tabs.selectedID,
      ).itemID;
      if (!itemID) {
        return false;
      }
      elem.setAttribute(
        "checked",
        getCurrentItemStatus(itemID) ? "true" : "false",
      );
      return undefined;
    },
  });

  ztoolkit.Menu.register("menuView", {
    tag: "menuitem",
    id: `${addon.data.config.addonRef}-menu-view-refresh-readers`,
    classList: ["menu-type-reader", "pdf"],
    label: getString("menu-refreshReaders"),
    commandListener: () => {
      addon.hooks.onRefreshReaders();
    },
  });
}
