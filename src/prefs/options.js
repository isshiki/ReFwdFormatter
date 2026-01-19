
const kCurrentLegacyMigration = 1;  // Migration flag. 0: not-migrated, 1: already-migrated

const kPrefDefaults = {
  replytext_on: true,
  replyhtml_on: true,
  caret_position: 'top'  // 'top', 'bottom', 'auto', or 'quote' - default is top
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
      prefs[prefName] = await browser.myapi.getPref(`extensions.refwdformatter.${oldName}`);
      if (prefs[prefName] === undefined) {
        prefs[prefName] = kPrefDefaults[prefName];
      }
    }
  }

  prefs.migratedLegacy = kCurrentLegacyMigration;
  await browser.storage.local.set({ "preferences": prefs });
  return prefs;
}

async function updateAutoDetectedLabel() {
  const autoSpan = document.getElementById("autoDetectedPosition");
  autoSpan.textContent = '';

  try {
    const hasPermission = await browser.permissions.contains({
      permissions: ['accountsRead']
    });

    if (!hasPermission) {
      autoSpan.textContent = `(${browser.i18n.getMessage("detectionNeedsPermissionLabel")})`;
      autoSpan.style.cursor = 'pointer';
      autoSpan.style.textDecoration = 'underline';
      return;
    }

    autoSpan.style.cursor = 'default';
    autoSpan.style.textDecoration = 'none';
    autoSpan.textContent = `(${browser.i18n.getMessage("permissionGrantedLabel")})`;
  } catch (error) {
    console.error('[ReFwdFormatter] Failed to detect Thunderbird reply position:', error);
    autoSpan.textContent = `(${browser.i18n.getMessage("detectionUnavailableLabel")})`;
  }
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
  } else if (document.getElementById("caretAuto").checked) {
    caretPosition = 'auto';

    // If auto is selected, detect the current Thunderbird setting
    await updateAutoDetectedLabel();
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

  // Set caret position radio buttons with fallback to 'bottom'
  const caretPos = prefs.caret_position || 'bottom';
  document.getElementById("caretTop").checked = (caretPos === 'top');
  document.getElementById("caretBottom").checked = (caretPos === 'bottom');
  document.getElementById("caretQuote").checked = (caretPos === 'quote');
  document.getElementById("caretAuto").checked = (caretPos === 'auto');

  // If auto is selected, update the display
  if (caretPos === 'auto') {
    await updateAutoDetectedLabel();
  } else {
    document.getElementById("autoDetectedPosition").textContent = '';
  }
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
                   "caretAutoLabel",
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
  const autoSpan = document.getElementById("autoDetectedPosition");

  document.getElementById("saveButton").onclick = async (event) => {
    event.preventDefault();
    let permissionGranted = true;
    // permissions.request must be called directly from a user input handler
    if (document.getElementById("caretAuto").checked) {
      permissionGranted = await browser.permissions.request({
        permissions: ['accountsRead']
      });
      if (!permissionGranted) {
        // Fallback to "top" when auto can't work
        document.getElementById("caretTop").checked = true;
        document.getElementById("caretAuto").checked = false;
      }
    }
    await savePrefs();
    var today = new Date();
    if (!permissionGranted) {
      statusInfo.innerText = browser.i18n.getMessage("autoPermissionDeniedWarning").toString() + today.toString();
    } else {
      statusInfo.innerText = browser.i18n.getMessage("msgSaved").toString() + today.toString();
    }
  };

  document.getElementById("cancelButton").onclick = async (event) => {
    event.preventDefault();
    await restorePrefs();
    var today = new Date();
    statusInfo.innerText = browser.i18n.getMessage("msgCancelled").toString() + today.toString();
  };

  autoSpan.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    // Request immediately in the user gesture call stack
    browser.permissions.request({
      permissions: ['accountsRead']
    }).then(() => {
      return updateAutoDetectedLabel();
    }).catch((error) => {
      console.error('[ReFwdFormatter] Failed to request permission:', error);
    });
  };

  document.getElementById("caretAuto").onchange = async () => {
    if (document.getElementById("caretAuto").checked) {
      await updateAutoDetectedLabel();
    }
  };

  const clearAutoLabel = () => {
    document.getElementById("autoDetectedPosition").textContent = '';
  };
  document.getElementById("caretTop").onchange = clearAutoLabel;
  document.getElementById("caretBottom").onchange = clearAutoLabel;
  document.getElementById("caretQuote").onchange = clearAutoLabel;

}

main().catch(console.error);

