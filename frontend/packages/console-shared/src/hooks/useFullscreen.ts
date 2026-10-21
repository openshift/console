import type { RefObject } from 'react';
import { useRef, useState, useCallback } from 'react';
import { useEventListener } from '@console/shared/src/hooks/useEventListener';

/**
 * Hook to determine if the browser is currently in fullscreen mode.
 */
export const useIsFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEventListener(document, 'fullscreenchange', () =>
    setIsFullscreen(!!document.fullscreenElement),
  );

  return isFullscreen;
};

/**
 * Returns a tuple containing a ref to the element that will be toggled to fullscreen,
 * a function to toggle fullscreen mode, a boolean indicating if the element is currently in fullscreen,
 * and a boolean indicating if the browser supports fullscreen mode.
 *
 * Adapted from https://www.timsanteford.com/posts/creating-a-reusable-fullscreen-hook-in-react/
 */
export const useFullscreen = <T extends HTMLElement = HTMLDivElement>() => {
  /** The element that will be toggled to fullscreen */
  const fullscreenRef = useRef<T>(null);
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
    RefObject<T>,
    () => void,
    boolean,
    boolean,
  ];
};
