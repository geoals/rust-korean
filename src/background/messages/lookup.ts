import type { PlasmoMessaging } from "@plasmohq/messaging"

export interface KrDictEntryDTO {
  headword: string;
  reading: string | null;
  part_of_speech: string;
  deinflection_rule: string | null;
  definition_full: string;
  sequence_number: number;
  hanja: string | null;
  tl_definitions: {
    translation: string;
    definition: string;
  }[],
  stars: number;
}

async function getLookup(word: string): Promise<Array<KrDictEntryDTO>> {
  return fetch(`http://localhost:3000/lookup/${word}`)
    .then(res => res.json()) // TODO error handling
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const message = await getLookup(req.body.word)

  res.send({
    message
  })
}

export default handler