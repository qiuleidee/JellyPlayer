import { useState, useEffect } from 'react';

export function useMouseIdle(timeoutMs = 3000) {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const reset = () => {
      setIsIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsIdle(true), timeoutMs);
    };

    document.addEventListener('mousemove', reset);
    document.addEventListener('mousedown', reset);
    document.addEventListener('keydown', reset);
    document.addEventListener('touchstart', reset);

    timeout = setTimeout(() => setIsIdle(true), timeoutMs);

    return () => {
      document.removeEventListener('mousemove', reset);
      document.removeEventListener('mousedown', reset);
      document.removeEventListener('keydown', reset);
      document.removeEventListener('touchstart', reset);
      clearTimeout(timeout);
    };
  }, [timeoutMs]);

  return isIdle;
}
