import type { FC, CSSProperties } from 'react';
import { useState, useEffect, useCallback } from 'react';
import * as ReactDOM from 'react-dom';
import './spotlight.scss';

type InteractiveSpotlightProps = {
  element: Element;
};

const isInViewport = (elementToCheck: Element) => {
  const rect = elementToCheck.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

const InteractiveSpotlight: FC<InteractiveSpotlightProps> = ({ element }) => {
  const [rect, setRect] = useState(() => element.getBoundingClientRect());
  const [clicked, setClicked] = useState(false);

  const updateRect = useCallback(() => {
    setRect(element.getBoundingClientRect());
  }, [element]);

  useEffect(() => {
    if (clicked) return undefined;

    if (!isInViewport(element)) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }

    const handleClick = () => setClicked(true);
    document.addEventListener('click', handleClick);
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [element, clicked, updateRect]);

  if (clicked) return null;

  const style: CSSProperties = {
    position: 'fixed',
    top: rect.top,
    left: rect.left,
    height: rect.height,
    width: rect.width,
    zIndex: 9999,
    pointerEvents: 'none',
  };

  return ReactDOM.createPortal(
    <div className="ocs-spotlight ocs-spotlight__element-highlight-animate" style={style} />,
    document.body,
  );
};

export default InteractiveSpotlight;
