import React from "react";
import { sendToBackground } from "@plasmohq/messaging";
import type { WordStatusDTO } from "~background/messages/changeWordStatus";
import type { LookupDTO } from "~background/messages/lookup";
import * as styles from "./style.module.css";

export function StatusButtons({
  entry,
  hoveredElement,
}: {
  entry: LookupDTO;
  hoveredElement: Element;
}) {
  const [status, setStatus] = React.useState(entry.status.status ?? "unknown");
  const [ignored, setIgnored] = React.useState(entry.status.ignored ?? false);

  return (
    <>
      <div>
        <button className={`${styles.button} ${status === "known" ? styles.activeButton : ""}`}
          onClick={() => {
            changeWordStatus(entry.dictEntry.sequence_number, {
              status: "known",
            });
            setStatus("known");
            hoveredElement.style.textDecorationColor = "transparent";
            // TODO update status in  window.rustKorean.analysisResults[hoveredWord] and use that in reapply function in content.ts
          }}
        >
          Known
        </button>
        <button className={`${styles.button} ${status === "seen" ? styles.activeButton : ""}`}
          onClick={() => {
            changeWordStatus(entry.dictEntry.sequence_number, {
              status: "seen",
            });
            setStatus("seen");
            hoveredElement.style.textDecorationColor = "#FACB6E";
          }}
        >
          Seen
        </button>
        <button className={`${styles.button} ${status === "unknown" ? styles.activeButton : ""}`}
          onClick={() => {
            changeWordStatus(entry.dictEntry.sequence_number, {
              status: "unknown",
            });
            setStatus("unknown");
            hoveredElement.style.textDecorationColor = "#F38181";
          }}
        >
          Unknown
        </button>
        <button className={`${styles.button} ${ignored ? styles.activeButton : ""}`}
          onClick={() => {
            changeWordStatus(entry.dictEntry.sequence_number, {
              ignored: !ignored,
            });
            setIgnored(!ignored);
            hoveredElement.style.textDecorationColor = "transparent";
          }}
        >
          Ignore
        </button>
      </div>
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

export function markAsSeen(wordId: number) {
  changeWordStatus(wordId, {
    status: "seen",
  });
}