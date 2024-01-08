import React from "react";
import { WordDefinitionPopup } from "./WordDefinitionPopup";
import { useWordUnderCursor } from "./useWordUnderCursor";
import type {
  KrDictEntryDTO,
  LookupResponse,
} from "~background/messages/lookup";
import { AddToAnkiButton } from "./AddToAnkiButton";
import { StatusButtons } from "./StatusButtons";

export function HoverController() {
  const {
    hoveredWord,
    hoveredSentence,
    hoveredElement,
    response,
    positionX,
    positionY,
  } = useWordUnderCursor();

  return (
    <TabbedWordDefinitions
      hoveredWord={hoveredWord}
      hoveredSentence={hoveredSentence}
      hoveredElement={hoveredElement}
      response={response}
      positionX={positionX}
      positionY={positionY}
    />
  );
}

export function TabbedWordDefinitions({
  hoveredWord,
  hoveredSentence,
  hoveredElement,
  response,
  positionX,
  positionY,
}: {
  hoveredWord: string;
  hoveredSentence: string;
  hoveredElement: Element;
  response: LookupResponse;
  positionX: number;
  positionY: number;
}) {
  const [activeTabIndex, setActiveTabIndex] = React.useState(0);

  // TODO loading
  if (response.length === 0 || !response || !hoveredWord) {
    return null;
  }

  // TODO remove after we filter gargabe in backend
  // if (response[0].dictEntry.tl_definitions.length === 0) {
  //   return null;
  // }

  return (
    <>
      <WordDefinitionPopup positionX={positionX} positionY={positionY}>
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
          <DictionaryEntryContent
            {...entry.dictEntry}
            isVisible={index === activeTabIndex}
            key={entry.dictEntry.sequence_number}
          >
            <>
              <AddToAnkiButton
                hoveredWord={hoveredWord}
                hoveredSentence={hoveredSentence}
                {...entry.dictEntry}
              />
              <StatusButtons entry={entry} hoveredElement={hoveredElement} />
              {JSON.stringify(entry.status)}
            </>
          </DictionaryEntryContent>
        ))}
      </WordDefinitionPopup>
    </>
  );
}

interface DictionaryEntryContentProps extends KrDictEntryDTO {
  isVisible: boolean;
  children: React.ReactNode;
}

function DictionaryEntryContent({
  headword,
  hanja,
  reading,
  stars,
  part_of_speech,
  deinflection_rule,
  tl_definitions,
  isVisible,
  children,
}: DictionaryEntryContentProps) {
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
