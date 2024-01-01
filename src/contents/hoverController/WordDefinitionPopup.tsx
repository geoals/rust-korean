import React from "react";
import { AddToAnkiButton } from "./AddToAnkiButton";

export function WordDefinitionPopup({
  hoveredWord,
  hoveredSentence,
  positionX,
  positionY,
  response,
}: {
  hoveredWord: string;
  hoveredSentence: string;
  positionX: number;
  positionY: number;
  response: string;
}) {
  return (
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
      <AddToAnkiButton
        hoveredWord={hoveredWord}
        hoveredSentence={hoveredSentence}
        response={response}
      />
      {/* TODO put content/children into subcomponent */}
      {renderTextWithNewlines(response)}
      {/* word class */}
      {/* reading if different than spelling */}
      {/* unknown, seen, known */}
      {/* frequency */}
      {/* hanja */}
      {/* definition list */}
      {/* tabs for homonyms */}
      {/* for deconjugated terms: conjugation/grammar */}
    </div>
  );
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