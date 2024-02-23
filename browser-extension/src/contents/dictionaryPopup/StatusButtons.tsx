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

  const statusI18n = {
    "known": "学習済",
    "seen": "学習中",
    "unknown": "未学習",
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
        <button className={`text-white rounded-6 ${color[status]} font-sans font-bold text-sm px-2 py-1 duration-100 hover:scale-105 text-nowrap select-none`}
          onClick={() => {
            changeWordStatus(entry.dictEntry.sequence_number, {
              status: nextStatus,
            });
            setStatus(nextStatus)
            hoveredElement.className = `${underlineStyles['underline']} ${underlineStyles[nextStatus]}`;
            // TODO update status in  window.rustKorean.analysisResults[hoveredWord] and use that in reapply function in content.ts
          }}
        >
          {statusI18n[status]}
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