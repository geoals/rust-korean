import React, { useLayoutEffect, useState, type ReactNode, useEffect } from "react";
import { useWordUnderCursor } from "./useWordUnderCursor";
import { StatusButtons } from "./StatusButtons";
import type { LookupDTO } from "~background/messages/lookup";
import { TTSButton } from "./TTSButton";
import { FrequencyText } from "./FrequencyText";
import { AddToAnkiButton } from "./AddToAnkiButton";
import { IgnoreButton } from "./IgnoreButton";
import { useStorage } from "@plasmohq/storage/hook";

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
  const [isIgnored, setIsIgnored] = useState(false);
  const [selectedEntryIndexForAnkiExport, setSelectedEntryIndexForAnkiExport] = useState<
    number | undefined
  >(undefined);
  const entriesOfActiveTab = Object.values(response)[activeTabIndex];
  const { openCloseStates, updateOpenCloseState } = useOpenCloseStates(entriesOfActiveTab);
  const [language] = useStorage("language");

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
    setSelectedEntryIndexForAnkiExport(undefined);
  }

  // TODO: loading
  if (Object.keys(response).length === 0 || !hoveredWord || !hoveredElement) {
    return null;
  }

  const entryForAnkiExport =
    selectedEntryIndexForAnkiExport === undefined
      ? undefined
      : Object.values(response)[activeTabIndex][selectedEntryIndexForAnkiExport];

  return (
    <>
      <div
        style={{ top: `${positionY}px`, left: `${positionX}px` }}
        ref={popupRef}
        className="bg-background absolute max-h-112 w-104 p-4 rounded"
        lang="ja"
      >
        <div className="flex justify-between">
          <div className="space-x-1">
            {Object.values(response).map((entries, index) => (
              <TabButton
                title={entries[0].dictEntry.headword}
                reading={entries[0].dictEntry.reading}
                key={entries[0].dictEntry.headword}
                onClick={() => {
                  setActiveTabIndex(index);
                  setSelectedEntryIndexForAnkiExport(undefined);
                }}
                isActive={index === activeTabIndex}
              />
            ))}
          </div>
          <div className="fill-foreground flex items-center space-x-1">
            <IgnoreButton isIgnored={isIgnored} setIsIgnored={setIsIgnored} />
            <TTSButton headword={Object.keys(response)[activeTabIndex]} />
            <AddToAnkiButton
              hoveredWord={hoveredWord}
              hoveredSentence={hoveredSentence ?? ""}
              entry={entryForAnkiExport}
            />
          </div>
        </div>
        <EntriesList
          hoveredWord={hoveredWord}
          frequency={entriesOfActiveTab[0].dictEntry.frequency}
          isIgnored={isIgnored}
        >
          {entriesOfActiveTab.map((entry, index) => (
            <DefinitionList
              entry={entry}
              hoveredElement={hoveredElement}
              key={entry.dictEntry.sequence_number}
              setSelectedEntryForAnkiExport={() => setSelectedEntryIndexForAnkiExport(index)}
              isSelectedForAnkiExport={selectedEntryIndexForAnkiExport === index}
              isOpen={openCloseStates[index]}
              toggle={() => updateOpenCloseState(index)}
            />
          ))}
        </EntriesList>
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
          ? "bg-accent cursor-default"
          : "bg-primary cursor-pointer hover:bg-muted hover:scale-105"
      } text-white px-1.5 py-0.5 rounded text-2xl`}
    >
      {props.title}
      {props.isActive && props.reading !== null && (
        <span className="ml-1 text-muted">{props.reading}</span>
      )}
    </button>
  );
}

function EntriesList({
  hoveredWord,
  frequency,
  isIgnored,
  children,
}: {
  hoveredWord: string;
  frequency: number | null;
  isIgnored: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex justify-between my-1">
        <div>
          {isIgnored && (
            <div className="text-nowrap space-x-1 my-1">
              <span className="font-extrabold">{hoveredWord}</span>
              <span className="text-white text-sm bg-primary px-1.5 py-0.5 rounded">
                学習しない
              </span>
            </div>
          )}
        </div>
        <FrequencyText frequency={frequency} />
      </div>

      <div className="space-y-2 max-h-94 overflow-y-auto overscroll-y-contain">{children}</div>
    </>
  );
}

function DefinitionList(props: {
  hoveredElement: HTMLElement;
  entry: LookupDTO;
  setSelectedEntryForAnkiExport: () => void;
  isSelectedForAnkiExport: boolean;
  isOpen: boolean;
  toggle: () => void;
}) {
  const definitions = props.entry.dictEntry.tl_definitions;
  const hanja = props.entry.dictEntry.hanja;

  if (definitions.length === 0) {
    return null;
  }

  function clickHandler(e: React.MouseEvent<HTMLDetailsElement>) {
    e.preventDefault();
    props.setSelectedEntryForAnkiExport();
    props.toggle();
  }

  const listStyle = definitions.length > 1 ? "list-decimal" : "list-none";
  const leftMargin = definitions.length > 1 ? "ml-9" : "ml-4";

  // TODO: add margin between scroll bars only when content is overflowing (have to use JS)
  return (
    // TODO: only one can be expanded at the time
    <details
      className={`bg-primary rounded max-h-52 overflow-y-auto ${props.isSelectedForAnkiExport ? "border-solid border-b-4 border-muted" : ""}`}
      onClick={clickHandler}
      open={props.isOpen}
    >
      <summary className="cursor-pointer p-2 hover:bg-muted rounded has-[button:hover]:hover:bg-transparent">
        <div className={`flex flex-row justify-between -mt-6`}>
          <ol className={`${listStyle} ${leftMargin} font-bold`}>
            <li>
              {definitions[0].translation}
              <span className="text-muted select-none">{hanja}</span>
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
                <li className="font-bold">{element.translation}</li>
                {element.definition}
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </details>
  );
}

function useOpenCloseStates(entriesOfActiveTab?: LookupDTO[]) {
  const [openCloseStates, setOpenCloseStates] = useState<boolean[]>([]);

  const updateOpenCloseState = (index: number) => {
    const newArray = Array(openCloseStates.length).fill(false);
    newArray[index] = !openCloseStates[index];
    setOpenCloseStates(newArray);
  };

  useEffect(() => {
    if (entriesOfActiveTab) {
      setOpenCloseStates(Array(entriesOfActiveTab.length).fill(false));
    }
  }, [entriesOfActiveTab]);

  return {
    openCloseStates,
    updateOpenCloseState,
  };
}
