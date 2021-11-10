import * as React from 'react';

export const useIsVisible = (ref) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [wasEverVisible, setWasEverVisible] = React.useState(false);

  const callback = ([entry]) => {
    setIsVisible(entry.isIntersecting);
    if (entry.isIntersecting) {
      setWasEverVisible(true);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const observer = new IntersectionObserver(callback);

  React.useEffect(() => {
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [observer, ref]);

  return [isVisible, wasEverVisible];
};
