import { useRef, useState, useEffect, useCallback, RefObject } from 'react';

/**
 * Hook to determine if the browser is currently in fullscreen mode.
 */
export const useIsFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return isFullscreen;
};

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
  /** Whether the currently displayed content is in fullscreen mode */
  const isFullscreen = useIsFullscreen();

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

  return [fullscreenRef, toggleFullscreen, isFullscreen, canUseFullScreen] as [
    RefObject<HTMLDivElement>,
    () => void,
    boolean,
    boolean,
  ];
};
