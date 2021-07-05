import * as React from 'react';
import { useResizeObserver } from './useResizeObserver';

export enum Shadows {
  none = 'none',
  both = 'both',
  top = 'top',
  bottom = 'bottom',
}

export const useScrollShadows = (node: HTMLElement): Shadows => {
  const [shadows, setShadows] = React.useState(Shadows.none);
  const computeShadows = React.useCallback(() => {
    if (node) {
      const { scrollTop, clientHeight, scrollHeight } = node;
      const top = scrollTop !== 0;
      const bottom = scrollTop + clientHeight < scrollHeight;
      if (top && bottom) {
        setShadows(Shadows.both);
      } else if (top) {
        setShadows(Shadows.top);
      } else if (bottom) {
        setShadows(Shadows.bottom);
      } else {
        setShadows(Shadows.none);
      }
    }
  }, [node]);
  // recompute when the scroll container changes in size
  useResizeObserver(computeShadows, node);
  React.useEffect(() => {
    if (node) {
      // compute initial shadows
      computeShadows();
      // listen for scroll events
      node.addEventListener('scroll', computeShadows);
    }
    return () => {
      if (node) {
        node.removeEventListener('scroll', computeShadows);
      }
    };
  }, [node, computeShadows]);
  return shadows;
};
