import { useEffect, useRef, useState, useCallback } from 'react';

export const useRefWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();

  const setRef = useCallback((e: HTMLDivElement) => {
    const newWidth = e?.clientWidth;
    newWidth && ref.current?.clientWidth !== newWidth && setWidth(e.clientWidth);
    ref.current = e;
  }, []);

  useEffect(() => {
    const handleResize = () => setWidth(ref.current?.clientWidth);
    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebar_toggle', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebar_toggle', handleResize);
    };
  }, []);

  const clientWidth = ref.current?.clientWidth;

  useEffect(() => {
    width !== clientWidth && setWidth(clientWidth);
  }, [clientWidth, width]);

  return [setRef, width] as [React.Ref<HTMLDivElement>, number];
};
