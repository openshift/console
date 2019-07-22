import { useEffect, useRef, useState } from 'react';

export const useRefWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const clientWidth = ref && ref.current && ref.current.clientWidth;

  useEffect(() => {
    const handleResize = () => setWidth(ref && ref.current && ref.current.clientWidth);
    window.addEventListener('resize', handleResize);
    window.addEventListener('nav_toggle', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('nav_toggle', handleResize);
    };
  }, []);

  useEffect(() => {
    setWidth(clientWidth);
  }, [clientWidth]);

  return [ref, width] as [React.MutableRefObject<HTMLDivElement>, number];
};
