import * as React from 'react';
import InteractiveSpotlight from './InteractiveSpotlight';
import StaticSpotlight from './StaticSpotlight';

type SpotlightProps = {
  selector: string;
  interactive?: boolean;
};

const Spotlight: React.FC<SpotlightProps> = ({ selector, interactive }) => {
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
