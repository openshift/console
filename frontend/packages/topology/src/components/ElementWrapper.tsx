import * as React from 'react';
import { observer } from 'mobx-react';
import ElementContext from '../utils/ElementContext';
import { GraphElement, isGraph, isEdge, isNode } from '../types';

type ElementWrapperProps = {
  element: GraphElement;
};

// in a separate component so that changes to behaviors do not re-render children
const ElementComponent: React.FC<ElementWrapperProps> = observer(({ element }) => {
  const Component = React.useMemo(
    () => element.getController().getComponent(element.getKind(), element.getType()),
    [element],
  );

  return (
    <ElementContext.Provider value={element}>
      <Component {...element.getState()} element={element} />
    </ElementContext.Provider>
  );
});

const ElementChildren: React.FC<ElementWrapperProps> = observer(({ element }) => {
  return (
    <>
      {element
        .getChildren()
        .filter(isEdge)
        .map((e) => (
          <ElementWrapper key={e.getId()} element={e} />
        ))}
      {element
        .getChildren()
        .filter(isNode)
        .map((e) => (
          <ElementWrapper key={e.getId()} element={e} />
        ))}
    </>
  );
});

const ElementWrapper: React.FC<ElementWrapperProps> = observer(({ element }) => {
  if (!element.isVisible()) {
    return null;
  }

  if (isEdge(element)) {
    const source = element.getSourceAnchorNode();
    const target = element.getTargetAnchorNode();
    if ((source && !source.isVisible()) || (target && !target.isVisible())) {
      return null;
    }
  }
  const commonProps = {
    [`data-id`]: element.getId(),
    [`data-kind`]: element.getKind(),
    [`data-type`]: element.getType(),
  };
  if (isGraph(element)) {
    return (
      <g {...commonProps}>
        <ElementComponent element={element} />
      </g>
    );
  }
  if (isNode(element) && (!element.isGroup() || element.isCollapsed())) {
    const { x, y } = element.getBounds();
    return (
      <g {...commonProps} transform={`translate(${x}, ${y})`}>
        <ElementComponent element={element} />
        <ElementChildren element={element} />
      </g>
    );
  }
  return (
    <g {...commonProps}>
      <ElementComponent element={element} />
      <ElementChildren element={element} />
    </g>
  );
});

export default ElementWrapper;
