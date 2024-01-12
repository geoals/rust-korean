import React, { forwardRef, type ReactNode } from "react";

export const POPUP_WIDTH = 400;

// TODO move style to css file and remove this component
export const WordDefinitionPopup = forwardRef(({ positionX, positionY, children }: {
  positionX: number;
  positionY: number;
  ref: React.RefObject<HTMLDivElement>;
  children: ReactNode;
}, ref) => {
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: `${positionY}` + "px",
        left: `${positionX}` + "px",
        color: "black",
        backgroundColor: "white",
        padding: "8px",
        border: "solid black 2px",
        width: `${POPUP_WIDTH}px`,
        maxHeight: "300px",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {children}
    </div>
  );
});
