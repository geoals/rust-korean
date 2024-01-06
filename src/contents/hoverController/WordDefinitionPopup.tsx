import React from "react";
import { AddToAnkiButton } from "./AddToAnkiButton";
import type { KrDictEntryDTO, LookupResponse } from "~background/messages/lookup";
import type { WordStatusDTO } from "~background/messages/changeWordStatus";
import { sendToBackground } from "@plasmohq/messaging";

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
  response: LookupResponse;
}) {
  const [activeTabIndex, setActiveTabIndex] = React.useState(0);

  if (response.length === 0) {
    return null;
  }

  // TODO remove after we filter gargabe in backend
  if (response[0].dictEntry.tl_definitions.length === 0) {
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
        width: "420px",
        maxHeight: "400px",
        overflowY: "auto",
      }}
    >
      {response.length > 1 &&
        response.map((entry, index) => (
          <TabButton
            title={String(index + 1)}
            key={entry.dictEntry.sequence_number}
            onClick={() => setActiveTabIndex(index)}
            isActive={index === activeTabIndex}
          />
        ))}
      {response.map((entry, index) => (
        <DictionaryEntry
          {...entry.dictEntry }
          isVisible={index === activeTabIndex}
          key={entry.dictEntry.sequence_number}
        >
          <>
            <AddToAnkiButton
              hoveredWord={hoveredWord}
              hoveredSentence={hoveredSentence}
              {...entry.dictEntry}
            />
            <div>
              <button onClick={() => { changeWordStatus(entry.dictEntry.sequence_number, { status: "known" })}}>
                known
              </button>
              <button onClick={() => { changeWordStatus(entry.dictEntry.sequence_number, { status: "seen" })}}>
                seen
              </button>
              <button onClick={() => { changeWordStatus(entry.dictEntry.sequence_number, { status: "unknown" })}}>
                unknown
              </button>
            </div>
            <div>
              <button onClick={() => { changeWordStatus(entry.dictEntry.sequence_number, { ignored: !entry.status.ignored })}}>
                ignore
              </button>
              <button onClick={() => changeWordStatus(entry.dictEntry.sequence_number, { tracked: !entry.status.tracked })}>
                track
              </button>
            </div>
            {JSON.stringify(entry.status)}
          </>
        </DictionaryEntry>
      ))}
    </div>
  );
}

async function changeWordStatus(wordId: number, wordStatus: WordStatusDTO) {
  const resp = await sendToBackground({
    name: "changeWordStatus",
    body: {
      wordId,
      wordStatus,
    },
  });

  return resp.message;
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
      <b>
        <p>{headword}</p>
      </b>
      {children}
      {/*TODO display if it has been added to anki already */}
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
          <React.Fragment key={index}>
            <li>{element.translation}</li>
            {element.definition}
          </React.Fragment>
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
