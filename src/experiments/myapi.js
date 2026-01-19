var { ExtensionCommon } = ChromeUtils.importESModule("resource://gre/modules/ExtensionCommon.sys.mjs");
var { Services } = globalThis;

var myapi = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      myapi: {
        async getPref(prefName) {
          try {
            const prefType = Services.prefs.getPrefType(prefName);
            if (prefType === Services.prefs.PREF_BOOL) {
              return Services.prefs.getBoolPref(prefName);
            }
            if (prefType === Services.prefs.PREF_INT) {
              return Services.prefs.getIntPref(prefName);
            }
            if (prefType === Services.prefs.PREF_STRING) {
              return Services.prefs.getStringPref(prefName);
            }
            return undefined;
          } catch (e) {
            return undefined;
          }
        }
      }
    };
  }
};
