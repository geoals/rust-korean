import React from "react";
import { WordDefinitionPopup } from "./WordDefinitionPopup";
import { useWordUnderCursor } from "./useWordUnderCursor";

export function HoverController() {
  const { hoveredWord, hoveredSentence, response, positionX, positionY } =
    useWordUnderCursor();

  return (
    <>
      {!!hoveredWord && !!response && ( // TODO loading
        <WordDefinitionPopup
          hoveredWord={hoveredWord}
          hoveredSentence={hoveredSentence}
          positionX={positionX}
          positionY={positionY}
          response={response}
        />
      )}
    </>
  );
}
