import { useEffect, useRef, useState } from 'react';

export const useRefWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const clientWidth = ref?.current?.clientWidth ?? 0;

  useEffect(() => {
    const handleResize = () => setWidth(ref?.current?.clientWidth ?? 0);
    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebar_toggle', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebar_toggle', handleResize);
    };
  }, []);

  useEffect(() => {
    setWidth(clientWidth);
  }, [clientWidth]);

  return [ref, width] as [React.MutableRefObject<HTMLDivElement>, number];
};
