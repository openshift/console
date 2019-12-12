import * as React from 'react';
import { observer } from 'mobx-react';
import { isNode, Node } from '../types';
import ElementContext from '../utils/ElementContext';

export type WithCollapsibleNodeProps = {
  setCollapsed: (collapsed: boolean) => void;
  collapsed: boolean;
};

export const useCollapsibleNode = (): WithCollapsibleNodeProps => {
  const element = React.useContext(ElementContext);
  if (!isNode(element)) {
    throw new Error('useCallapsibleNode must be used within the scope of a Node');
  }
  return {
    setCollapsed: (collapsed: boolean) => {
      (element as Node).setCollapsed(collapsed);
      element
        .getController()
        .getGraph()
        .layout(false);
    },
    collapsed: (element as Node).isCollapsed(),
  };
};

export const withCollapsibleNode = <P extends {} = {}>() => (
  WrappedComponent: React.ComponentType<P>,
) => {
  const Component: React.FC<P> = (props) => {
    const collapsibleProps = useCollapsibleNode();
    return <WrappedComponent {...props} {...collapsibleProps} />;
  };
  return observer(Component);
};
