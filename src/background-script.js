var refwdformatter = {

  processed: new Set(),  // Track processed tabs to avoid re-processing
  processing: new Set(), // Track tabs currently being processed (prevents overlapping attempts)

  caretScriptId: null,  // Track registered compose script for caret movement

  kCurrentLegacyMigration: 1,  // Migration flag. 0: not-migrated, 1: already-migrated
  kProcessingDelays: [250, 400, 600, 800], // Delays (ms) for staggered retries to let compose editor finish init
  kPrefDefaults: {
    replytext_on: true,
    replyhtml_on: true,
    caret_position: 'top'  // 'top', 'bottom', 'auto', or 'quote' - default is top
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

            // Testing...
            //await browser.compose.setComposeDetails(tab.id, { plainTextBody: textbody });
            // Fix for Thunderbird 143+ IME issue: use full composeDetails object
            let compose_data_text = await browser.compose.getComposeDetails(tab.id);
            compose_data_text.plainTextBody = textbody;
            await browser.compose.setComposeDetails(tab.id, compose_data_text);

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
              // Testing...
              //await browser.compose.setComposeDetails(tab.id, { body: html });
              // Fix for Thunderbird 143+ IME issue: use full composeDetails object
              let compose_data_html = await browser.compose.getComposeDetails(tab.id);
              compose_data_html.body = html;
              await browser.compose.setComposeDetails(tab.id, compose_data_html);
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

  getPrefValue: async function(prefName, defaultValue) {
    if (!browser.myapi || !browser.myapi.getPref) {
      return defaultValue;
    }
    try {
      const value = await browser.myapi.getPref(prefName);
      return value === undefined ? defaultValue : value;
    } catch (error) {
      console.error('[ReFwdFormatter] Failed to read pref:', prefName, error);
      return defaultValue;
    }
  },

  getIdentityPref: async function(identityId, key, defaultValue) {
    if (identityId) {
      const byId = await refwdformatter.getPrefValue(`mail.identity.${identityId}.${key}`, undefined);
      if (byId !== undefined) {
        return byId;
      }
    }
    const byDefault = await refwdformatter.getPrefValue(`mail.identity.default.${key}`, undefined);
    if (byDefault !== undefined) {
      return byDefault;
    }
    return defaultValue;
  },

  normalizeBoolean: function(value, defaultValue) {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
    return defaultValue;
  },

  normalizeInteger: function(value, defaultValue) {
    if (value === undefined || value === null) return defaultValue;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  },

  determineCaretBehavior: function(autoQuote, replyOnTop, sigBottom) {
    const normalizedAutoQuote = refwdformatter.normalizeBoolean(autoQuote, true);
    const normalizedReplyOnTop = refwdformatter.normalizeInteger(replyOnTop, 1);
    const normalizedSigBottom = refwdformatter.normalizeBoolean(sigBottom, true);

    let caretPosition = 'top';
    let selectQuote = false;

    if (normalizedReplyOnTop === 0) {
      caretPosition = 'bottom';
    } else if (normalizedReplyOnTop === 2) {
      caretPosition = 'top';
      selectQuote = true;
    }

    if (!normalizedAutoQuote) {
      selectQuote = false;
    }

    return {
      caretPosition,
      selectQuote,
      normalizedAutoQuote,
      normalizedReplyOnTop,
      normalizedSigBottom
    };
  },

  determineCaretBehaviorForTab: async function(tabId) {
    try {
      const details = await browser.compose.getComposeDetails(tabId);
      const identityId = details ? details.identityId : null;
      const autoQuote = await refwdformatter.getIdentityPref(identityId, 'auto_quote', true);
      const replyOnTop = await refwdformatter.getIdentityPref(identityId, 'reply_on_top', 1);
      const sigBottom = await refwdformatter.getIdentityPref(identityId, 'sig_bottom', true);
      const behavior = refwdformatter.determineCaretBehavior(autoQuote, replyOnTop, sigBottom);
      behavior.quoteHeaderText = refwdformatter.getQuoteHeaderText(details);
      return behavior;
    } catch (error) {
      console.error('[ReFwdFormatter] Failed to determine caret behavior:', error);
      return refwdformatter.determineCaretBehavior(true, 1, true);
    }
  },

  getQuoteHeaderText: function(details) {
    try {
      if (!details || !details.body) {
        return null;
      }
      const doc = new DOMParser().parseFromString(details.body, 'text/html');
      const citePrefix = doc.querySelector('.moz-cite-prefix');
      if (citePrefix && citePrefix.textContent) {
        const text = citePrefix.textContent.trim();
        return text.length ? text : null;
      }
    } catch (error) {
      console.warn('[ReFwdFormatter] Failed to parse quote header text:', error);
    }
    return null;
  },

  // Unregister existing caret movement script
  unregisterCaretMovementScript: async function() {
    if (refwdformatter.caretScriptId) {
      try {
        await refwdformatter.caretScriptId.unregister();
        console.log('[ReFwdFormatter] Caret movement script unregistered');
        refwdformatter.caretScriptId = null;
      } catch (error) {
        console.error('[ReFwdFormatter] Failed to unregister caret script:', error);
      }
    }
  },

  // Register a script that moves the caret based on user preference
  // This runs for all compose windows and helps position the cursor for immediate typing
  registerCaretMovementScript: async function() {
    // Unregister existing script if present
    await refwdformatter.unregisterCaretMovementScript();

    try {
      refwdformatter.caretScriptId = await browser.composeScripts.register({
        js: [{
          file: "compose-caret.js"
        }]
      });
      console.log('[ReFwdFormatter] Caret movement script registered');
    } catch (error) {
      console.error('[ReFwdFormatter] Failed to register caret script:', error);
    }
  },

  // Listen for settings changes and re-register caret script if caret_position changed
  onStorageChanged: async function(changes, areaName) {
    if (areaName === 'local' && changes.preferences) {
      const oldPrefs = changes.preferences.oldValue || {};
      const newPrefs = changes.preferences.newValue || {};

      // Check if caret_position changed
      if (oldPrefs.caret_position !== newPrefs.caret_position) {
        console.log('[ReFwdFormatter] Caret position setting changed from', oldPrefs.caret_position, 'to', newPrefs.caret_position);
        // Re-register the caret movement script with new settings
        await refwdformatter.registerCaretMovementScript();
      }
    }
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

    // Listen for settings changes to update caret position immediately
    browser.storage.onChanged.addListener(refwdformatter.onStorageChanged);

    // Provide caret behavior to compose scripts
    browser.runtime.onMessage.addListener(async (message, sender) => {
      if (message && message.type === 'refwdformatter:getCaretBehavior') {
        const prefs = await refwdformatter.loadPrefs();
        const caretPosition = prefs.caret_position || 'top';

        if (caretPosition === 'auto') {
          const hasPermission = await browser.permissions.contains({
            permissions: ['accountsRead']
          });
          if (!hasPermission) {
            return { caretPosition: 'bottom', selectQuote: false };
          }
          const tabId = sender && sender.tab ? sender.tab.id : null;
          const behavior = await refwdformatter.determineCaretBehaviorForTab(tabId);
          const effectivePosition = behavior.caretPosition === 'top' ? 'top' : 'bottom';
          return { caretPosition: effectivePosition, selectQuote: behavior.selectQuote, quoteHeaderText: behavior.quoteHeaderText || null };
        }

        if (caretPosition === 'quote') {
          let quoteHeaderText = null;
          try {
            const tabId = sender && sender.tab ? sender.tab.id : null;
            if (tabId !== null) {
              const details = await browser.compose.getComposeDetails(tabId);
              quoteHeaderText = refwdformatter.getQuoteHeaderText(details);
            }
          } catch (error) {
            console.warn('[ReFwdFormatter] Failed to read quote header text:', error);
          }
          return { caretPosition: 'top', selectQuote: true, quoteHeaderText: quoteHeaderText };
        }

        return { caretPosition: caretPosition, selectQuote: false, quoteHeaderText: null };
      }
      return undefined;
    });

    // Register caret movement script for positioning cursor based on user preference
    refwdformatter.registerCaretMovementScript();
  }

};

window.addEventListener("load", refwdformatter.onLoad, true);
