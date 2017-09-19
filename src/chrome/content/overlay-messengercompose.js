var refwdformatter = {
  
  editing: false,

  format: function () {

    if (refwdformatter.editing) {
      return;
    }
    refwdformatter.editing = true;

    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.refwdformatter.");
    var ret = prefs.getBoolPref("replytext.on");
    var reh = prefs.getBoolPref("replyhtml.on");
    var lit = prefs.getBoolPref("listtext.on");
    var lih = prefs.getBoolPref("listhtml.on");
    var fwd = prefs.getBoolPref("fwdsubject.on");

    var t = gMsgCompose.type;
    var msgHtml = gMsgCompose.composeHTML;

    if (fwd && (t == 3 || t == 4)) {
      // Foward (3: ForwardAsAttachment, 4: ForwardInline)
      document.getElementById("msgSubject").value = document.getElementById("msgSubject").value.replace(/^\[/, "").replace(/\]$/, "");

    } else if ((ret || reh || lit || lih) && (t == 1 || t == 2 || t == 6 || t == 7 || t == 8 || t == 13)) {
      // Reply (1: Reply, 2: ReplyAll, 6: ReplyToSender, 7: ReplyToGroup, 8: ReplyToSenderAndGroup, 13: ReplyToList)
      var b = document.getElementById("content-frame").contentDocument.body;
      var h = b.innerHTML;
      ///// If you develop and test this add-on logic code, remove the following comment-out temporarily to get the whole html source of the current mail.
      /////b.innerHTML = h.replace(/[&"'<>]/g, function(m) { return { "&": "&amp;", '"': "&quot;", "'": "&#39;", "<": "&lt;", ">": "&gt;" }[m]; });
      /////return;

      /// Logic Demo: http://liveweave.com/bgJNm3
      /// [--- liveweave debug 1 - START copy here ---]
      if (h !== "<br>") {

        if ((ret || lit) && !msgHtml) {

          if (b.hasChildNodes()) {
            var children = b.childNodes;
            //console.log(children);

            var isFirstChildren = true;
            var brCounter = 2;  // There should be two <br> tags as FirstChildren in text-mail.
            for (var i = 0; i < children.length; i++) {

              if (brCounter <= 0) isFirstChildren = false;
              var curChildNode = children[i];

              if (curChildNode.nodeType === Node.TEXT_NODE) {
                //console.log(curGChildNode); 
                refwdformatter.removeQuoteMarksInTextMessage(curChildNode);  // Basically, this code-block won't be run.

              } else {
                //console.log(curChildNode.tagName);
                switch (curChildNode.tagName) {

                  case "BR":
                    if (isFirstChildren) {
                      brCounter--;
                    }
                    break;

                  case "SPAN":
                  case "DIV":
                    if (isFirstChildren) isFirstChildren = false;
                    if (curChildNode.hasChildNodes()) {
                      var grandChildren = curChildNode.childNodes;
                      //console.log(grandChildren);
                      for (var n = 0; n < grandChildren.length; n++) {
                        var curGChildNode = grandChildren[n];
                        if (curGChildNode.nodeType === Node.TEXT_NODE) {
                          //console.log(curGChildNode); 
                          refwdformatter.removeQuoteMarksInTextMessage(curGChildNode);
                        }
                      }
                    }
                    break;

                  default:
                    if (isFirstChildren) isFirstChildren = false;
                    break;
                }

              }

            }

            refwdformatter.addLineBreakJustInCase(brCounter);
          }

        } else if ((reh || lih) && msgHtml) {

          if (b.hasChildNodes()) {
            var childNodes = b.childNodes;
            //console.log(childNodes);

            var removedBlockquote = false;
            var is1stChild = true;
            var brCount = 2;  // There should be two <br> tags as FirstChildren in html-mail.
            for (var l = 0; l < childNodes.length; l++) {

              if (brCount <= 0) is1stChild = false;

              switch (childNodes[l].tagName) {

                case "BLOCKQUOTE":
                  is1stChild = false;
                  var existsNextNode = (l+1 < childNodes.length);
                  var blockauoteNode = childNodes[l];

                  // Move Blockquote children to parent
                  while (blockauoteNode.lastChild) {
                    if (existsNextNode) {
                      b.insertBefore(blockauoteNode.lastChild, childNodes[l+1]);
                    } else {
                      b.appendChild(blockauoteNode.lastChild);
                    }
                  }

                  // Add spacer before first line
                  var spacerNode = document.createElement('span');
                  var blockquoteStyle = blockauoteNode.currentStyle || window.getComputedStyle(blockauoteNode);
                  for (var m = 0; m < blockauoteNode.attributes.length; ++m) {
                    var a = blockauoteNode.attributes[m];
                    spacerNode.setAttribute(a.nodeName, a.nodeValue);
                  }
                  spacerNode.setAttribute("style", "display: block; word-break: break-all; margin: " + blockquoteStyle.marginTop + " 0 0 0; padding: 0; line-height:0");
                  if (existsNextNode) {
                    b.insertBefore(spacerNode, blockauoteNode);
                  } else {
                    b.appendChild(spacerNode);
                  }

                  // Remove Blockquote itself
                  b.removeChild(blockauoteNode);
                  removedBlockquote = true;
                  break;

                case "P":
                  if (is1stChild) {
                    if (childNodes[l].children.length === 1 && childNodes[l].children[0].tagName === "BR") brCount--;
                    else is1stChild = false;
                  }
                  break;

                case "BR":
                  if (is1stChild) brCount--;
                  break;

                default:
                  if (is1stChild) is1stChild = false;
                  break;

              }
              if (removedBlockquote) break;

            }

            refwdformatter.addLineBreakJustInCase(brCount);
          }

        }

        refwdformatter.initCursorPosition();

      }
      /// [--- liveweave debug 1 - END copy here ---]

    }
    window.setTimeout(function () {
      refwdformatter.editing = false;
    }, 700);
  },

  removeQuoteMarksInTextMessage: function (curNode) {
    /// [--- liveweave debug 2 - START copy here ---]
    //console.log(curNode.previousSibling);
    if ((curNode.previousSibling === null) ||
        (curNode.previousSibling.tagName === "BR")) {
      //console.log(curNode.data);
      curNode.data = curNode.data.
        replace(/^> {2}/g, " ").
        replace(/^> /g, "").
        replace(/^>((>)+) /g, "$1 ").
        replace(/^>((>)+)$/g, "$1 ");
      //console.log(curNode.data);
    }
    /// [--- liveweave debug 2 - END copy here ---]
  },

  addLineBreakJustInCase: function (brCounter) {
    if (brCounter > 0) {
      var e = GetCurrentEditor();
      e.beginningOfDocument();
      while (brCounter > 0) {
        brCounter--;
        e.insertHTML("<br>");
      }
    }
  },

  initCursorPosition: function () {
    var e = GetCurrentEditor();
    e.beginningOfDocument();
    e.insertHTML(" ");
    e.undo(1);
  },

  onDelayLoad: function () {
    window.setTimeout(function () {
      refwdformatter.format();
    }, 700);
  },

  onDelayReopen: function () {
    window.setTimeout(function () {
      refwdformatter.format();
    }, 700);
  },

  onLoad: function () {
    opening = false;
    document.getElementById("content-frame").addEventListener("load", refwdformatter.onDelayLoad, true);
    window.addEventListener("compose-window-reopen", refwdformatter.onDelayReopen, true);
  }

};

window.addEventListener("load", refwdformatter.onLoad, true);
