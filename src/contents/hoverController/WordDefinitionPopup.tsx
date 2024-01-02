import React from "react";
import { AddToAnkiButton } from "./AddToAnkiButton";
import type { KrDictEntryDTO } from "~background/messages/lookup";

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
  response: Array<KrDictEntryDTO>;
}) {
  const [activeTabIndex, setActiveTabIndex] = React.useState(0);

  if (response.length === 0) {
    return null;
  }

  // TODO remove after we filter gargabe in backend
  if (response[0].tl_definitions.length === 0) {
    return null;
  }

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
        maxHeight: "400px",
        overflowY: "auto",
      }}
    >
      {response.length > 1 &&
        response.map((entry, index) => (
          <TabButton
            title={String(index + 1)}
            key={entry.sequence_number}
            onClick={() => setActiveTabIndex(index)}
            isActive={index === activeTabIndex}
          />
        ))}
      {response.map((entry, index) => (
        <DictionaryEntry
          {...entry}
          isVisible={index === activeTabIndex}
          key={entry.sequence_number}
        >
          <AddToAnkiButton
            hoveredWord={hoveredWord}
            hoveredSentence={hoveredSentence}
            {...entry}
          />
        </DictionaryEntry>
      ))}
    </div>
  );
}

interface DictionaryEntryProps extends KrDictEntryDTO {
  isVisible: boolean;
  children: React.ReactNode;
}

function DictionaryEntry({
  headword,
  hanja,
  reading,
  stars,
  part_of_speech,
  deinflection_rule,
  tl_definitions,
  isVisible,
  children,
}: DictionaryEntryProps) {
  const getStyle = () => {
    if (!isVisible) {
      return { display: "none" };
    }
  };

  return (
    <div style={getStyle()}>
      {children}
      <b>
        <p>{headword}</p>
      </b>
      {/* unknown, seen, known */}
      {/* frequency */}
      {[...Array(stars)].map((_, i) => (
        <React.Fragment key={i}>★</React.Fragment>
      ))}
      {hanja && <span style={{ paddingLeft: "8px" }}>{hanja}</span>}
      {reading && reading !== headword && (
        <span style={{ paddingLeft: "8px" }}>{reading}</span>
      )}
      {part_of_speech && (
        <span style={{ paddingLeft: "8px" }}>{part_of_speech}</span>
      )}
      {deinflection_rule && (
        <span style={{ paddingLeft: "8px" }}>{deinflection_rule}</span>
      )}
      <ol lang="jp">
        {tl_definitions.map((element, index) => (
          <>
            <li>{element.translation}</li>
            {element.definition}
          </>
        ))}
      </ol>
      {/* for deconjugated terms: conjugation/grammar */}
    </div>
  );
}

function TabButton(props: {
  title: string;
  onClick: () => void;
  isActive: boolean;
}) {
  const getStyle = () => {
    if (props.isActive) {
      return { backgroundColor: "lightblue" };
    }
  };

  return (
    <button onClick={props.onClick} style={getStyle()}>
      {props.title}
    </button>
  );
}
