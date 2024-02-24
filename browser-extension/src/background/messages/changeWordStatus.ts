import type { PlasmoMessaging } from "@plasmohq/messaging";
import { API_URL } from "~background/apiUrl";

export interface WordStatusDTO {
  status?: "known" | "unknown" | "seen";
  ignored?: boolean;
  frequency_rank?: number;
}

interface HttpResponseStatusAndBody {
  status: number;
  body: string;
  ok: boolean;
}

async function patchWordStatus(
  wordId: number,
  wordStatus: WordStatusDTO,
): Promise<HttpResponseStatusAndBody> {
  const result = await fetch(`${API_URL}/word_status/${wordId}`, {
    method: "PATCH",
    body: JSON.stringify(wordStatus),
    headers: {
      "Content-Type": "application/json",
    },
  });

  return { status: result.status, body: await result.text(), ok: result.ok };
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const message = await patchWordStatus(req.body.wordId, req.body.wordStatus);
  if (!message.ok) {
    console.error("error returned from PATCH /word_status", message);
  }

  res.send({
    message,
  });
};

export default handler;
