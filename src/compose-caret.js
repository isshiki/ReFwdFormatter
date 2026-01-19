(function() {

  async function getCaretBehavior() {
    try {
      return await browser.runtime.sendMessage({ type: 'refwdformatter:getCaretBehavior' });
    } catch (e) {
      return { caretPosition: 'top', selectQuote: false, quoteHeaderText: null };
    }
  }

  function moveCaretTop(editor) {
    const range = document.createRange();
    const sel = window.getSelection();
    const firstNode = editor.firstChild;
    if (!firstNode) return false;
    if (firstNode.nodeType === Node.TEXT_NODE) {
      range.setStart(firstNode, 0);
    } else {
      range.setStartBefore(firstNode);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    editor.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  }

  function moveCaretBottom(editor, isHtmlMode) {
    let targetNode;
    if (isHtmlMode) {
      const p = document.createElement('p');
      const br = document.createElement('br');
      p.appendChild(br);
      editor.appendChild(p);
      targetNode = p;
    } else {
      // Plain text: do not modify DOM, just move to end
      const lastNode = editor.lastChild;
      if (!lastNode) return false;
      targetNode = lastNode;
    }
    const range = document.createRange();
    const sel = window.getSelection();
    if (isHtmlMode) {
      range.setStart(targetNode, 0);
    } else {
      if (targetNode.nodeType === Node.TEXT_NODE) {
        const len = (targetNode.nodeValue || '').length;
        range.setStart(targetNode, len);
      } else {
        range.setStartAfter(targetNode);
      }
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    editor.focus();
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    return true;
  }

  function findPlainTextTrimmedRange(editor) {
    const nodes = Array.from(editor.childNodes || []);
    const isIgnorable = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.nodeValue || '').trim() === '';
      }
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
        return true;
      }
      return false;
    };

    let startNode = null;
    for (const node of nodes) {
      if (!isIgnorable(node)) {
        startNode = node;
        break;
      }
    }

    let endNode = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (!isIgnorable(node)) {
        endNode = node;
        break;
      }
    }

    if (!startNode || !endNode) {
      return null;
    }

    const startOffset = startNode.nodeType === Node.TEXT_NODE ? 0 : null;
    const endOffset = endNode.nodeType === Node.TEXT_NODE ? (endNode.nodeValue || '').length : null;
    return { start: { node: startNode, offset: startOffset }, end: { node: endNode, offset: endOffset } };
  }

  function selectQuoteRange(editor, isHtmlMode) {
    const sel = window.getSelection();
    const range = document.createRange();

    if (isHtmlMode) {
      const citePrefix = editor.querySelector('.moz-cite-prefix');
      let quoteNode = editor.querySelector('.replaced-blockquote');
      if (!quoteNode) {
        quoteNode = editor.querySelector('blockquote[type="cite"]') || editor.querySelector('blockquote');
      }
      if (citePrefix) {
        const endNode = quoteNode || editor.lastChild || citePrefix;
        range.setStartBefore(citePrefix);
        range.setEndAfter(endNode);
        sel.removeAllRanges();
        sel.addRange(range);
        editor.focus();
        return true;
      }
      if (quoteNode) {
        range.selectNodeContents(quoteNode);
        sel.removeAllRanges();
        sel.addRange(range);
        editor.focus();
        return true;
      }
      return false;
    }

    const trimmedRange = findPlainTextTrimmedRange(editor);
    if (!trimmedRange) {
      return false;
    }
    const startNode = trimmedRange.start.node;
    const endNode = trimmedRange.end.node;
    if (startNode.nodeType === Node.TEXT_NODE) {
      range.setStart(startNode, trimmedRange.start.offset || 0);
    } else {
      range.setStartBefore(startNode);
    }
    if (endNode.nodeType === Node.TEXT_NODE) {
      range.setEnd(endNode, trimmedRange.end.offset || 0);
    } else {
      range.setEndAfter(endNode);
    }
    sel.removeAllRanges();
    sel.addRange(range);
    editor.focus();
    return true;
  }

  function scheduleReselect(editor, isHtmlMode) {
    setTimeout(() => {
      try {
        selectQuoteRange(editor, isHtmlMode);
      } catch (e) {
        // ignore
      }
    }, 200);
  }

  function scheduleCaretMove(editor, isHtmlMode, mode) {
    setTimeout(() => {
      try {
        if (mode === 'top') {
          moveCaretTop(editor);
        } else if (mode === 'bottom') {
          moveCaretBottom(editor, isHtmlMode);
        }
      } catch (e) {
        // ignore
      }
    }, 200);
  }

  setTimeout(async () => {
    const behavior = await getCaretBehavior();
    if (!behavior || !behavior.selectQuote) {
      const editor = document.querySelector('body');
      if (!editor || !editor.firstChild) {
        return;
      }
      const hasBlockElements = editor.querySelector('p, div, blockquote, h1, h2, h3, h4, h5, h6');
      const isHtmlMode = hasBlockElements !== null;
      if (behavior && behavior.caretPosition === 'bottom') {
        if (moveCaretBottom(editor, isHtmlMode)) {
          scheduleCaretMove(editor, isHtmlMode, 'bottom');
        }
      } else {
        if (moveCaretTop(editor)) {
          scheduleCaretMove(editor, isHtmlMode, 'top');
        }
      }
      return;
    }
    const editor = document.querySelector('body');
    if (!editor || !editor.firstChild) {
      return;
    }
    const hasBlockElements = editor.querySelector('p, div, blockquote, h1, h2, h3, h4, h5, h6');
    const isHtmlMode = hasBlockElements !== null;
    const selected = selectQuoteRange(editor, isHtmlMode);
    if (selected) {
      scheduleReselect(editor, isHtmlMode);
    }
  }, 1000);
})();
