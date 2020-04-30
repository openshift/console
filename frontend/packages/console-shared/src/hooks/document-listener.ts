import * as React from 'react';
import { isModalOpen } from '@console/internal/components/modals';

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
    // Don't steal focus from a modal open on top of the page.
    if (isModalOpen()) {
      return;
    }
    const { nodeName } = e.target;
    switch (keyEventMap[e.key]) {
      case KeyEventModes.HIDE:
        setVisible(false);
        ref.current.blur();
        break;
      case KeyEventModes.FOCUS:
        if (
          document.activeElement !== ref.current &&
          // Don't steal focus if the user types the focus shortcut in another text input.
          nodeName !== 'INPUT' &&
          nodeName !== 'TEXTAREA'
        ) {
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
