import { getPrefJSON, getPref, setPref } from "./prefs";

export { getCurrentItemStatus, toggleCurrentItemStatus };

function getCurrentItemStatus(itemID: number): boolean {
  const bionicTemporaryData = getPrefJSON("bionicTemporaryData");
  let currentStatus = bionicTemporaryData[itemID];
  if (currentStatus === undefined) {
    currentStatus = !!getPref("enableBionicReader");
  }
  return currentStatus;
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
