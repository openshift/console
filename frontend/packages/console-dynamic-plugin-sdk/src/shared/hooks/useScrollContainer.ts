import * as React from 'react';

const isHTMLElement = (n: Node): n is HTMLElement => {
  return n.nodeType === Node.ELEMENT_NODE;
};

export const getParentScrollableElement = (node: HTMLElement) => {
  let parentNode: Node = node;
  while (parentNode) {
    if (isHTMLElement(parentNode)) {
      let overflow = parentNode.style?.overflow;
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

export const useScrollContainer = (): [HTMLElement, (node: HTMLElement) => void] => {
  const [scrollContainer, setScrollContainer] = React.useState<HTMLElement>(null);
  const elementRef = React.useCallback((node: HTMLElement) => {
    if (node === null) {
      setScrollContainer(null);
    }
    if (node) {
      setScrollContainer(getParentScrollableElement(node));
    }
  }, []);
  return [scrollContainer, elementRef];
};
