import { sendToBackground } from "@plasmohq/messaging";
import type { AnalyzeResponse } from "~background/messages/analyze";

async function main() {
  const hangulRegex = /[\uAC00-\uD7AF]/;
  const underlineColor = {
    seen: "#FACB6E",
    known: "transparent",
    unknown: "#F38181",
    unmatched: "gray",
  };

  let analysisResults = {};

  const sendAnalyzeRequestToBackground = async (text: string) => {
    const result = (await sendToBackground({
      name: "analyze",
      body: text,
    })) as { message: AnalyzeResponse };

    return result.message;
  };

  function getConsecutiveHangulSubstring(word: string) {
    let start = 0;
    let end = word.length;
    for (let i = 0; i < word.length; i++) {
      if (hangulRegex.test(word[i])) {
        start = i;
        break;
      }
    }
    for (let i = start; i < word.length; i++) {
      if (!hangulRegex.test(word[i])) {
        end = i;
        break;
      }
    }
    return { hangulWord: word.substring(start, end), start, end };
  }

  // TODO clean up this abomination
  function mutationObserverCallback(mutations: MutationRecord[]) {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach(async (addedNode) => {
          if (
            !(mutation.target instanceof HTMLElement) ||
            addedNode.nodeType !== Node.TEXT_NODE ||
            addedNode.textContent === null ||
            addedNode.textContent.trim().length === 0
          ) {
            return;
          }

          let result = await sendAnalyzeRequestToBackground(
            addedNode.textContent,
          );
          analysisResults = { ...analysisResults, ...result };

          let newContent = "";

          addedNode.textContent.split("\n").forEach((line) => {
            line.split(" ").map((word) => {
              if (hangulRegex.test(word)) {
                let { hangulWord } = getConsecutiveHangulSubstring(word);
                const status = getWordStatus(hangulWord, analysisResults);
                const color = underlineColor[status];
                newContent += `<span class="rust-korean ${status}" style="text-decoration: underline 0.2rem ${color}; text-underline-offset: 0.3rem;">${word}</span> `;
              }
            });
            newContent += "\n";
          });

          mutation.target.innerHTML = newContent;
        });
      }
    });
  }

  function getWordStatus(word: string, wordStatuses: AnalyzeResponse) {
    if (wordStatuses[word] === undefined) {
      return "unknown";
    }

    if (wordStatuses[word].length === 0) {
      return "unmatched";
    }

    const filteredWordStatuses = wordStatuses[word].filter((wordStatus) => !wordStatus.ignored);

    if (filteredWordStatuses.some((wordStatus) => wordStatus.status === "known")) {
      return "known"
    }

    if (filteredWordStatuses.some((wordStatus) => wordStatus.status === "seen")) {
      return "seen"
    }

    return "unknown"
  }

  function getTextNodes(node: Node) {
    let textNodes: Array<Node> = [];

    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node);
    } else {
      // Recursively traverse child nodes
      const children = node.childNodes;
      for (let i = 0; i < children.length; i++) {
        textNodes = textNodes.concat(getTextNodes(children[i]));
      }
    }

    return textNodes;
  }

  function underlineHangulWords(textNode: Node) {
    if (
      textNode.nodeValue === null ||
      !(textNode.parentNode instanceof HTMLElement)
    ) {
      return;
    }

    let newHTML = "";

    textNode.nodeValue.split("\n").forEach((line, index) => {
      line.split(" ").forEach((word, index) => {
        if (!hangulRegex.test(word)) {
          newHTML += word;
        } else {
          // TODO underline all words in the string, not just one e.g. '쵸센고(조선어)'라고
          const {
            hangulWord,
            start: startIndex,
            end: endIndex,
          } = getConsecutiveHangulSubstring(word);

          const wordStart = word.substring(0, startIndex);
          const wordEnd = word.substring(endIndex);
          const status = getWordStatus(hangulWord, analysisResults);
          const color = underlineColor[status];
          newHTML += `${wordStart}<span class="rust-korean" style="text-decoration: underline 0.15rem ${color}; text-underline-offset: 0.3rem;">${hangulWord}</span>${wordEnd}`;
        }
        if (index < line.split(" ").length - 1) {
          newHTML += " ";
        }
      });
      if (index < textNode.nodeValue!.split("\n").length - 1) {
        newHTML += "\n";
      }
    });

    const newSpan = document.createElement("span");
    newSpan.innerHTML = newHTML;
    textNode.parentNode.replaceChild(newSpan, textNode);
  }

  let result = await sendAnalyzeRequestToBackground(document.body.innerText);
  analysisResults = { ...analysisResults, ...result };

  const allTextNodes = getTextNodes(document.body);

  for (const node of allTextNodes) {
    if (!hangulRegex.test(node.textContent ?? "")) {
      continue;
    }
    underlineHangulWords(node);
  }

  const observer = new MutationObserver(mutationObserverCallback);
  observer.observe(document.body, { childList: true, subtree: true });
  // To stop:
  // observer.disconnect();
  // make this a toggleswitch in popup.tsx
}

if (document.readyState !== 'complete') {
  window.addEventListener("load", main);
} else {
  main();
}