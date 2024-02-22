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
    : `Top 〜${numberOfStars.upperFrequency} most common word 乗用`;

  const titleText = numberOfStars.upperFrequency === undefined
    ? "Very uncommon"
    : `Top 〜${numberOfStars.upperFrequency} frequent word`;

  return (
    <div className="flex" title={titleText}>
      <div className="mr-2">{frequencyText}</div>
      {/* {[...Array(numberOfStars?.numberOfBlack)].map((_, i) => <span className="text-dark-green">◼</span>)} */}
      {/* {[...Array(numberOfStars?.numberOfWhite)].map((_, i) => <span className="text-light-green-30">◼</span>)} */}
    </div>
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
