import ExportIcon from "react:~/../assets/export.svg";
import AlreadyExportedIcon from "react:~/../assets/already_exported.svg";
import { sendToBackground } from "@plasmohq/messaging";

import type { AddToAnkiPayload } from "~background/messages/addAnkiNote";
import { markAsSeen } from "./StatusButtons";
import { useState } from "react";
import type { LookupDTO } from "~background/messages/lookup";

export function AddToAnkiButton({
  hoveredWord,
  hoveredSentence,
  entry,
}: {
  hoveredWord: string;
  hoveredSentence: string;
  entry?: LookupDTO;
}) {
  // TODO check status from ankiconnect instead
  const [ankiExported, setAnkiExported] = useState(false);

  function addToAnkiBtnHandler(): void {
    if (!entry) {
      return;
    }

    addAnkiNoteMessage(
      {
        hoveredWord,
        headword: entry.dictEntry.headword,
        hanja: entry.dictEntry.hanja !== null ? entry.dictEntry.hanja : undefined,
        reading: entry.dictEntry.reading !== null ? entry.dictEntry.reading : undefined,
        sentence: hoveredSentence,
        definitionFull: entry.dictEntry.definition_full,
        frequency:
          entry.dictEntry.frequency !== null ? entry.dictEntry.frequency.toString() : undefined,
      },
      entry.dictEntry.sequence_number,
      entry.status.status ?? "unknown",
    );
    setAnkiExported(true);
  }

  return (
    <button
      onClick={addToAnkiBtnHandler}
      className={`hover:scale-105 ${ankiExported ? "" : "hover:"}fill-light-green-60`}
    >
      {ankiExported ? <AlreadyExportedIcon /> : <ExportIcon />}
    </button>
  );
}

async function addAnkiNoteMessage(
  payload: AddToAnkiPayload,
  id: number,
  wordStatus: "known" | "seen" | "unknown",
) {
  const { hoveredWord, sentence, headword, reading, hanja, definitionFull } = payload;
  const resp = await sendToBackground<AddToAnkiPayload>({
    name: "addAnkiNote",
    body: {
      headword,
      sentence,
      hoveredWord,
      hanja: hanja ?? undefined,
      reading: reading ?? undefined, // TODO map null to undefined closer to api layer
      selectionText: window.getSelection()?.toString().replaceAll("\n", "<br>"),
      definitionFull,
      frequency: payload.frequency ?? undefined,
    },
  });
  if (wordStatus === "unknown") {
    markAsSeen(id);
  }
  // TODO handle errors
  return resp.message;
}
