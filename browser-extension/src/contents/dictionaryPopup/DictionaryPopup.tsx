import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWordUnderCursor } from "./useWordUnderCursor";
import { AddToAnkiButton } from "./AddToAnkiButton";
import { StatusButtons } from "./StatusButtons";
import styles from "./style.module.css";
import type { KrDictEntryDTO, LookupDTO } from "~background/messages/lookup";
import { TTSButton } from "./TTSButton";

export function DictionaryPopup() {
  const {
    hoveredElement,
    hoveredSentence,
    hoveredWord,
    positionX,
    positionY,
    positionY2,
    response,
  } = useWordUnderCursor();
  const [activeTabIndex, setActiveTabIndex] = React.useState(0);
  const previousHoveredWord = React.useRef<string | null>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);

  // Position popup above hovered word if it would otherwise go offscreen
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
  if (Object.keys(response).length === 0 || !hoveredWord) {
    return null;
  }

  return (
    <>
      <div
        style={{ top: `${positionY}px`, left: `${positionX}px` }}
        ref={popupRef}
        className="bg-light-green absolute max-h-96 w-400 p-4 rounded-6"
      >
        <div>
          <div className={styles.tabs}>
            {Object.keys(response).map((entry, index) => (
              <TabButton
                title={entry}
                key={entry}
                onClick={() => setActiveTabIndex(index)}
                isActive={index === activeTabIndex}
              />
            ))}
          </div>
          {Object.values(response).map((entries, index) => {
            return (
              <>
                <TTSButton
                  headword={entries[0].dictEntry.headword}
                  isVisible={index === activeTabIndex}
                />
                {entries.map((entry) => (
                  <DictionaryEntryContent
                    {...entry.dictEntry}
                    isVisible={index === activeTabIndex}
                    key={entry.dictEntry.sequence_number + " " + index}
                    entry={entry}
                    hoveredElement={hoveredElement}
                  >
                    <>
                      <AddToAnkiButton
                        hoveredWord={hoveredWord}
                        hoveredSentence={hoveredSentence}
                        wordStatus={entry.status.status ?? "unknown"}
                        {...entry.dictEntry}
                      />
                    </>
                  </DictionaryEntryContent>
                ))}
              </>
            );
          })}
        </div>
      </div>
    </>
  );
}

interface DictionaryEntryContentProps extends KrDictEntryDTO {
  isVisible: boolean;
  entry: LookupDTO;
  hoveredElement?: HTMLElement;
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
  entry,
  hoveredElement,
  children,
}: DictionaryEntryContentProps) {
  const getStyle = () => {
    if (!isVisible) {
      return { display: "none" };
    }
  };

  return (
    <div style={getStyle()}>
      {children}
      {[...Array(stars)].map((_, i) => (
        <React.Fragment key={i}>★</React.Fragment>
      ))}
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
      <DefinitionList definitions={tl_definitions} entry={entry} hoveredElement={hoveredElement} />
    </div>
  );
}

function TabButton(props: {
  title: string;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <button
      onClick={props.onClick}
      className={`${props.isActive ? "bg-green" : "bg-light-green-30"
        } text-white px-1.5 py-0.5 mr-2 rounded-6 text-2xl`}
    >
      {props.title}
    </button>
  );
}

function DefinitionList(props: {
  definitions: Array<{ translation: string; definition: string }>;
  hoveredElement: HTMLElement;
  entry: LookupDTO;
}) {

  const [isOpen, setIsOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const listStyle = props.definitions.length > 1 ? "list-decimal" : "list-none";

  useEffect(() => {
    if (!detailsRef.current) {
      return
    }
    setIsOpen(!isOpen);
  }, [detailsRef.current])

  if (props.definitions.length === 0) {
    return null;
  }


  return (
    <div className="flex flex-row justify-start bg-light-green-30 max-h-52 overflow-y-auto rounded-6 p-2 text-dark-green">
      <Arrow isOpen={isOpen} setIsOpen={setIsOpen} detailsRef={detailsRef} />
      <details lang="jp" className={`w-full ${props.definitions.length > 1 ? "ml-5" : "ml-0"}`} ref={detailsRef}>
        {/* Maybe have nowrap for summary line while it is closed*/}
        <summary className="flex flex-row justify-between cursor-pointer">
          <ol className={listStyle} onClick={() => setIsOpen(!isOpen)}>
            <b><li>{props.definitions[0].translation}</li></b>
          </ol>
          <StatusButtons
            entry={props.entry}
            hoveredElement={props.hoveredElement}
          />
        </summary>

        <p>
          {props.definitions[0].definition}
        </p>
        <ol start={2} className={listStyle}>
          {props.definitions.slice(1).map((element, index) => {
            return (
              <React.Fragment key={index}>
                <b><li>{element.translation}</li></b>
                {element.definition}
              </React.Fragment>
            );
          })}
        </ol>
      </details>
    </div>
  );
}

interface ArrowProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  detailsRef: React.RefObject<HTMLDetailsElement>;
}

const Arrow = ({ isOpen, detailsRef, setIsOpen }: ArrowProps) => {
  const arrow =  isOpen ? "▼" : "▶";
  const toggleOpen = () => {
    if (detailsRef.current) {
      detailsRef.current.open = !detailsRef.current.open;
      setIsOpen(!isOpen);
    }
  }
  return <div className="px-2 cursor-pointer" onClick={toggleOpen}>{arrow}</div>
};