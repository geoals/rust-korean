import React from "react";

export function FrequencyText({ frequency }: { frequency: number | null }) {
  if (!frequency) {
    return null;
  }

  const roundedFrequency =
    frequency < 20000 ? roundToNearest500(frequency) : roundToNearest1000(frequency);

  return (
    <div className="mr-2 font-sans text-dark-green text-xs mt-auto">
      上位約{roundedFrequency}のよく使われる単語
    </div>
  );
}

function roundToNearest500(number: number) {
  return Math.round(number / 500) * 500;
}

function roundToNearest1000(number: number) {
  return Math.round(number / 1000) * 1000;
}
