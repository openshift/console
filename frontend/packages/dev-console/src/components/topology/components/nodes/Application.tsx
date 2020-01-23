import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import {
  Node,
  observer,
  WithDndDropProps,
  WithSelectionProps,
  WithContextMenuProps,
} from '@console/topology';
import { getTopologyFilters, TopologyFilters } from '../../filters/filter-utils';
import ApplicationNode from './ApplicationNode';
import ApplicationGroup from './ApplicationGroup';

import './Application.scss';

type ApplicationProps = {
  element: Node;
  droppable?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  dragging?: boolean;
  filters?: TopologyFilters;
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
  filters,
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
        filters={filters}
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
      filters={filters}
    />
  );
};

const ApplicationState = (state: RootState) => {
  const filters = getTopologyFilters(state);
  return { filters };
};

export default connect(ApplicationState)(observer(Application));
