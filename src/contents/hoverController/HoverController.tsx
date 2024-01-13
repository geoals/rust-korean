import React, { useLayoutEffect } from "react";
import { WordDefinitionPopup } from "./WordDefinitionPopup";
import { useWordUnderCursor } from "./useWordUnderCursor";
import type {
  KrDictEntryDTO,
} from "~background/messages/lookup";
import { AddToAnkiButton } from "./AddToAnkiButton";
import { StatusButtons } from "./StatusButtons";

export function HoverController() {
  const { hoveredElement, hoveredSentence, hoveredWord, positionX, positionY, positionY2, response } = useWordUnderCursor();
  const [activeTabIndex, setActiveTabIndex] = React.useState(0);
  const previousHoveredWord = React.useRef<string | null>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (popupRef.current) {
      const height = popupRef.current.clientHeight;
      if (positionY - window.scrollY + height > window.innerHeight) {
        popupRef.current.style.top = `${positionY2 - height - 16}px`;
      }
    }
  }, [popupRef.current, hoveredElement, positionY, positionY2]);

  if (hoveredWord !== previousHoveredWord.current) {
    setActiveTabIndex(0);
    previousHoveredWord.current = hoveredWord;
  }


  // TODO loading
  if (response.length === 0 || !hoveredWord) {
    return null;
  }

  // TODO remove after we filter garbage in backend
  // if (response[0].dictEntry.tl_definitions.length === 0) {
  //   return null;
  // }

  return (
    <>
      <WordDefinitionPopup positionX={positionX} positionY={positionY} ref={popupRef}>
        {response.length > 1 &&
          response.map((entry, index) => (
            <TabButton
              title={String(index + 1)}
              key={entry.dictEntry.sequence_number + " " + index}
              onClick={() => setActiveTabIndex(index)}
              isActive={index === activeTabIndex}
            />
          ))}
        {response.map((entry, index) => (
          <DictionaryEntryContent
            {...entry.dictEntry}
            isVisible={index === activeTabIndex}
            key={entry.dictEntry.sequence_number + " " + index}
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
  frequency,
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
      <br />
      {frequency && <span style={{ paddingLeft: "8px" }}>{frequency}</span>}
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
