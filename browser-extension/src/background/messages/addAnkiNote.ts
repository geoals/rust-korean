import type { PlasmoMessaging } from "@plasmohq/messaging";

export type AddToAnkiPayload = {
  headword: string;
  reading?: string;
  hanja?: string;
  hoveredWord: string;
  sentence: string;
  selectionText?: string;
  definitionFull: string;
  frequency?: string;
};

async function postAddAnkiNote(payload: AddToAnkiPayload): Promise<string> {
  const json = {
    action: "addNote",
    version: 6,
    params: {
      note: {
        deckName: "Korean",
        modelName: "Korean",
        fields: {
          VocabHangul: payload.headword,
          VocabReading: payload.reading,
          VocabHanja: payload.hanja,
          VocabAudio: undefined,
          Definition: payload.selectionText,
          Sentence: payload.sentence,
          DefinitionFull: payload.definitionFull,
          VocabOriginalInflection: payload.hoveredWord,
          Frequency: payload.frequency,
        },
        tags: ["rust-korean-plasmo"],
      },
    },
  };

  return fetch("http://127.0.0.1:8765", {
    method: "POST",
    body: JSON.stringify(json),
  }).then((res) => res.text());
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const message = await postAddAnkiNote(req.body);

  res.send({
    message,
  });
};

export default handler;
