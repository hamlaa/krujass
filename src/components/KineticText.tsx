import { useMemo, type ElementType } from 'react';
import { splitWords } from '../animations/motionPresets';

/** Renders text as masked word spans so it can rise in word-by-word. */
export function KineticText({ text, as: Tag = 'span', className = '', at }: { text: string; as?: ElementType; className?: string; at?: number }) {
  const words = useMemo(() => splitWords(text), [text]);
  return (
    <Tag className={`kt ${className}`} data-enter="words" data-at={at} aria-label={text}>
      {words.map((w, i) =>
        /^\s+$/.test(w) ? (
          <span key={i} aria-hidden="true">{' '}</span>
        ) : (
          <span key={i} className="w" aria-hidden="true">
            <span>{w}</span>
          </span>
        ),
      )}
    </Tag>
  );
}
