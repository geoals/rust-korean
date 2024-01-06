import { sendToBackground } from "@plasmohq/messaging";
import type { AddToAnkiPayload } from "~background/messages/addAnkiNote";
import AnkiImg from './anki.png'; 

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
        style={{ position: "absolute", right: "8px", display: "flex", alignItems: "center", }}
        onClick={addToAnkiBtnHandler}
      >
        <img className="anki-img" src={AnkiImg} alt="add to anki" />
        <span style={{ marginLeft: "4px" }}>Export</span>
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