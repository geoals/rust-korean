import { sendToBackground } from "@plasmohq/messaging";
import { useEffect, useRef, useState } from "react";
import type { LookupResponse } from "~background/messages/lookup";

export function useWordUnderCursor() {
  const { hoveredWord, setHoveredWord, hoveredWordRef, unsetHoveredWord } =
    useHoveredWordState();
  const [hoveredSentence, setHoveredSentence] = useState<string | undefined>(
    undefined
  );
  useHidePopup(unsetHoveredWord);
  const [response, setResponse] = useState<LookupResponse>([]);
  const getMousePosition = useMousePosition();
  const mousePosition = getMousePosition();
  const isFetchingRef = useRef(false);

  async function lookup(hoveredWord: string): Promise<LookupResponse> {
    // TODO react-query or something?
    const resp = await sendToBackground({
      name: "lookup",
      body: {
        word: hoveredWord,
      },
    });

    return resp.message;
  }

  async function lookupHoveredWordHandler(e: KeyboardEvent | MouseEvent) {
    if (!e.shiftKey) {
      return;
    }

    const mousePosition = getMousePosition();
    const underCursor = findWordAndSentenceUnderCursor(
      mousePosition.x,
      mousePosition.y
    );

    if (
      underCursor?.word === hoveredWordRef.current ||
      !underCursor?.word ||
      isFetchingRef.current
    ) {
      return;
    }

    isFetchingRef.current = true;
    const response = await lookup(underCursor.word);
    isFetchingRef.current = false;
    setResponse(response);
    setHoveredWord(underCursor.word);
    setHoveredSentence(underCursor.sentence);
  }

  useEffect(() => {
    document.addEventListener("mousemove", lookupHoveredWordHandler);
    document.addEventListener("keydown", lookupHoveredWordHandler);

    return () => {
      document.removeEventListener("mousemove", lookupHoveredWordHandler);
      document.removeEventListener("keydown", lookupHoveredWordHandler);
    };
  }, []);

  return {
    hoveredWord,
    hoveredSentence,
    response,
    positionX: mousePosition.x + window.scrollX, // TODO position relative to the hovered word itself
    positionY: mousePosition.y + window.scrollY,
  };
}

function useHoveredWordState() {
  const hoveredWordRef = useRef<string>(""); // Ref is used to capture the value of hoveredWord at the time of the event handler
  const [hoveredWord, setHoveredWord] = useState<string>("");
  const unsetHoveredWord = () => setHoveredWord("");

  useEffect(() => {
    hoveredWordRef.current = hoveredWord;
  }, [hoveredWord]);

  return {
    hoveredWord,
    setHoveredWord,
    hoveredWordRef,
    unsetHoveredWord,
  };
}

const findWordAndSentenceUnderCursor = (mouseX: number, mouseY: number) => {
  const range = document.caretRangeFromPoint(mouseX, mouseY); // TODO caretPositionFromPoint for firefox

  const textContent = range?.startContainer.textContent;

  if (textContent == null) {
    return undefined;
  }

  if (
    range?.startContainer?.nodeType !== Node.TEXT_NODE ||
    range?.startOffset >= textContent.length
  ) {
    return undefined;
  }

  const offset = range.startOffset;

  // Move backward to find the start of the word
  let start = offset;
  while (start > 0 && isHangulCharacter(textContent.charAt(start - 1))) {
    start--;
  }

  // Move forward to find the end of the word
  let end = offset;
  while (
    end < textContent.length &&
    isHangulCharacter(textContent.charAt(end))
  ) {
    end++;
  }

  const word = textContent.substring(start, end === -1 ? undefined : end);

  if (word === " ") {
    return undefined;
  }

  // TODO when textContent contains inline html, you might not get the whole sentence
  const sentences = textContent.split(/[.!?]/);
  const sentence = sentences.find((sentence) => sentence.includes(word)); // TODO this will return the wrong sentence if there are multiple sentences with the same word

  return { word, sentence };
};

function isHangulCharacter(char: string) {
  const hangulRegex = /[\uAC00-\uD7AF]/;
  return hangulRegex.test(char);
}

function useMousePosition() {
  const mousePositionRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = async (e: MouseEvent) => {
    mousePositionRef.current = { x: e.clientX, y: e.clientY }; // TODO avoid rerenders?
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  function getMousePosition() {
    return mousePositionRef.current;
  }

  return getMousePosition;
}

/**
 * Register event handlers on mouse click and escape key press to hide the popup
 *
 * @param unsetHoveredWord Callback function to unset the hovered word
 */
function useHidePopup(unsetHoveredWord: () => void): void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      unsetHoveredWord();
    }
  };

  const handleOnClick = (e: MouseEvent) => {
    const plasmoCsui = document.querySelector("html > plasmo-csui"); // TODO replace with something more robust
    if (e.target != plasmoCsui) {
      unsetHoveredWord();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleOnClick);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleOnClick);
    };
  }, []);
}
