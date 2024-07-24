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
src/
├── manifest.json            // Meta-information about this extension
├── background-script.js     // Main logic code
├── prefs/                   // Preferences
│  ├── options.html         //   -  UI of Options
│  └── options.js           //   -  Options code
├── _locales/                // Localization
│  ├── en/messages.json     //   -  English
│  └── ja/messages.json     //   -  Japanese
└── icons/                   // This extension's Icons
    ├── refwd.png            //   -  64 x 64 px icon
    ├── refwd-32px.png       //   -  32 x 32 px icon
    └── refwd-16px.png       //   -  16 x 16 px icon
```

## Version History

- v 2.128.0
  - Support for Thunderbird version 128.*.
  - Removed usage of `Services.jsm` to ensure compatibility with Thunderbird 115. `Services` object is now accessed via `globalThis.Services`. For more details, see the [Thunderbird update guide](https://developer.thunderbird.net/add-ons/updating/tb115/adapt-to-changes-in-thunderbird-103-115#services.jsm).
  - Fixed compatibility issue when ReFwdFormatter is installed with SmartTemplate4 or EnhancedReplyHeaders.

- v 2.78.0
  - Support for Thunderbird version from 78.0 to *.
  - Support New MailExtension instead of deprecated Legacy WebExtension and XUL.
  - All the code has been remodeled to support MailExtension. But New MailExtension's features are significantly limited.
  - In text-email-reply, the input cursor is at the bottom of the editor. Because there is no way to manipulate the input cursor, the input cursor couldn't be moved from add-on.
  - Deleted the feature to set list-reply and/or normal-reply option. Because there is no way to detect reply-mode.

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
- [A Guide to MailExtensions - Thunderbird](https://developer.thunderbird.net/add-ons/mailextensions)
- Same problem and workaround: [TypeError: prin.URI is null](https://a-tak.com/blog/2020/07/autobucket-auto-jadge/)
- [返信時の引用符を無くすThunderbirdアドオン「ReFwdFormatter」 - いっしきまさひこBLOG](http://blog.masahiko.info/entry/2009/05/01/055027)
