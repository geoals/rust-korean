
import type { PlasmoMessaging } from "@plasmohq/messaging";

export type AnalyzeResponse = {
    [key: string]: Array<{id: number, status: "known" | "seen" | "unknown", ignored: boolean, frequency_rank?: number }>,
}

async function postAnalyze(payload: string): Promise<AnalyzeResponse> {
  const result = await fetch(`https://rust.alsvik.cloud/analyze`, {
    method: "POST",
    body: payload,
    headers: {
        Accept: "application/json",
    }
  });

  return result.json();
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const message = await postAnalyze(req.body);

  res.send({ message });
};

export default handler;
