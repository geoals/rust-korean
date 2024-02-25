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
      className={`${isIgnored ? "fill-muted" : "hover:fill-muted"} hover:scale-105`}
      onClick={() => setIsIgnored(!isIgnored)}
    >
      <IgnoreIcon className="duration-0" />
    </button>
  );
}
