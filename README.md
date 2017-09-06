# ReFwdFormatter

Thunderbird Add-on.

  To Remove the "&gt;" prefix from quote. 

  To Remove "[" and "]" from the forward subject.

## Installing

To install this add-on, Please visit the following page.

- [ReFwdFormatter :: Add-ons for Thunderbird](https://addons.mozilla.org//thunderbird/addon/refwdformatter/)

## Getting Started

You can customize this add-on behavior from the [Setting] button for this add-on on [Thunderbird Add-on Manager].

## Developing Or Fixing some issues

Windows only. Please run build.bat. Or, read build.ps1 code. It shows "How to build and test this add-on".

### src folder's content

```
install.rdf                                 // meta-information about the extension

chrome.manifest                             // list of packages and overlays

chrome\
chrome\content\
chrome\content\options.xul                  // UI of Preferences
chrome\content\overlay-messengercompose.xul // loading logic code
chrome\content\overlay-messengercompose.js  // logic code
chrome\locale\                              // Localization
chrome\locale\en-US\options.dtd
chrome\locale\ja\options.dtd

defaults/
defaults/preferences/
defaults/preferences/pref.js                // default value of Preferences

```

## Version History

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
- [Application Versions :: Add-ons for Firefox](https://addons.mozilla.org/en-US/firefox/pages/appversions/)
- [Mozilla Thunderbird Release Notes — Mozilla](https://www.mozilla.org/en-US/thunderbird/releases/)
- [Is there a plan to support WebExtensions in Thunderbird? | Thunderbird Support Forum | Mozilla Support](https://support.mozilla.org/en-US/questions/1145386)
- [Building a Thunderbird extension 1: introduction - Mozilla | MDN](https://developer.mozilla.org/en-US/Add-ons/Thunderbird/Building_a_Thunderbird_extension)
- [返信時の引用符を無くすThunderbirdアドオン「ReFwdFormatter」 - いっしきまさひこBLOG](http://blog.masahiko.info/entry/2009/05/01/055027)
