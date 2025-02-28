import * as React from 'react';
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

const Spotlight: React.FC<SpotlightProps> = ({ expandableSelector, selector, interactive }) => {
  React.useEffect(() => {
    if (expandableSelector) {
      const expandableElemet = document.querySelector(expandableSelector);
      const ariaExpanded = expandableElemet.getAttribute('aria-expanded');
      if (ariaExpanded === 'false') {
        simulateMouseClick(expandableElemet);
      }
    }
  }, [expandableSelector]);

  // if target element is a hidden one return null
  const element = React.useMemo(() => {
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
