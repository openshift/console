import * as React from 'react';

const isHTMLElement = (n: Node): n is HTMLElement => {
  return n.nodeType === Node.ELEMENT_NODE;
};

export const getParentScrollableElement = (node: HTMLElement) => {
  let parentNode: Node = node;
  while (parentNode) {
    if (isHTMLElement(parentNode)) {
      let overflow = parentNode.style.overflow;
      if (!overflow.includes('scroll') && !overflow.includes('auto')) {
        overflow = window.getComputedStyle(parentNode).overflow;
      }
      if (overflow.includes('scroll') || overflow.includes('auto')) {
        return parentNode;
      }
    }
    parentNode = parentNode.parentNode;
  }
  return undefined;
};

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
