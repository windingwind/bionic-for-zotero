import { getPrefJSON, getPref, setPref } from "./prefs";

export { getCurrentItemStatus, toggleCurrentItemStatus };

function getCurrentItemStatus(itemID: number): boolean {
  const bionicTemporaryData = getPrefJSON("bionicTemporaryData");
  let currentStatus = bionicTemporaryData[itemID];
  if (currentStatus === undefined) {
    const item = Zotero.Items.getTopLevel([Zotero.Items.get(itemID)])[0];
    if (isDisabledLanguage(item.getField("language"))) {
      return false;
    }
    currentStatus = !!getPref("enableBionicReader");
  }
  return currentStatus;
}

function isDisabledLanguage(lang: string): boolean {
  const disabledLanguages = (
    (getPref("disableForLanguages") as string) || ""
  ).toLocaleLowerCase();
  if (!disabledLanguages) {
    return false;
  }
  const langSplitter = lang.includes("-") ? "-" : "_";
  const langPart = lang.split(langSplitter)[0].toLocaleLowerCase();
  if (!langPart) {
    return false;
  }
  return disabledLanguages.includes(langPart);
}

function toggleCurrentItemStatus(itemID: number): void {
  const bionicTemporaryData = getPrefJSON("bionicTemporaryData");
  let currentStatus = bionicTemporaryData[itemID];
  if (currentStatus === undefined) {
    currentStatus = !!getPref("enableBionicReader");
  }
  bionicTemporaryData[itemID] = !currentStatus;
  setPref("bionicTemporaryData", JSON.stringify(bionicTemporaryData));
  addon.hooks.onRefreshReaders(
    Zotero.Reader._readers.filter((reader) => reader.itemID === itemID),
  );
}
