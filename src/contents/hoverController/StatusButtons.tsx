import React from "react";
import { sendToBackground } from "@plasmohq/messaging";
import type { WordStatusDTO } from "~background/messages/changeWordStatus";
import type { LookupDTO } from "~background/messages/lookup";

export function StatusButtons({
  entry, hoveredElement,
}: {
  entry: LookupDTO;
  hoveredElement: Element;
}) {
  return (
    <>
      <div>
        <button
          onClick={() => {
            changeWordStatus(entry.dictEntry.sequence_number, {
              status: "known",
            });
            hoveredElement.style.textDecorationColor = "transparent";
            // TODO update status in  window.rustKorean.analysisResults[hoveredWord] and use that in reapply function in content.ts
          }}
        >
          Known
        </button>
        <button
          onClick={() => {
            changeWordStatus(entry.dictEntry.sequence_number, {
              status: "seen",
            });
            hoveredElement.style.textDecorationColor = "#FACB6E";
          }}
        >
          Seen
        </button>
        <button
          onClick={() => {
            changeWordStatus(entry.dictEntry.sequence_number, {
              status: "unknown",
            });
            hoveredElement.style.textDecorationColor = "#F38181";
          }}
        >
          Unknown
        </button>
      </div>
      <button
        onClick={() => {
          changeWordStatus(entry.dictEntry.sequence_number, {
            ignored: !entry.status.ignored,
          });
          hoveredElement.style.textDecorationColor = "transparent";
        }}
      >
        Ignore
      </button>
    </>
  );
}

async function changeWordStatus(wordId: number, wordStatus: WordStatusDTO) {
  const resp = await sendToBackground({
    name: "changeWordStatus",
    body: {
      wordId,
      wordStatus,
    },
  });

  return resp.message;
}
