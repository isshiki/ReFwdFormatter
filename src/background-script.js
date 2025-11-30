var refwdformatter = {

  processed: new Set(),  // Track processed tabs to avoid re-processing
  processing: new Set(), // Track tabs currently being processed (prevents overlapping attempts)

  kCurrentLegacyMigration: 1,  // Migration flag. 0: not-migrated, 1: already-migrated
  kProcessingDelays: [250, 400, 600, 800], // Delays (ms) for staggered retries to let compose editor finish init
  kPrefDefaults: {
    replytext_on: true,
    replyhtml_on: true
  },
  loadPrefs: async function () {

    const results = await browser.storage.local.get("preferences");

    const currentMigration =
      results.preferences && results.preferences.migratedLegacy
        ? results.preferences.migratedLegacy
        : 0;

    if (currentMigration >= refwdformatter.kCurrentLegacyMigration) {
      return results.preferences;
    }

    let prefs = results.preferences || {};

    if (currentMigration < 1) {
      for (const prefName of Object.getOwnPropertyNames(refwdformatter.kPrefDefaults)) {
        prefs[prefName] = refwdformatter.kPrefDefaults[prefName];
      }
    }

    prefs.migratedLegacy = refwdformatter.kCurrentLegacyMigration;
    await browser.storage.local.set({ "preferences": prefs });
    return prefs;
  },

  format: async function (tab, attemptIndex = 0) {
    // Skip if already processed
    if (refwdformatter.processed.has(tab.id)) {
      return;
    }

    // Prevent overlapping runs for the same tab
    if (refwdformatter.processing.has(tab.id)) {
      return;
    }

    refwdformatter.processing.add(tab.id);

    const maxAttempts = refwdformatter.kProcessingDelays.length;
    let shouldRetry = false;

    try {
      // Check if this is a compose window
      let details;
      try {
        details = await browser.compose.getComposeDetails(tab.id);
      } catch(error) {
        shouldRetry = true;  // Compose editor not ready yet
      }

      if (!details) {
        if (shouldRetry && attemptIndex + 1 < maxAttempts) {
          refwdformatter.scheduleFormat(tab, attemptIndex + 1);
        }
        return;
      }

      // Get preferences
      const prefs = await refwdformatter.loadPrefs();
      const ret = prefs.replytext_on;
      const reh = prefs.replyhtml_on;

      // Check if this is a reply (has citation prefix)
      let indexCite = details.body.indexOf("class=\"moz-cite-prefix\"");
      if (indexCite === -1) {
        indexCite = details.body.indexOf("id=\"smartTemplate4-quoteHeader\"");
      }
      if (indexCite === -1) {
        indexCite = details.body.indexOf("class=\"ehr-email-headers-table\"");
      }

      if (indexCite === -1) {
        refwdformatter.processed.add(tab.id); // Not a reply
        return;
      }

      // Check if this is a forward
      let indexFwd = details.body.indexOf("class=\"moz-forward-container\"");
      if (indexFwd !== -1 && indexFwd < indexCite) {
        refwdformatter.processed.add(tab.id); // Forward - do nothing
        return;
      }

      let isPlainText = details.isPlainText;
      let isHtml = !isPlainText;

      if (ret || reh) {
        let htmlbody = details.body;

        if (htmlbody !== "<br>") {
          if (ret && isPlainText) {
            // Plain text processing
            let textbody = details.plainTextBody;

            // Remove quote prefixes
            textbody = textbody.replace("\r\n", "\n").replace("\r", "\n").replace("\n", "\r\n").
              replace(/\n> {2}/g, "\n ").
              replace(/\n> /g, "\n").
              replace(/\n>((>)+) /g, "\n$1 ").
              replace(/\n>((>)+)\r/g, "\n$1\r").
              replace(/\n>((>)+)$/g, "\n$1");

            await browser.compose.setComposeDetails(tab.id, { plainTextBody: textbody });

          } else if (reh && isHtml) {
            // HTML processing
            let document = new DOMParser().parseFromString(htmlbody, "text/html");

            if (document.body.hasChildNodes()) {
              // Replace the first <blockquote> tag with new <div> tag
              var childNodes = document.body.childNodes;
              var is1stChild = true;
              for (var l = 0; l < childNodes.length; l++) {
                if (childNodes[l].tagName == "BLOCKQUOTE") {
                  is1stChild = false;
                  var newdiv = document.createElement("div");
                  while (childNodes[l].firstChild) {
                    newdiv.appendChild(childNodes[l].firstChild);
                  }
                  newdiv.setAttribute('class', 'replaced-blockquote');
                  for (var index = childNodes[l].attributes.length - 1; index >= 0; --index) {
                    newdiv.attributes.setNamedItem(childNodes[l].attributes[index].cloneNode());
                  }
                  childNodes[l].parentNode.replaceChild(newdiv, childNodes[l]);
                  break;
                }
                if (!is1stChild) break;
              }

              let html = new XMLSerializer().serializeToString(document);
              await browser.compose.setComposeDetails(tab.id, { body: html });
            }
          }
        }
      }

      refwdformatter.processed.add(tab.id); // Success or nothing to change

    } catch (error) {
      // Likely timing-related. Retry if attempts remain.
      if (attemptIndex + 1 < maxAttempts) {
        refwdformatter.scheduleFormat(tab, attemptIndex + 1);
      }
    }
    finally {
      refwdformatter.processing.delete(tab.id);
    }
  },

  scheduleFormat: function (tab, attemptIndex = 0) {
    const cappedIndex = Math.min(attemptIndex, refwdformatter.kProcessingDelays.length - 1);
    const delay = refwdformatter.kProcessingDelays[cappedIndex];
    window.setTimeout(function () {
      refwdformatter.format(tab, attemptIndex);
    }, delay);
  },

  onComposeStateChanged: async function (tab, state) {
    // Wait for compose-editor-ready event (Bug 1675012 solution)
    // This ensures the editor is fully initialized before processing
    if (state.canSendNow === false || state.canSendLater === false) {
      // Editor not ready yet
      return;
    }

    // Add delay to allow internal processing to complete (Bug 1997519)
    // Thunderbird 144+ changed event timing, causing setComposeDetails to execute
    // before image conversion, focus setup, and IME initialization are complete
    refwdformatter.scheduleFormat(tab, 0);  // Staggered retries handle slow init
  },

  onDelayLoad: function (tab) {
    // Fallback: Also try with delay in case state change event is missed
    refwdformatter.scheduleFormat(tab, 0);  // Staggered retries handle slow init
  },

  onTabRemoved: function (tabId) {
    // Clean up processed tabs list when tab is closed
    refwdformatter.processed.delete(tabId);
    refwdformatter.processing.delete(tabId);
  },

  onLoad: function () {
    browser.tabs.onCreated.addListener(refwdformatter.onDelayLoad);
    browser.tabs.onRemoved.addListener(refwdformatter.onTabRemoved);

    // Listen for compose state changes (Bug 1675012 workaround)
    // Note: This event fires too early in Thunderbird 144+, so we add 250ms delay
    if (browser.compose.onComposeStateChanged) {
      browser.compose.onComposeStateChanged.addListener(refwdformatter.onComposeStateChanged);
    }

    // TODO: When Thunderbird 146+ becomes stable, replace above with:
    // if (browser.compose.onComposeEditorContentReady) {
    //   browser.compose.onComposeEditorContentReady.addListener(refwdformatter.format);
    // } else if (browser.compose.onComposeStateChanged) {
    //   browser.compose.onComposeStateChanged.addListener(refwdformatter.onComposeStateChanged);
    // }
  }

};

window.addEventListener("load", refwdformatter.onLoad, true);
