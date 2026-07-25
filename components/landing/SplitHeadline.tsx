import React from 'react';

interface SplitHeadlineProps {
  text: string;
  /** ms before the first glyph moves. */
  delay?: number;
  /** ms between consecutive glyphs. */
  stagger?: number;
  className?: string;
}

/**
 * Splits a word into per-glyph slots that rise out of an overflow-hidden mask, so the
 * headline is *uncovered* rather than faded in — the difference between "an animation
 * played" and "the type arrived".
 *
 * Stays a server component: the stagger is expressed purely as inline animation-delay,
 * so there is no hydration cost and no JS on the critical path. The whole word is
 * exposed to assistive tech as one string; the glyph spans are hidden from it.
 */
export default function SplitHeadline({
  text,
  delay = 0,
  stagger = 34,
  className = '',
}: SplitHeadlineProps) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split('').map((char, index) => (
          <span key={`${char}-${index}`} className="char-slot">
            <span
              className="char-rise"
              style={{ animationDelay: `${delay + index * stagger}ms` }}
            >
              {char === ' ' ? ' ' : char}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
