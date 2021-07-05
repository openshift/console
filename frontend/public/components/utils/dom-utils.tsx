import * as React from 'react';
import { getParentScrollableElement } from '@console/dynamic-plugin-sdk/src/shared/hooks/useScrollContainer';

type WithScrollContainerProps = {
  children: (scrollContainer: HTMLElement) => React.ReactElement | null;
};

export const WithScrollContainer: React.FC<WithScrollContainerProps> = ({ children }) => {
  const [scrollContainer, setScrollContainer] = React.useState<HTMLElement>();
  const ref = React.useCallback((node) => {
    if (node) {
      setScrollContainer(getParentScrollableElement(node));
    }
  }, []);
  return scrollContainer ? children(scrollContainer) : <span ref={ref} />;
};
