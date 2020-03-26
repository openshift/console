import * as React from 'react';
import {
  Node,
  observer,
  WithDndDropProps,
  WithSelectionProps,
  WithContextMenuProps,
} from '@console/topology';
import { SHOW_GROUPING_HINT_EVENT } from '../../topology-types';
import ApplicationNode from './ApplicationNode';
import ApplicationGroup from './ApplicationGroup';

import './Application.scss';
import { RegroupHint } from '../RegroupHint';

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
  const needsHintRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    const needsHint = dropTarget && !canDrop;
    if (needsHint !== needsHintRef.current) {
      needsHintRef.current = needsHint;
      element
        .getController()
        .fireEvent(SHOW_GROUPING_HINT_EVENT, element, needsHint ? <RegroupHint /> : null);
    }
  }, [dropTarget, canDrop, element]);

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
