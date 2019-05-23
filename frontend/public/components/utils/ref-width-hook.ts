import { useEffect, useRef, useState } from 'react';

export const useRefWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
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
