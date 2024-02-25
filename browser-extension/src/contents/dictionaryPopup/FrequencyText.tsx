import React from "react";

export function FrequencyText({ frequency }: { frequency: number | null }) {
  if (!frequency) {
    return null;
  }

  const roundedFrequency =
    frequency < 20000 ? roundToNearest500(frequency) : roundToNearest1000(frequency);

  return (
    <div className="text-xs">
      上位約{roundedFrequency > 500 ? roundedFrequency : frequency}のよく使われる単語
    </div>
  );
}

function roundToNearest500(number: number) {
  return Math.round(number / 500) * 500;
}

function roundToNearest1000(number: number) {
  return Math.round(number / 1000) * 1000;
}
