export { isWindowAlive, showRestartDialog };

/**
 * Check if the window is alive.
 * Useful to prevent opening duplicate windows.
 * @param win
 */
function isWindowAlive(win?: Window) {
  return win && !Components.utils.isDeadWrapper(win) && !win.closed;
}

function showRestartDialog() {
  const ps = Services.prompt;
  const buttonFlags =
    ps.BUTTON_POS_0 * ps.BUTTON_TITLE_IS_STRING +
    ps.BUTTON_POS_1 * ps.BUTTON_TITLE_IS_STRING;
  const index = ps.confirmEx(
    // @ts-ignore
    null,
    Zotero.getString("general.restartRequired"),
    Zotero.getString("general.restartRequiredForChange", Zotero.appName),
    buttonFlags,
    Zotero.getString("general.restartNow"),
    Zotero.getString("general.restartLater"),
    null,
    null,
    {},
  );

  if (index == 0) {
    Zotero.Utilities.Internal.quit(true);
  }
}
