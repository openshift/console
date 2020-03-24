import * as React from 'react';

/**
 * Use this hook for components that require visibility only
 * when the user is actively interacting with it.
 */

export const useHideComponent = () => {
  const [visible, setVisible] = React.useState(true);
  const ref = React.useRef(null);

  const handleEvent = (e) => {
    if (!ref?.current?.contains(e.target)) {
      setVisible(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener('click', handleEvent, true);
    return () => {
      document.removeEventListener('click', handleEvent, true);
    };
  });

  return { visible, setVisible, ref };
};
