import React from "react";
import { sendToBackground } from "@plasmohq/messaging";
import type { WordStatusDTO } from "~background/messages/changeWordStatus";
import type { LookupDTO } from "~background/messages/lookup";
import styles from "./style.module.css";
import underlineStyles from "../underline.module.css";

export function StatusButtons({
  entry,
  hoveredElement,
}: {
  entry: LookupDTO;
  hoveredElement: Element;
}) {
  const [status, setStatus] = React.useState(entry.status.status ?? "unknown");

  const color = {
    "known": "bg-green",
    "seen": "bg-yellow",
    "unknown": "bg-red",
  }

  const getNextStatus = (status: "unknown" | "known" | "seen") => {
    switch (status) {
      case "unknown":
        return "seen";
      case "seen":
        return "known";
      case "known":
        return "unknown";
    }
  }

  const nextStatus = getNextStatus(status);

  return (
    <>
      <div>
        <button className={`text-white px-1 rounded-6 ${color[status]} z-10 relative`}
          onClick={() => {
            changeWordStatus(entry.dictEntry.sequence_number, {
              status: nextStatus,
            });
            setStatus(nextStatus)
            hoveredElement.className = `${underlineStyles['underline']} ${underlineStyles[nextStatus]}`;
            // TODO update status in  window.rustKorean.analysisResults[hoveredWord] and use that in reapply function in content.ts
          }}
        >
          {status}
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