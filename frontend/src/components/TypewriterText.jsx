import React, { useState, useEffect, useRef } from 'react';

/**
 * TypewriterText Component
 * Renders AI-generated story with a smooth typewriter character reveal effect.
 * Strictly guarantees the animation runs EXACTLY ONCE per summary text string
 * and never restarts on re-renders, scrolling, or parent state updates.
 */
export default function TypewriterText({ text = '', speed = 16, onComplete }) {
  const completedRef = useRef(false);
  const textRef = useRef(text);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [displayedText, setDisplayedText] = useState(() => {
    return completedRef.current ? text : '';
  });
  const [isDone, setIsDone] = useState(completedRef.current);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsDone(false);
      completedRef.current = false;
      return;
    }

    // Reset completion flag only if text content changes to a brand new string
    if (textRef.current !== text) {
      textRef.current = text;
      completedRef.current = false;
    }

    // If this text string has already finished typing once, preserve full text immediately
    if (completedRef.current) {
      setDisplayedText(text);
      setIsDone(true);
      return;
    }

    setDisplayedText('');
    setIsDone(false);

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      setDisplayedText(text.slice(0, currentIndex));

      if (currentIndex >= text.length) {
        clearInterval(interval);
        completedRef.current = true;
        setIsDone(true);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className="typewriter-container">
      {displayedText}
      {!isDone && <span className="typewriter-cursor" aria-hidden="true">▍</span>}
    </span>
  );
}
