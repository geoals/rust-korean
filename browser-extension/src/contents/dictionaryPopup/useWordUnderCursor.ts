import { sendToBackground } from "@plasmohq/messaging";
import { useEffect, useRef, useState } from "react";
import type { LookupDTO, LookupResponse } from "~background/messages/lookup";
import styles from '../underline.module.css';

const POPUP_WIDTH = 456;
const hangulRegex = /[\uAC00-\uD7AF]/;

export function useWordUnderCursor() {
  const { hoveredWord, setHoveredWord, hoveredWordRef, unsetHoveredWord, hoveredElement, setHoveredElement, hoveredElementRef } =
    useHoveredWordState();
  const [hoveredSentence, setHoveredSentence] = useState<string | undefined>(
    undefined,
  );
  useHidePopupWithEscapeKey(unsetHoveredWord);
  const [response, setResponse] = useState<LookupResponse>({});
  const getMousePosition = useMousePosition();
  const isFetchingRef = useRef(false);

  async function lookup(hoveredWord: string): Promise<LookupResponse> {
    const resp = await sendToBackground({
      name: "lookup",
      body: {
        word: hoveredWord,
      },
    });

    return resp.message;
  }

  async function lookupWordUnderCursorAndShowPopup() {
    const mousePosition = getMousePosition();
    const underCursor = findWordAndSentenceUnderCursor(
      mousePosition.x,
      mousePosition.y,
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

    hoveredElementRef.current?.classList.remove(styles.active);
    setResponse(filterResponse(response));
    setHoveredWord(underCursor.word);
    setHoveredSentence(underCursor.sentence);
    setHoveredElement(underCursor.element);
    underCursor.element?.classList.add(styles.active);

    return underCursor.word;
  }

  async function clickHandler(e: MouseEvent) {
    if ((e.target as HTMLElement)?.textContent === hoveredWordRef.current) {
      unsetHoveredWord();
      return;
    }
    const newWord = await lookupWordUnderCursorAndShowPopup();
    const plasmoCsui = document.querySelector("html > plasmo-csui");
    if (
      !newWord 
      && !isWithinBounds(e.clientX, e.clientY, hoveredElement?.getBoundingClientRect()) 
      && (e.target as HTMLElement)?.tagName != plasmoCsui?.tagName
    ) {
      unsetHoveredWord();
    }
  }

  function keyDownMouseMoveHandler(e: KeyboardEvent | MouseEvent) {
    if (!e.shiftKey) {
      return;
    }
    lookupWordUnderCursorAndShowPopup();
  }

  useEffect(() => {
    document.addEventListener("mousemove", keyDownMouseMoveHandler);
    document.addEventListener("keydown", keyDownMouseMoveHandler);
    document.addEventListener("click", clickHandler);

    return () => {
    document.removeEventListener("mousemove", keyDownMouseMoveHandler);
    document.removeEventListener("keydown", keyDownMouseMoveHandler);
    document.removeEventListener("click", clickHandler);
    };
  }, []);

  const { x, y, y2 } = getPosition(hoveredElement);

  return {
    hoveredWord,
    hoveredSentence,
    hoveredElement,
    response,
    positionX: x,
    positionY: y + 6,
    positionY2: y2 + 6,
  };
}

function filterResponse(response: LookupResponse) {
    // TODO remove filtering after we filter garbage in backend
    const filterPredicate = (it: LookupDTO) => it.dictEntry.tl_definitions.length > 0
      && it.dictEntry.tl_definitions[0].translation.length > 0 
      && !hangulRegex.test(it.dictEntry.tl_definitions[0].translation);

    return Object.fromEntries(
      Object.entries(response)
        .map(([key, value]) => [key, value.filter(filterPredicate)])
        .filter(([_, value]) => value.length > 0)
    );
}

function getPosition(element: HTMLElement | null) {
  if (!element) {
    return { x: 0, y: 0, y2: 0 };
  }
  const { x, top, bottom, left, right } = element.getBoundingClientRect();
  const centeredX = x + window.scrollX + ((right - left) / 2);
  // 300 is the height of the popup, 16 is the padding?
  // const y = bottom + 316 >= window.innerHeight ? top - 332: bottom;
  return { x: clampHorizontallyWithinViewport(centeredX, 16), y: bottom + window.scrollY, y2: top + window.scrollY };
}

function clampHorizontallyWithinViewport(positionX: number, padding: number) {
  if (positionX - (POPUP_WIDTH / 2) <= padding) {
    return padding;
  }
  if (positionX - (POPUP_WIDTH / 2) + POPUP_WIDTH + padding >= document.documentElement.clientWidth) { // TODO react to window resize
    return document.documentElement.clientWidth - padding * 2 - POPUP_WIDTH;
  }
  return positionX - (POPUP_WIDTH / 2);
}

function useHoveredWordState() {
  const hoveredWordRef = useRef<string>(""); // Ref is used to capture the value of hoveredWord at the time of the event handler
  const [hoveredWord, setHoveredWord] = useState<string>("");
  const hoveredElementRef = useRef<HTMLElement | null>(null); // Ref is used to capture the value of hoveredWord at the time of the event handler
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null,
  );
  const unsetHoveredWord = () => {
    setHoveredWord("");
    hoveredElementRef.current?.classList.remove(styles.active);
  }

  useEffect(() => {
    hoveredWordRef.current = hoveredWord;
  }, [hoveredWord]);

  useEffect(() => {
    hoveredElementRef.current = hoveredElement;
  }, [hoveredElement]);

  return {
    hoveredWord,
    setHoveredWord,
    hoveredWordRef,
    unsetHoveredWord,
    hoveredElement,
    setHoveredElement,
    hoveredElementRef
  };
}

const findWordAndSentenceUnderCursor = (mouseX: number, mouseY: number) => {
  const range = document.caretRangeFromPoint(mouseX, mouseY); // TODO caretPositionFromPoint for firefox

  const textContent = range?.startContainer.textContent;
  if (!isWithinBounds(mouseX, mouseY, range?.commonAncestorContainer?.parentElement?.getBoundingClientRect())) {
    return undefined;
  }

  if (textContent == null) {
    return undefined;
  }

  if (range?.startContainer?.nodeType !== Node.TEXT_NODE) {
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

  const sentences = findFullParagraph(range.startContainer).split(/[.!?]/);
  // TODO  don't remove .!? from the sentence
  // TODO this will return the wrong sentence if there are multiple sentences with the same word
  const sentence = sentences.find((sentence) => sentence.includes(word))?.replaceAll('\n', ''); 

  return { word, sentence, element: range.startContainer.parentElement };
};

// TODO this needs more testing and work
function findFullParagraph(node: Node): string {
  let newNode = node;
  while (['a', 'span'].includes(newNode.nodeName.toLocaleLowerCase()) || newNode.nodeType === Node.TEXT_NODE) {
    newNode = newNode.parentNode!;
  }
  if (!newNode.textContent) {
    throw new Error("Could not find full paragraph for hoverd word");
  }
  return newNode.textContent;
}

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
 * Register event handler on escape key press to hide the popup
 *
 * @param unsetHoveredWord Callback function to unset the hovered word
 */
function useHidePopupWithEscapeKey(unsetHoveredWord: () => void): void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      unsetHoveredWord();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}

function isWithinBounds(mouseX: number, mouseY: number, textNode?: DOMRect) {
  if (!textNode) {
    return false;
  }
  const { left, right, bottom, top } = textNode;
  return mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom;
}
