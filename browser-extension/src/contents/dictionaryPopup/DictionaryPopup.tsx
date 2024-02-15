import React, { useLayoutEffect } from "react";
import { useWordUnderCursor } from "./useWordUnderCursor";
import { AddToAnkiButton } from "./AddToAnkiButton";
import { StatusButtons } from "./StatusButtons";
import type { KrDictEntryDTO, LookupDTO } from "~background/messages/lookup";
import { TTSButton } from "./TTSButton";
import IgnoreIcon from 'react:../../../assets/ignore.svg';

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
          <div className="flex justify-between">
            <div>
              {Object.keys(response).map((entry, index) => (
                <TabButton
                  title={entry}
                  key={entry}
                  onClick={() => setActiveTabIndex(index)}
                  isActive={index === activeTabIndex}
                />
              ))}
            </div>
            <div className="">
              {/* <button><img src="../assets/ignore.svg" /></button> */}
              <button><IgnoreIcon /></button>
              <button>B</button>
              <button>C</button>
            </div>
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
      <DefinitionList entry={entry} hoveredElement={hoveredElement} />
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
  hoveredElement: HTMLElement;
  entry: LookupDTO;
}) {
  const definitions = props.entry.dictEntry.tl_definitions;
  if (definitions.length === 0) {
    return null;
  }

  const listStyle = definitions.length > 1 ? "list-decimal" : "list-none";
  const leftMargin = definitions.length > 1 ? "ml-9" : "ml-4";

  return (
    <details lang="jp" className="bg-light-green-30 rounded-6 p-2 text-dark-green max-h-52 overflow-y-auto">
      <summary className="cursor-pointer">
        <div className={`flex flex-row justify-between -mt-6`}>
          <ol className={`${listStyle} ${leftMargin}`}>
            <li><b>{definitions[0].translation}</b></li>
          </ol>
          <StatusButtons
            entry={props.entry}
            hoveredElement={props.hoveredElement}
          />
        </div>
      </summary>

      <div className={leftMargin}>
        <p>{definitions[0].definition}</p>
        <ol start={2} className={listStyle}>
          {definitions.slice(1).map((element, index) => {
            return (
              <React.Fragment key={index}>
                <li><b>{element.translation}</b></li>
                {element.definition}
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </details>
  );
}