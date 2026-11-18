import { useEffect } from 'react';

const setPopupVisibility = (v: 'visible' | 'hidden') => {
  const popup = document.getElementsByClassName('plugin-vsphere-status-popup');
  const style = (popup?.[0] as any)?.style;
  style && (style.visibility = v);
};

export const usePopupVisibility = () => {
  useEffect(
    // Hack to stick with the Health status popup
    () => {
      setPopupVisibility('hidden');
      return () => {
        setPopupVisibility('visible');
      };
    },
    [/* just once */],
  );
};
