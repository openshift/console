import * as React from 'react';
import { observer } from 'mobx-react';
import ElementContext from '../../utils/ElementContext';
import { isNode } from '../../types';

type LayerContainerProps = {
  children: React.ReactNode;
};

const LayerContainer: React.RefForwardingComponent<SVGGElement, LayerContainerProps> = (
  { children },
  ref,
) => {
  // accumulate parent positions
  let p = React.useContext(ElementContext);
  let x = 0;
  let y = 0;
  while (isNode(p)) {
    if (!p.isGroup() || p.isCollapsed()) {
      const { x: px, y: py } = p.getBounds();
      x += px;
      y += py;
    }
    p = p.getParent();
  }
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`}>
      {children}
    </g>
  );
};

export default observer(React.forwardRef(LayerContainer));
