import React, { useState, useEffect, useRef } from "react";
import { sendToBackground } from "@plasmohq/messaging";
import type { AddToAnkiPayload } from "~background/messages/addAnkiNote";

function reponseToFields(response: string) {
  const regexPattern = /(?:★{0,3}\s*)?(?<headword>[^〔]+)\s*〔(?<hanja>[^〕]+)〕\s*(?<definitionFull>[\s\S]+)/;

  const match = response.match(regexPattern);
  
  if (match) {
    return match.groups;
  } else {
    return undefined;
  }
}

const FloatingBox = () => {
  const { hoveredWord, hoveredSentence, response, positionX, positionY } = useWordUnderCursor();

  async function addAnkiNoteMessage(payload: AddToAnkiPayload) {
    const { hoveredWord, sentence, headword, hanja, definitionFull } = payload;
    const resp = await sendToBackground<AddToAnkiPayload>({
      name: "addAnkiNote",
      body: {
        headword,
        sentence,
        hoveredWord,
        hanja,
        reading: undefined, // TODO
        selectionText: window.getSelection()?.toString(),
        definitionFull,
      },
    });
    console.log(resp);

    return resp.message;
  }

  function addToAnkiBtnHandler(
    _event: React.MouseEvent<HTMLButtonElement>
  ): void {
    const { headword, hanja, definitionFull } = reponseToFields(response);
    addAnkiNoteMessage({ hoveredWord, headword, hanja, sentence: hoveredSentence, definitionFull });
  }

  useEffect(() => {
    console.log(hoveredWord);
  }, [hoveredWord]);

  return (
    <>
      {Boolean(hoveredWord) && (
        <div
          style={{
            position: "absolute",
            top: `${positionY + 12}` + "px",
            left: `${positionX + 6}` + "px",
            color: "black",
            backgroundColor: "white",
            padding: "8px",
            border: "solid black 2px",
            width: "320px",
          }}
          id="rust-korean-plasmo-popup" // TODO: id is unused
        >
          <button
            style={{ position: "absolute", right: "8px" }}
            onClick={addToAnkiBtnHandler}
          >
            add to anki
          </button>
          {/* TODO put content/children into subcomponent */}
          <b>{hoveredWord}</b>
          <br />
          {renderTextWithNewlines(response)}
          {/* word class */}
          {/* reading if different than spelling */}
          {/* unknown, seen, known */}
          {/* frequency */}
          {/* hanja */}
          {/* definition list */}
          {/* tabs for homonyms */}
          {/* for deconjugated terms: conjugation/grammar */}
          {/* add to anki btn */}
        </div>
      )}
    </>
  );
};

export default FloatingBox;

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

function useWordUnderCursor() {
  const { hoveredWord, setHoveredWord, hoveredWordRef, unsetHoveredWord } =
  useHoveredWordState();
  const [hoveredSentence, setHoveredSentence] = useState<string | undefined>(undefined);
  useHidePopup(unsetHoveredWord);
  const [response, setResponse] = useState("");
  const getMousePosition = useMousePosition();
  const mousePosition = getMousePosition();
  const isFetchingRef = useRef(false);

  async function lookup(hoveredWord: string) {
    console.log("looking up", hoveredWord);
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
    const underCursor = findWordAndSentenceUnderCursor(mousePosition.x, mousePosition.y);

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
    positionX: mousePosition.x + window.scrollX,
    positionY: mousePosition.y + window.scrollY,
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
    range?.startOffset === 0 ||
    range?.startOffset >= textContent.length
  ) {
    return undefined;
  }

  const offset = range.startOffset;

  const start = textContent.lastIndexOf(" ", offset) + 1;
  const end = textContent.indexOf(" ", offset);
  const word = textContent.substring(start, end === -1 ? undefined : end);

  if (word === " ") {
    return undefined;
  }

  // TODO when textContent contains inline html, you might not get the whole sentence
  const sentences = textContent.split(/[.!?]/);
  const sentence = sentences.find((sentence) => sentence.includes(word)); // TODO this will return the wrong sentence if there are multiple sentences with the same word

  console.log(sentence);

  return { word, sentence };
};

function useMousePosition() {
  const mousePositionRef = React.useRef({ x: 0, y: 0 });

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

const renderTextWithNewlines = (text: string) => {
  if (!text) {
    return null;
  }
  const lines = text.split("\n");
  return lines.map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ));
};
