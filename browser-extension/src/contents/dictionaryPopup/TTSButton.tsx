import { sendToBackground } from "@plasmohq/messaging";
import * as styles from "./style.module.css"

export function TTSButton(props: { headword: string; isVisible: boolean }) {
  if (!props.isVisible) {
    return null;
  }

  return (
    <button
      className={styles.button}
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
      TTS
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
