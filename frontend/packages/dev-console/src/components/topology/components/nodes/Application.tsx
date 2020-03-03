import * as React from 'react';
import {
  Node,
  observer,
  WithDndDropProps,
  WithSelectionProps,
  WithContextMenuProps,
} from '@console/topology';
import ApplicationNode from './ApplicationNode';
import ApplicationGroup from './ApplicationGroup';

import './Application.scss';

type ApplicationProps = {
  element: Node;
  droppable?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  dragging?: boolean;
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps;

const Application: React.FC<ApplicationProps> = ({
  element,
  selected,
  onSelect,
  dndDropRef,
  droppable,
  canDrop,
  dropTarget,
  onContextMenu,
  contextMenuOpen,
  dragging,
}) => {
  if (element.isCollapsed()) {
    return (
      <ApplicationNode
        element={element}
        selected={selected}
        onSelect={onSelect}
        dndDropRef={dndDropRef}
        canDrop={canDrop}
        dropTarget={dropTarget}
        onContextMenu={onContextMenu}
        contextMenuOpen={contextMenuOpen}
        dragging={dragging}
      />
    );
  }

  return (
    <ApplicationGroup
      element={element}
      selected={selected}
      onSelect={onSelect}
      dndDropRef={dndDropRef}
      canDrop={canDrop}
      dropTarget={dropTarget}
      droppable={droppable}
      onContextMenu={onContextMenu}
      contextMenuOpen={contextMenuOpen}
      dragging={dragging}
    />
  );
};

export default observer(Application);
