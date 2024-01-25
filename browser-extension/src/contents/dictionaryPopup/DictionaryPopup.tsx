import React, { useLayoutEffect } from "react";
import { useWordUnderCursor } from "./useWordUnderCursor";
import { AddToAnkiButton } from "./AddToAnkiButton";
import { StatusButtons } from "./StatusButtons";
import styles from "./style.module.css";
import type { KrDictEntryDTO } from "~background/messages/lookup";
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
        style={{ top: `${positionY}px`, left: `${positionX}px`}}
        ref={popupRef}
        className="bg-light-green absolute max-h-96 w-400 p-4"
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
                  >
                    <>
                      <AddToAnkiButton
                        hoveredWord={hoveredWord}
                        hoveredSentence={hoveredSentence}
                        wordStatus={entry.status.status ?? "unknown"}
                        {...entry.dictEntry}
                      />
                      <StatusButtons
                        entry={entry}
                        hoveredElement={hoveredElement}
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
      <DefinitionList definitions={tl_definitions} />
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
      className={`${
        props.isActive ? "bg-green" : "bg-light-green-30"
      } text-white px-1.5 py-0.5 mr-2 rounded-6 text-2xl`}
    >
      {props.title}
    </button>
  );
}

function DefinitionList(props: {
  definitions: Array<{ translation: string; definition: string }>;
}) {

  const className = "bg-light-green-30 max-h-52 overflow-y-auto rounded-6 p-2 text-dark-green";
  if (props.definitions.length === 0) {
    return null;
  }

  if (props.definitions.length === 1) {
    return (
      // TODO change language according to settings
      <details lang="jp" className={className}>
        <summary className={styles.definitionListSummary}>
          <b>{props.definitions[0].translation}</b>
        </summary>
        <p>{props.definitions[0].definition}</p>
      </details>
    );
  }

  return (
    <details lang="jp" className={className}>
      {/* Maybe have nowrap for summary line while it is closed*/}
      <summary>
        <ol
          style={{
            paddingInlineStart: "2ch",
            marginTop: "-22px",
            marginBottom: "0",
          }}
        >
          <b><li>{props.definitions[0].translation}</li></b>
        </ol>
      </summary>

      <p style={{ margin: "0", paddingLeft: "4ch" }}>
        {props.definitions[0].definition}
      </p>
      <ol start={2} style={{ marginTop: "0", paddingInlineStart: "4ch" }}>
        {props.definitions.slice(1).map((element, index) => {
          return (
            <React.Fragment key={index}>
              <b><li style={{ paddingTop: "8px" }}>{element.translation}</li></b>
              {element.definition}
            </React.Fragment>
          );
        })}
      </ol>
    </details>
  );
}
