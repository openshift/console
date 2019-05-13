/* eslint-disable react-hooks/exhaustive-deps */
import * as React from 'react';
import { useSafetyFirst } from '../safety-first';

export const useRefWidth = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = useSafetyFirst(0);

  React.useEffect(() => {
    const handleResize = () => setWidth(ref.current.clientWidth);
    window.addEventListener('resize', handleResize);
    window.addEventListener('nav_toggle', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('nav_toggle', handleResize);
    };
  }, []);

  return [ref, width] as [React.Ref<HTMLDivElement>, number];
};
