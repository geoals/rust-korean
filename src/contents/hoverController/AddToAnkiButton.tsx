import { sendToBackground } from "@plasmohq/messaging";
import type { AddToAnkiPayload } from "~background/messages/addAnkiNote";

export function AddToAnkiButton({
  hoveredWord,
  hoveredSentence,
  response,
}: {
  hoveredWord: string;
  hoveredSentence: string;
  response: string;
}) {
  function addToAnkiBtnHandler(): void {
    const { headword, hanja, definitionFull } = reponseToFields(response);
    addAnkiNoteMessage({
      hoveredWord,
      headword,
      hanja,
      sentence: hoveredSentence,
      definitionFull,
    });
  }

  return (
      <button
        style={{ position: "absolute", right: "8px" }}
        onClick={addToAnkiBtnHandler}
      >
        add to anki
      </button>
  );
}

async function addAnkiNoteMessage(payload: AddToAnkiPayload) {
  const { hoveredWord, sentence, headword, hanja, definitionFull } = payload;
  const resp = await sendToBackground<AddToAnkiPayload>({
    name: "addAnkiNote",
    body: {
      headword,
      sentence,
      hoveredWord,
      hanja,
      reading: undefined, // TODO
      selectionText: window.getSelection()?.toString(),
      definitionFull,
    },
  });
  // TODO handle errors
  return resp.message;
}

function reponseToFields(response: string) {
  const regexPattern =
    /(?:★{0,3}\s*)?(?<headword>[^〔]+)\s*〔(?<hanja>[^〕]+)〕\s*(?<definitionFull>[\s\S]+)/;

  const match = response.match(regexPattern);

  if (match) {
    return match.groups;
  } else {
    return undefined;
  }
}