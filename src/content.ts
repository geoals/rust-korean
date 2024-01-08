import { sendToBackground } from "@plasmohq/messaging";
import type { AnalyzeResponse } from "~background/messages/analyze";

const sendAnalyzeRequestToBG = async (text: string) => {
  const result = (await sendToBackground({
    name: "analyze",
    body: text,
  })) as { message: AnalyzeResponse };

  return result.message;
};

let analysisResults = {};

// TODO clean up this abomination
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach(async (addedNode) => {
        if (
          addedNode.nodeType === Node.TEXT_NODE &&
          addedNode.textContent.trim().length > 0
        ) {
          const trimmedText = addedNode.textContent
            .trim()
            .replace(/[\(\)\[\]\?\!,\.'"]/g, "");
          let result = await sendAnalyzeRequestToBG(trimmedText);
          analysisResults = { ...analysisResults, ...result };

          let newContent = "";

          addedNode.textContent.split("\n").forEach((line) => {
            line.split(" ").map((word) => {
              // Only words contain hangul characters are underlined and reinserted into the DOM
              const hangulRegex = /[\uAC00-\uD7AF]/;
              if (hangulRegex.test(word)) {
                const trimmedWord = word
                  .trim()
                  .replace(/[\(\)\[\]\?\!,\.'"-]/g, "");
                const status = getWordStatus(trimmedWord, analysisResults);
                const underlinecolor = {
                  seen: "#FACB6E",
                  known: "transparent",
                  unknown: "#F38181",
                  unmatched: "gray",
                }[status];

                newContent += `<span class="rust-korean ${status}" style="text-decoration: underline 4px ${underlinecolor}; text-underline-offset: 5px;">${word}</span> `;
              }
            });
            newContent += "\n";
          });

          // Replace the content of the target node
          mutation.target.innerHTML = newContent;
          reapplyUnderlineColors();
        }
      });
    }
  });
});

// reapply underline color based on word status from analysisResults for all words in the document with class "rust-korean"
// TODO kinda works but analysisResults is not updated when the user changes the status of a word in the popup
function reapplyUnderlineColors() {
  const rustKoreanElements = document.getElementsByClassName("rust-korean");
  for (let i = 0; i < rustKoreanElements.length; i++) {
    const element = rustKoreanElements[i];
    const trimmedWord = element.textContent
      .trim()
      .replace(/[\(\)\[\]\?\!,\.'"-]/g, "");
    const status = getWordStatus(trimmedWord, analysisResults);
    const underlinecolor = {
      seen: "#FACB6E",
      known: "transparent",
      unknown: "#F38181",
      unmatched: "gray",
    }[status];
    element.style.textDecoration = `underline 4px ${underlinecolor}`;
  }
}

function getWordStatus(word: string, wordStatuses: AnalyzeResponse) {
  if (wordStatuses[word] === undefined) {
    return "unknown";
  }
  if (wordStatuses[word].length === 0) {
    return "unmatched";
  }
  return wordStatuses[word][0].status;
}

const targetNode = document.body;
observer.observe(targetNode, { childList: true, subtree: true });
// To stop:
// observer.disconnect();
// make this a toggleswitch in popup.tsx
