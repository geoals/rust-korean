import type { PlasmoMessaging } from "@plasmohq/messaging";

const apiKey = process.env.PLASMO_PUBLIC_TTS_KEY ?? "";
const ttsEndpoint = "https://api.narakeet.com/text-to-speech/mp3?voice=yoo-jung";

function fetch_and_play_tts(word: string) {
  const headers = new Headers();
  headers.append("Content-Type", "text/plain");
  headers.append("x-api-key", apiKey);
  headers.append("accept", "application/octet-stream");

  return fetch(ttsEndpoint, {
    method: "POST",
    headers: headers,
    body: word,
  }).then((response) => response.arrayBuffer());
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const binary = String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)));
  return btoa(binary);
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const message = arrayBufferToBase64(await fetch_and_play_tts(req.body.word));

  res.send({
    message,
  });
};

export default handler;
