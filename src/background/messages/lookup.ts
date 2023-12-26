import type { PlasmoMessaging } from "@plasmohq/messaging"

async function getLookup(word: string): Promise<string> {
  return fetch(`http://localhost:3000/lookup/${word}`)
    .then(res => res.text()) // TODO error handling
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const message = await getLookup(req.body.word)

  res.send({
    message
  })
}

export default handler