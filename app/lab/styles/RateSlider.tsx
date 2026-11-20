'use client';

import { useState } from 'react';

type Props = {
  id: string;
  wrapClassName: string;
  sliderClassName: string;
  readoutClassName: string;
  unit: string;
  pad?: boolean;
};

// Same range and step as the real time control, so the mock-up feels like the thing it would replace.
export default function RateSlider({ id, wrapClassName, sliderClassName, readoutClassName, unit, pad }: Props) {
  const [rate, setRate] = useState(1);
  const text = pad ? rate.toFixed(1).padStart(4, '0') : rate.toFixed(1);

  return (
    <>
      <span className={wrapClassName}>
        <input
          id={id}
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className={sliderClassName}
        />
      </span>
      <output htmlFor={id} className={readoutClassName}>
        {text}
        {unit}
      </output>
    </>
  );
}
