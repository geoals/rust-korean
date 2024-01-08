import React, { type ReactNode } from "react";

// TODO move style to css file and remove this component
export function WordDefinitionPopup({
  positionX,
  positionY,
  children,
}: {
  positionX: number;
  positionY: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: `${positionY + 16}` + "px",
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
      {children}
    </div>
  );
}
