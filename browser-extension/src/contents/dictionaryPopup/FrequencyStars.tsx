import React from "react";

export function FrequencyStars(props: { frequency: number | null; }) {
  const numberOfStars = getNumberOfStars(props.frequency);

  return (
    <div>
      {[...Array(numberOfStars?.numberOfBlack)].map((_, i) => <span className="text-dark-green">★</span>)}
      {[...Array(numberOfStars?.numberOfWhite)].map((_, i) => <span className="text-light-green-30">★</span>)}
    </div>
  );
}

const getNumberOfStars = (frequency: number | null) => {
  if (frequency === null || frequency >= 20000) {
    return {
      numberOfBlack: 0,
      numberOfWhite: 5,
    };
  }
  if (frequency < 1000) {
    return {
      numberOfBlack: 5,
      numberOfWhite: 0,
    };
  }
  if (frequency < 3000) {
    return {
      numberOfBlack: 4,
      numberOfWhite: 1
    };
  }
  if (frequency < 5000) {
    return {
      numberOfBlack: 3,
      numberOfWhite: 2
    };
  }
  if (frequency < 10000) {
    return {
      numberOfBlack: 2,
      numberOfWhite: 3
    };
  }
  if (frequency < 20000) {
    return {
      numberOfBlack: 1,
      numberOfWhite: 4
    };
  }
};
