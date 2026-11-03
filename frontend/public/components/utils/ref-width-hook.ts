import { useEffect, useLayoutEffect, useState } from 'react';

export const useRefWidth = () => {
  // The measured element is tracked as state (populated by a callback ref
  // during commit) so no ref is read during render.
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>();

  // Width of the committed element, re-read on every render so silent layout
  // changes (ones that fire no resize event) are still picked up.
  const clientWidth = element?.clientWidth;

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks-js/set-state-in-effect -- width is a DOM measurement (clientWidth) that only exists after the element is committed; this measurement feedback loop is the hook's whole purpose, and the layout effect keeps it pre-paint so consumers never render at a stale width
    width !== clientWidth && setWidth(clientWidth);
  }, [clientWidth, width]);

  useEffect(() => {
    const handleResize = () => setWidth(element?.clientWidth);
    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebar_toggle', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebar_toggle', handleResize);
    };
  }, [element]);

  return [setElement, width] as [React.Ref<HTMLDivElement>, number];
};
