import { sendToBackground } from "@plasmohq/messaging";
import type { AddToAnkiPayload } from "~background/messages/addAnkiNote";

export function AddToAnkiButton({
  hoveredWord,
  hoveredSentence,
  headword,
  hanja,
  definition_full,
  reading,
}: {
  hoveredWord: string;
  hoveredSentence: string;
  headword: string;
  hanja?: string;
  definition_full: string;
  reading?: string;
}) {
  function addToAnkiBtnHandler(): void {
    addAnkiNoteMessage({
      hoveredWord,
      headword,
      hanja,
      reading,
      sentence: hoveredSentence,
      definitionFull: definition_full,
    });
  }

  return (
      <button
        style={{ position: "absolute", right: "8px" }}
        onClick={addToAnkiBtnHandler}
      >
        Add to ANKI
      </button>
  );
}

async function addAnkiNoteMessage(payload: AddToAnkiPayload) {
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
    },
  });
  // TODO handle errors
  return resp.message;
}