import * as React from 'react';
import { ConnectionFormContextProvider } from './ConnectionFormContext';
import { VSphereConnectionProps } from './types';
import { VSphereConnectionModal } from './VSphereConnectionModal';

const setPopupVisibility = (v: 'visible' | 'hidden') => {
  const popup = document.getElementsByClassName('plugin-vsphere-status-popup');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const style = (popup?.[0] as any)?.style;
  style && (style.visibility = v);
};

export const VSphereConnection: React.FC<VSphereConnectionProps> = (props) => {
  React.useEffect(
    // Hack to stick with the Health status popup
    () => {
      setPopupVisibility('hidden');
      return () => {
        setPopupVisibility('visible');
      };
    },
    [
      /* just once */
    ],
  );

  return (
    <ConnectionFormContextProvider>
      <VSphereConnectionModal {...props} />
    </ConnectionFormContextProvider>
  );
};
