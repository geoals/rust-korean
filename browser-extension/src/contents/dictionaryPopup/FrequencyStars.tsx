import React from "react";

export function FrequencyStars(props: { frequency: number | null; }) {
  const numberOfStars = getNumberOfStars(props.frequency);

  if (!numberOfStars) {
    return null;
  }

  if (!numberOfStars.upperFrequency) {
    return null
  }

  const frequencyText = numberOfStars.upperFrequency === undefined 
    ? "Very uncommon word" 
    : `上位約${numberOfStars.upperFrequency}のよく使われる単語`;

  return (
      <div className="mr-2 font-sans text-dark-green text-xs mt-auto">{frequencyText}</div>
  );
}

const getNumberOfStars = (frequency: number | null) => {
  if (frequency === null) {
    return;
  }

  if (frequency >= 20000) {
    return {
      numberOfBlack: 0,
      numberOfWhite: 5,
    };
  }
  if (frequency < 1000) {
    return {
      numberOfBlack: 5,
      numberOfWhite: 0,
      upperFrequency: 1000,
    };
  }
  if (frequency < 3000) {
    return {
      numberOfBlack: 4,
      numberOfWhite: 1,
      upperFrequency: 3000,
    };
  }
  if (frequency < 5000) {
    return {
      numberOfBlack: 3,
      numberOfWhite: 2,
      upperFrequency: 5000,
    };
  }
  if (frequency < 10000) {
    return {
      numberOfBlack: 2,
      numberOfWhite: 3,
      upperFrequency: 10000,
    };
  }
  if (frequency < 20000) {
    return {
      numberOfBlack: 1,
      numberOfWhite: 4,
      upperFrequency: 20000,
    };
  }
};
