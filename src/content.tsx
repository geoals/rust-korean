import React, { useState, useEffect } from 'react';
import { sendToBackground } from "@plasmohq/messaging"

export default function FloatingBox() {
  const {hoveredWord, positionX, positionY} = useWordUnderCursor();
  const isVisible = useIsVisible(hoveredWord);
  // TODO react-query or something?
  const [response, setResponse] = useState<string | undefined>(undefined);

  async function sendToBg() {
    if (!hoveredWord) {
      return
    }

    const resp = await sendToBackground({
      name: "lookup",
      body: {
        word: hoveredWord
      }
    })

    if (resp.message) {
      console.log(resp.message)
      setResponse(resp.message)
    }
  }
  void sendToBg()

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
          {/* tabs for other senses */}
          {/* for deconjugated terms: conjugation/grammar */}
          {/* add to anki btn */}
        </div>
      )}
    </>
  );
};

function useWordUnderCursor() {
  const mousePositionRef = React.useRef({x: 0, y: 0});
  const [hoveredWord, setHoveredWord] = useState<string | undefined>(undefined);

  const findWordUnderCursor = (mouseX: number, mouseY: number) => {
    const range = document.caretRangeFromPoint(mouseX, mouseY); // TODO caretPositionFromPoint for firefox

    if (range?.startContainer?.nodeType !== Node.TEXT_NODE
      || range?.startOffset === 0
      || range?.startOffset >= range?.startContainer?.textContent?.length) {
      return undefined;
    }

    const textNode = range.startContainer;
    const offset = range.startOffset;

    const start = textNode.textContent.lastIndexOf(' ', offset) + 1;
    const end = textNode.textContent.indexOf(' ', offset);
    const word = textNode.textContent.substring(start, end === -1 ? undefined : end);

    if (word === ' ') {
      return undefined;
    }

    return word
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    mousePositionRef.current = {x: e.clientX, y: e.clientY}; // TODO avoid rerenders?
    if (e.shiftKey) {
      const hoveredWord = findWordUnderCursor(mousePositionRef.current.x, mousePositionRef.current.y);
      setHoveredWord(hoveredWord);
    }
  };

  const handleShiftKeyDown = (e: React.KeyboardEvent) => {
    if (e.shiftKey) {
      const hoveredWord = findWordUnderCursor(mousePositionRef.current.x, mousePositionRef.current.y);
      setHoveredWord(hoveredWord);
    }
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleShiftKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleShiftKeyDown);
    };
  }, []);

  return {
    hoveredWord,
    positionX: mousePositionRef.current.x + window.scrollX,
    positionY: mousePositionRef.current.y + window.scrollY,
  };
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