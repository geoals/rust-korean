import React from "react";
import { sendToBackground } from "@plasmohq/messaging";
import type { WordStatusDTO } from "~background/messages/changeWordStatus";
import type { LookupDTO } from "~background/messages/lookup";
import underlineStyles from "../underline.module.css";
import { useStorage } from "@plasmohq/storage/hook";

export function StatusButtons({
  entry,
  hoveredElement,
}: {
  entry: LookupDTO;
  hoveredElement: Element;
}) {
  const [status, setStatus] = React.useState(entry.status.status ?? "unknown");
  const language = (useStorage<'japanese'|'english'>("language")[0]) ?? 'japanese';

  const color = {
    known: "bg-green",
    seen: "bg-yellow",
    unknown: "bg-red",
  };

  const statusI18n = {
    'japanese': {
      known: "学習済",
      seen: "学習中",
      unknown: "未学習",
    },
    'english': {
      known: "KNOWN",
      seen: "SEEN",
      unknown: "UNKNOWN",
    }
  };

  const getNextStatus = (status: "unknown" | "known" | "seen") => {
    switch (status) {
      case "unknown":
        return "seen";
      case "seen":
        return "known";
      case "known":
        return "unknown";
    }
  };

  const nextStatus = getNextStatus(status);

  return (
    <>
      <button
        className={`text-white rounded ${color[status]} font-bold text-sm px-2 py-1 hover:scale-105 text-nowrap select-none h-fit`}
        onClick={(e) => {
          e.stopPropagation();
          changeWordStatus(entry.dictEntry.sequence_number, {
            status: nextStatus,
          });
          setStatus(nextStatus);
          hoveredElement.className = `${underlineStyles["underline"]} ${underlineStyles[nextStatus]}`;
          // TODO: update status in  window.rustKorean.analysisResults[hoveredWord] and use that in reapply function in content.ts
        }}
      >
        {statusI18n[language][status]}
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

export function markAsSeen(wordId: number) {
  changeWordStatus(wordId, {
    status: "seen",
  });
}
