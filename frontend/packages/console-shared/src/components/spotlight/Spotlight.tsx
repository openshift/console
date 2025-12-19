import type { FC } from 'react';
import { useEffect, useMemo } from 'react';
import InteractiveSpotlight from './InteractiveSpotlight';
import StaticSpotlight from './StaticSpotlight';

const simulateMouseClick = (element: Element) => {
  const mouseClickEvents = ['mousedown', 'click', 'mouseup'];
  mouseClickEvents.forEach((mouseEventType) =>
    element.dispatchEvent(
      new MouseEvent(mouseEventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1,
      }),
    ),
  );
};

type SpotlightProps = {
  expandableSelector?: string;
  selector: string;
  interactive?: boolean;
};

const Spotlight: FC<SpotlightProps> = ({ expandableSelector, selector, interactive }) => {
  useEffect(() => {
    if (expandableSelector) {
      const expandableElement = document.querySelector(expandableSelector);
      const ariaExpanded = expandableElement?.getAttribute('aria-expanded');
      if (ariaExpanded === 'false') {
        simulateMouseClick(expandableElement);
      }
    }
  }, [expandableSelector]);

  // if target element is a hidden one return null
  const element = useMemo(() => {
    const highlightElement = document.querySelector(selector);
    let hiddenElement = highlightElement;
    while (hiddenElement && interactive) {
      const ariaHidden = hiddenElement.getAttribute('aria-hidden');
      if (ariaHidden === 'true') return null;
      hiddenElement = hiddenElement.parentElement;
    }
    return highlightElement;
  }, [selector, interactive]);

  if (!element) return null;
  return interactive ? (
    <InteractiveSpotlight element={element} />
  ) : (
    <StaticSpotlight element={element} />
  );
};

export default Spotlight;
