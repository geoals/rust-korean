import React, { useLayoutEffect } from "react";
import { useWordUnderCursor } from "./useWordUnderCursor";
import { StatusButtons } from "./StatusButtons";
import type { LookupDTO } from "~background/messages/lookup";
import { TTSButton } from "./TTSButton";
import IgnoreIcon from "react:../../../assets/ignore.svg";
import ExportIcon from "react:~/../assets/export.svg";
import AlreadyExportedIcon from "react:~/../assets/already_exported.svg";
import { FrequencyText } from "./FrequencyText";

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
  if (Object.keys(response).length === 0 || !hoveredWord || !hoveredElement) {
    return null;
  }

  const ankiExported = false;

  return (
    <>
      <div
        style={{ top: `${positionY}px`, left: `${positionX}px` }}
        ref={popupRef}
        className="bg-light-green absolute max-h-112 w-112 p-4 rounded-6 duration-100"
        lang="ja"
      >
        <div className="flex justify-between">
          <div>
            {Object.values(response).map((entries, index) => (
              <TabButton
                title={entries[0].dictEntry.headword}
                reading={entries[0].dictEntry.reading}
                key={entries[0].dictEntry.headword}
                onClick={() => setActiveTabIndex(index)}
                isActive={index === activeTabIndex}
              />
            ))}
          </div>
          <div className="fill-dark-green flex items-center space-x-1 duration-100">
            <button className="hover:fill-light-green-60 hover:scale-105">
              <IgnoreIcon />
            </button>
            <TTSButton headword={Object.keys(response)[activeTabIndex]} />
            {ankiExported ? (
              <button className="fill-light-green-60 hover:scale-105">
                <AlreadyExportedIcon />
              </button>
            ) : (
              <button className="hover:fill-light-green-60 hover:scale-105">
                <ExportIcon />
              </button>
            )}
          </div>
        </div>
        {Object.values(response).map((entries, index) => {
          return (
            <DefinitionListList
              isVisible={index === activeTabIndex}
              hoveredWord={Object.keys(response)[activeTabIndex]}
              entries={entries}
              hoveredElement={hoveredElement}
            />
          );
        })}
      </div>
    </>
  );
}

function TabButton(props: {
  title: string;
  reading: string | null;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <button
      lang="ko"
      onClick={props.onClick}
      className={`${
        props.isActive
          ? "bg-green cursor-default"
          : "bg-light-green-30 cursor-pointer hover:bg-light-green-60 hover:scale-105"
      } text-white px-1.5 py-0.5 mr-2 rounded-6 text-2xl duration-100`}
    >
      {props.title}
      {props.isActive && props.reading !== null && (
        <span className="text-light-green-60 ml-1">{props.reading}</span>
      )}
    </button>
  );
}

function DefinitionListList({
  isVisible,
  hoveredWord,
  entries,
  hoveredElement,
}: {
  isVisible: boolean;
  hoveredWord: string;
  entries: LookupDTO[];
  hoveredElement: HTMLElement;
}) {
  if (!isVisible) {
    return null;
  }

  const ignoredClicked = false;

  return (
    <>
      <div className="flex justify-between my-2">
        <div>
          {ignoredClicked && (
            <div className="text-nowrap">
              <span className="text-dark-green font-extrabold">{hoveredWord}</span>
              <span className="text-white bg-light-green-30 px-1.5 py-0.5 rounded-6 ml-1">
                学習しない
              </span>
            </div>
          )}
        </div>
        <FrequencyText frequency={entries[0].dictEntry.frequency} />
      </div>

      <div className="space-y-3 max-h-94 overflow-y-auto overscroll-y-contain">
        {entries.map((entry) => (
          <DefinitionList
            entry={entry}
            hoveredElement={hoveredElement}
            key={entry.dictEntry.sequence_number}
          />
        ))}
      </div>
    </>
  );
}

function DefinitionList(props: { hoveredElement: HTMLElement; entry: LookupDTO }) {
  const definitions = props.entry.dictEntry.tl_definitions;
  if (definitions.length === 0) {
    return null;
  }

  const listStyle = definitions.length > 1 ? "list-decimal" : "list-none";
  const leftMargin = definitions.length > 1 ? "ml-9" : "ml-4";

  // TODO add margin between scroll bars only when content is overflowing (have to use JS)
  return (
    // TODO only one can be expanded at the time
    <details className="bg-light-green-30 rounded-6 text-dark-green max-h-52 overflow-y-auto">
      <summary className="cursor-pointer p-2 hover:bg-medium-green rounded-6 duration-100 has-[button:hover]:hover:bg-transparent">
        <div className={`flex flex-row justify-between -mt-6`}>
          <ol className={`${listStyle} ${leftMargin} font-bold`}>
            <li>
              {definitions[0].translation}
              <span className="text-light-green-60 select-none">{props.entry.dictEntry.hanja}</span>
            </li>
          </ol>
          <StatusButtons entry={props.entry} hoveredElement={props.hoveredElement} />
        </div>
      </summary>

      <div className={`${leftMargin} px-2 pb-2`}>
        <p>{definitions[0].definition}</p>
        <ol start={2} className={listStyle}>
          {definitions.slice(1).map((element, index) => {
            return (
              <React.Fragment key={index}>
                <b>
                  <li>{element.translation}</li>
                </b>
                {element.definition}
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </details>
  );
}
