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

      /// Logic Demo: http://liveweave.com/zMIYUw
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

            while (brCounter > 0) {
              brCounter--;
              var brNode = document.createElement('br');
              b.insertBefore(brNode, b.firstChild); // add line-break just in case
            }
          }

        } else if ((reh || lih) && msgHtml) {
          if (b.hasChildNodes()) {
            var childNodes = b.childNodes;
            for (var l = 0; l < childNodes.length; l++) {
              if (childNodes[l].tagName === "BLOCKQUOTE") {
                var renamedNode = document.createElement('div');
                for (var m = 0; m < childNodes[l].attributes.length; ++m) {
                  var a = childNodes[l].attributes[m];
                  renamedNode.setAttribute(a.nodeName, a.nodeValue);
                }
                while (childNodes[l].firstChild) {
                  renamedNode.appendChild(childNodes[l].firstChild);
                }
                var blockquoteStyle = childNodes[l].currentStyle || window.getComputedStyle(childNodes[l]);
                var divStyle = renamedNode.getAttribute("style");
                renamedNode.setAttribute("style", "margin: " + blockquoteStyle.marginTop + " 0 " + blockquoteStyle.marginBottom + " 0;" + divStyle);                
                childNodes[l].parentNode.replaceChild(renamedNode, childNodes[l]);
                break;
              }
            }
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
