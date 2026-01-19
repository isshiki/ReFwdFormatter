
const kCurrentLegacyMigration = 1;  // Migration flag. 0: not-migrated, 1: already-migrated

const kPrefDefaults = {
  replytext_on: true,
  replyhtml_on: true,
  caret_position: 'top'  // 'top', 'bottom', or 'quote' - default is top
};


async function loadPrefs() {

  //await browser.storage.local.clear();  // for migration test

  const results = await browser.storage.local.get("preferences");

  const currentMigration =
    results.preferences && results.preferences.migratedLegacy
      ? results.preferences.migratedLegacy
      : 0;

  if (currentMigration >= kCurrentLegacyMigration) {
    return results.preferences;
  }

  let prefs = results.preferences || {};

  if (currentMigration < 1) {
    for (const prefName of Object.getOwnPropertyNames(kPrefDefaults)) {
      let oldName = prefName.replace("_on", ".on");
      if (prefs[prefName] === undefined) {
        prefs[prefName] = kPrefDefaults[prefName];
      }
    }
  }

  prefs.migratedLegacy = kCurrentLegacyMigration;
  await browser.storage.local.set({ "preferences": prefs });
  return prefs;
}

async function savePrefs() {
  // Get caret position from radio buttons
  let caretPosition = 'bottom'; // default
  if (document.getElementById("caretTop").checked) {
    caretPosition = 'top';
  } else if (document.getElementById("caretBottom").checked) {
    caretPosition = 'bottom';
  } else if (document.getElementById("caretQuote").checked) {
    caretPosition = 'quote';
  }

  let prefs = {
    replytext_on: (document.getElementById("replytext").checked === true),
    replyhtml_on: (document.getElementById("replyhtml").checked === true),
    caret_position: caretPosition,
    migratedLegacy: kCurrentLegacyMigration,
  };
  await browser.storage.local.set({ "preferences": prefs });
  return prefs;
}

async function resetPrefs(prefs) {
  document.getElementById("replytext").checked = prefs.replytext_on;
  document.getElementById("replyhtml").checked = prefs.replyhtml_on;

  // Set caret position radio buttons with fallback to 'top'
  let caretPos = prefs.caret_position || 'top';
  if (caretPos !== 'top' && caretPos !== 'bottom' && caretPos !== 'quote') {
    caretPos = 'top';
  }
  document.getElementById("caretTop").checked = (caretPos === 'top');
  document.getElementById("caretBottom").checked = (caretPos === 'bottom');
  document.getElementById("caretQuote").checked = (caretPos === 'quote');
}

async function restorePrefs() {
  const results = await browser.storage.local.get("preferences");
  let prefs = results.preferences;
  await resetPrefs(prefs);
  return prefs;
}

async function main() {

  document.title = browser.i18n.getMessage("optionTitle");

  for (let key of ["replytextLabel",
                   "replyhtmlLabel",
                   "caretPositionLabel",
                   "caretTopLabel",
                   "caretBottomLabel",
                   "caretQuoteLabel",
                   "btnSaveLabel",
                   "btnCancelLabel"]) {
    let elm = document.getElementById(key);
    elm.appendChild(document.createTextNode(" " + browser.i18n.getMessage(key)));
  }

  const imeTip = document.getElementById("imeTip");
  imeTip.appendChild(document.createTextNode(browser.i18n.getMessage("imeWorkaroundTip")));

  const prefs = await loadPrefs();
  //console.log({ prefs });

  await resetPrefs(prefs);

  const statusInfo = document.getElementById("statusInfo");

  document.getElementById("saveButton").onclick = async (event) => {
    event.preventDefault();
    await savePrefs();
    var today = new Date();
    statusInfo.innerText = browser.i18n.getMessage("msgSaved").toString() + today.toString();
  };

  document.getElementById("cancelButton").onclick = async (event) => {
    event.preventDefault();
    await restorePrefs();
    var today = new Date();
    statusInfo.innerText = browser.i18n.getMessage("msgCancelled").toString() + today.toString();
  };

}

main().catch(console.error);

