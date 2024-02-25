import { sendToBackground } from "@plasmohq/messaging";
import TextToSpeechIcon from "react:~/../assets/audio.svg";

export function TTSButton(props: { headword: string }) {
  return (
    <button
      className="hover:fill-muted hover:scale-105"
      onClick={async () => {
        const response = await sendToBackground({
          name: "tts",
          body: { word: props.headword },
        });
        const audioData = base64ToArrayBuffer(response.message);
        const blob = new Blob([audioData], { type: "audio/mp3" });
        const audioElement = new Audio();
        audioElement.src = URL.createObjectURL(blob);
        audioElement.play();
      }}
    >
      <TextToSpeechIcon className="duration-0" />
    </button>
  );
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const length = binaryString.length;
  const buffer = new ArrayBuffer(length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < length; i++) {
    view[i] = binaryString.charCodeAt(i);
  }
  return buffer;
}
