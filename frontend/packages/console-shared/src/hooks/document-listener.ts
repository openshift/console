import * as React from 'react';

/**
 * Use this hook for components that require visibility only
 * when the user is actively interacting with the document.
 */

export enum KeyEventModes {
  HIDE = 'HIDE',
  FOCUS = 'FOCUS',
}

export const useDocumentListener = <T extends HTMLElement>(keyEventMap: KeyEventMap) => {
  const [visible, setVisible] = React.useState(true);
  const ref = React.useRef<T>(null);

  const handleEvent = (e) => {
    if (!ref?.current?.contains(e.target)) {
      setVisible(false);
    }
  };

  const handleKeyEvents = (e) => {
    switch (keyEventMap[e.key]) {
      case KeyEventModes.HIDE:
        setVisible(false);
        ref.current.blur();
        break;
      case KeyEventModes.FOCUS:
        if (document.activeElement !== ref.current) {
          ref.current.focus();
          e.preventDefault();
        }
        break;
      default:
        break;
    }
  };

  React.useEffect(() => {
    document.addEventListener('click', handleEvent, true);
    document.addEventListener('keydown', handleKeyEvents, true);
    return () => {
      document.removeEventListener('click', handleEvent, true);
      document.removeEventListener('keydown', handleKeyEvents, true);
    };
  });

  return { visible, setVisible, ref };
};

export type KeyEventMap = {
  [key: string]: KeyEventModes;
};
