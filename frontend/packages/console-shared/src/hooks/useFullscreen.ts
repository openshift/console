import { useRef, useState, useEffect, useCallback, RefObject } from 'react';

/**
 * Returns a tuple containing a ref to the element that will be toggled to fullscreen,
 * a function to toggle fullscreen mode, a boolean indicating if the element is currently in fullscreen,
 * and a boolean indicating if the browser supports fullscreen mode.
 *
 * Adapted from https://www.timsanteford.com/posts/creating-a-reusable-fullscreen-hook-in-react/
 */
export const useFullscreen = () => {
  /** The element that will be toggled to fullscreen */
  const fullscreenRef = useRef<HTMLDivElement>(null);
  /** Whether the browser supports fullscreen mode */
  const canUseFullScreen = document.fullscreenEnabled;

  const [isFullscreen, setIsFullscreen] = useState(false);

  /** Toggle currently displayed content to/from fullscreen */
  const toggleFullscreen = useCallback(() => {
    if (fullscreenRef.current) {
      if (!document.fullscreenElement) {
        fullscreenRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return [fullscreenRef, toggleFullscreen, isFullscreen, canUseFullScreen] as [
    RefObject<HTMLDivElement>,
    () => void,
    boolean,
    boolean,
  ];
};
