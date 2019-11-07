# ReFwdFormatter

Thunderbird Add-on.

  To Remove the "&gt;" prefix from quote.

## Installing

To install this add-on, Please visit the following page.

- [ReFwdFormatter :: Add-ons for Thunderbird](https://addons.mozilla.org//thunderbird/addon/refwdformatter/)

## Getting Started

You can customize this add-on behavior from the [Setting] button for this add-on on [Thunderbird Add-on Manager].

## Developing Or Fixing some issues

Windows only. Please run build.bat. Or, read build.ps1 code. It shows "How to build and test this add-on".

### src folder's content

```
manifest.json                               // meta-information about the extension

chrome.manifest                             // list of packages and overlays

chrome\
chrome\content\
chrome\content\options.xul                  // UI of Preferences
chrome\content\options.js                   // Preferences code
chrome\content\overlay-messengercompose.xul // loading logic code
chrome\content\overlay-messengercompose.js  // logic code
chrome\locale\                              // Localization
chrome\locale\en-US\options.dtd
chrome\locale\ja\options.dtd

icons\*                                     // the extension's icons
```

## Version History

- v 2.68.0
  - Support for Thunderbird version from 68.0 to *.
  - Added extension's icon
  - Got rid of the old functionality to remove "[" and "]" from the forward subject.

- v 1.65.1
  - [Bug-Fix] Fixed this issue: [Text moved to the bottom of the communication · Issue #2 · isshiki/ReFwdFormatter](https://github.com/isshiki/ReFwdFormatter/issues/2)
  - Completely rebuilt the logic for HTML mail to Reply.
  - Changed the support start version from 1.0 to 24.0.

- v 1.65.0
  - [Bug-Fix] Fixed this issue: [Options window is not displayed properly · Issue #1 · isshiki/ReFwdFormatter](https://github.com/isshiki/ReFwdFormatter/issues/1)
  - Added `<?xml-stylesheet type="text/css" href="chrome://messenger/skin/preferences/preferences.css"?>` to options.xul file for Thuderbird 60+.
Because CSS for the preference dialogs has moved from Mozilla core to Thunderbird. Add-ons that have an options/preferences dialog using `<prefwindow>` that requires this CSS need to add this code.

- v 1.58.0
  - [Improved] Add version-check for the fwd feature

- v 1.57.0.3
  - [Features especially for mac OS] Add two lines if those doesn't exist at the head of mail documents

- v 1.57.0.2
  - [Bug-Fix] Fix the bugs: At the previous version, the contents of the quote email reply couldn't be highlighted nor edited

- v 1.57.0.1
  - Add margin top and bottom in case of HTML mail

- v 1.57.0
  - Support Thunderbird 57.0
  - Code Refactoring
  - Add features to meet the latest criteria for AMO ( addons.mozilla.org )

- v 1.0.0
  - Support ReplyToList button

- v 0.3.0
  - Support Thunderbird 3.0

- v 0.2.0
  - Global variable "$" was changed to "$G$" in case of overwrite.
  - Option Dialog. You can disable each features.

## License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE](LICENSE) file for details

## Reference information
- [Application Versions :: Add-ons for Thunderbird](https://addons.thunderbird.net/en-US/thunderbird/pages/appversions/)
- [Mozilla Thunderbird Release Notes — Mozilla](https://www.mozilla.org/en-US/thunderbird/releases/)
- [Is there a plan to support WebExtensions in Thunderbird? | Thunderbird Support Forum | Mozilla Support](https://support.mozilla.org/en-US/questions/1145386) : The answer is 'No'.
- [Building a Thunderbird extension 1: introduction - Mozilla | MDN](https://developer.mozilla.org/en-US/Add-ons/Thunderbird/Building_a_Thunderbird_extension)
- [返信時の引用符を無くすThunderbirdアドオン「ReFwdFormatter」 - いっしきまさひこBLOG](http://blog.masahiko.info/entry/2009/05/01/055027)
