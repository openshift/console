import type { ReactNode } from 'react';
import { useState, useLayoutEffect } from 'react';
import * as ReactDOM from 'react-dom';

type GetContainer = Element | null | undefined | (() => Element);

type PortalProps = {
  container?: GetContainer;
  children?: ReactNode;
};

const getContainer = (container: GetContainer): Element | null | undefined =>
  typeof container === 'function' ? container() : container;

const Portal: Snail.FCC<PortalProps> = ({ children, container }) => {
  const [containerNode, setContainerNode] = useState<Element>();

  useLayoutEffect(() => {
    setContainerNode(getContainer(container) || document.body);
  }, [container]);

  return containerNode ? ReactDOM.createPortal(children, containerNode) : null;
};

export default Portal;
