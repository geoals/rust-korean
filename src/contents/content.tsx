import React, { useState, useEffect } from 'react';
import { sendToBackground } from "@plasmohq/messaging"

const FloatingBox = () => {
  const {hoveredWord, response, positionX, positionY} = useWordUnderCursor();
  const isVisible = useIsVisible(hoveredWord);

  return (
    <>
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            top: `${positionY}` + 'px',
            left: `${positionX + 6}` + 'px',
            color: 'black',
            backgroundColor: 'white',
            padding: '8px',
            border: 'solid black 2px',
            width: '420px',
          }}
          id="rust-korean-plasmo-popup" // TODO: id is unused
        >
          {/* TODO put content/children into subcomponent */}
          <b>{hoveredWord}</b>
          <br/>
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

function useWordUnderCursor() {
  const [hoveredWord, setHoveredWord] = useState<string | undefined>(undefined);
  const [response, setResponse] = useState("");
  const getMousePosition = useMousePosition();
  const mousePosition = getMousePosition();

  async function sendToBg(hoveredWord: string) {
    // TODO react-query or something?
    const resp = await sendToBackground({
      name: "lookup",
      body: {
        word: hoveredWord
      }
    })

    return resp.message
  }

  const findWordUnderCursor = (mouseX: number, mouseY: number) => {
    const range = document.caretRangeFromPoint(mouseX, mouseY); // TODO caretPositionFromPoint for firefox

    const textContent = range?.startContainer.textContent;

    if (textContent == null) {
      return undefined;
    }

    if (range?.startContainer?.nodeType !== Node.TEXT_NODE
      || range?.startOffset === 0
      || range?.startOffset >= textContent.length) {
      return undefined;
    }

    const offset = range.startOffset;

    const start = textContent.lastIndexOf(' ', offset) + 1;
    const end = textContent.indexOf(' ', offset);
    const word = textContent.substring(start, end === -1 ? undefined : end);

    if (word === ' ') {
      return undefined;
    }

    return word
  };


  async function lookupHoveredWordHandler(e: React.KeyboardEvent | React.MouseEvent) {
    if (!e.shiftKey) {
      return
    }
    const mousePosition = getMousePosition()
    const hoveredWord = findWordUnderCursor(mousePosition.x, mousePosition.y);
    const response = await sendToBg(hoveredWord)
    setHoveredWord(hoveredWord);
    setResponse(response);
  }

  useEffect(() => {
    document.addEventListener('mousemove', lookupHoveredWordHandler);
    document.addEventListener('keydown', lookupHoveredWordHandler);

    return () => {
      document.removeEventListener('mousemove', lookupHoveredWordHandler);
      document.removeEventListener('keydown', lookupHoveredWordHandler);
    };
  }, []);

  return {
    hoveredWord,
    response,
    positionX: mousePosition.x + window.scrollX,
    positionY: mousePosition.y + window.scrollY,
  };
}

function useMousePosition() {
  const mousePositionRef = React.useRef({ x: 0, y: 0 });

  const handleMouseMove = async (e: React.MouseEvent) => {
    mousePositionRef.current = {x: e.clientX, y: e.clientY}; // TODO avoid rerenders?
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  function getMousePosition() {
    return mousePositionRef.current;
  }

  return getMousePosition
}

function useIsVisible(hoveredWord: string | undefined): boolean {
  const [isVisible, setIsVisible] = useState(Boolean(hoveredWord));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsVisible(false);
    }
  };

  const handleOnClick = (e: React.MouseEvent) => {
    const plasmoCsui = document.querySelector('html > plasmo-csui'); // TODO replace with something more robust
    if (e.target != plasmoCsui) {
      setIsVisible(false);
    }
  }

  useEffect(() => {
    setIsVisible(Boolean(hoveredWord));
  }, [hoveredWord]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleOnClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleOnClick);
    };
  }, []);

  return isVisible;
}

const renderTextWithNewlines = (text: string) => {
  if (!text) {
    return null;
  }
  const lines = text.split('\n');
  return lines.map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ));
};