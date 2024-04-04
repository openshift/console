import * as React from 'react';

const setPopupVisibility = (v: 'visible' | 'hidden') => {
  const popup = document.getElementsByClassName('plugin-vsphere-status-popup');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const style = (popup?.[0] as any)?.style;
  style && (style.visibility = v);
};

export const usePopupVisibility = () => {
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
};
