# ReFwdFormatter

Thunderbird Add-on.

  To Remove the "&gt;" prefix from quote. 

  To Remove "[" and "]" from the forward subject.

## Installing

To install this add-on, Please visit the following page.

- [ReFwdFormatter :: Add-ons for Thunderbird](https://addons.mozilla.org//thunderbird/addon/refwdformatter/)

## Getting Started

You can customize this add-on behavior from the this add-on's [Setting] button on Thunderbird Add-on Manager.

## Developing Or Fixing some issues

Please run build.bat. Or, read build.ps1 code. It shows "How to build and test this add-on".

### src folder's content

```
install.rdf                 // meta-information about the extension
chrome.manifest             // list of packages and overlays
chrome/
chrome/content/
chrome/content/options.xul  //UI of Preferences
chrome/content/overlay.js   //logic code
defaults/preferences/       //default settings of Preferences
```

## History

- 1.0.0
  - Support ReplyToList button

- 0.3.0
  - Support Thunderbird 3.0

- 0.2.0
  - Global variable "$" was changed to "$G$" in case of overwrite.
  - Option Dialog. You can disable each features.

## License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE](LICENSE) file for details



