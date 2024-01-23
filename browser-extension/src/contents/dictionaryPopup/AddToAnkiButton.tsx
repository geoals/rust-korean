import { sendToBackground } from "@plasmohq/messaging";
import type { AddToAnkiPayload } from "~background/messages/addAnkiNote";
import AnkiImg from './anki.png'; 
import * as styles from "./style.module.css";
import { markAsSeen } from "./StatusButtons";

export function AddToAnkiButton({
  hoveredWord,
  hoveredSentence,
  headword,
  hanja,
  definition_full,
  reading,
  frequency,
  sequence_number,
  wordStatus,
}: {
  hoveredWord: string;
  hoveredSentence: string;
  headword: string;
  hanja?: string;
  definition_full: string;
  reading?: string;
  frequency?: number;
  sequence_number: number;
  wordStatus: 'known' | 'seen' | 'unknown';
}) {
  function addToAnkiBtnHandler(): void {
    addAnkiNoteMessage({
        hoveredWord,
        headword,
        hanja,
        reading,
        sentence: hoveredSentence,
        definitionFull: definition_full,
        frequency: frequency?.toString(),
      }, 
      sequence_number,
      wordStatus,
    );
  }

  return (
      <button
        style={{ position: "absolute", right: "8px", display: "flex", alignItems: "center", }}
        onClick={addToAnkiBtnHandler}
        className={styles.button}
      >
        <img className="anki-img" src={AnkiImg} alt="add to anki" style={{ width: "20px", height: "20px", borderRadius: "50%" }}/>
        <span style={{ marginLeft: "4px" }}>Export</span>
      </button>
  );
}

async function addAnkiNoteMessage(payload: AddToAnkiPayload, id: number, wordStatus: 'known' | 'seen' | 'unknown') {
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
  if (wordStatus === 'unknown') {
    markAsSeen(id)
  }
  // TODO handle errors
  return resp.message;
}