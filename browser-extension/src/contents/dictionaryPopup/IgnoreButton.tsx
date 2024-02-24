import React from "react";
import IgnoreIcon from "react:../../../assets/ignore.svg";

export function IgnoreButton({
  isIgnored,
  setIsIgnored,
}: {
  isIgnored: boolean;
  setIsIgnored: (value: boolean) => void;
}) {
  return (
    <button
      className={`${isIgnored ? "fill-light-green-60" : "hover:fill-light-green-60"} hover:scale-105`}
      onClick={() => setIsIgnored(!isIgnored)}
    >
      <IgnoreIcon />
    </button>
  );
}
