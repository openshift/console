import * as React from 'react';
import {
  TopologyListViewNode,
  TypedResourceBadgeCell,
} from '@console/topology/src/components/list-view';
import { OdcBaseNode } from '@console/topology/src/elements';
import { getResourceKind } from '@console/topology/src/utils';
import { EventSourceIcon, eventIconStyle } from '../../utils/icons';
import { NodeType } from '../topology-types';

interface NoStatusListViewNodeProps {
  item: OdcBaseNode;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const NoStatusListViewNode: React.FC<NoStatusListViewNodeProps> = (props) => {
  const kind = getResourceKind(props.item);
  const badgeCell = (
    <TypedResourceBadgeCell
      key="type-icon"
      kind={kind}
      typeIcon={<EventSourceIcon style={eventIconStyle} />}
    />
  );
  return (
    <TopologyListViewNode
      noPods
      {...props}
      badgeCell={props.item.getType() === NodeType.EventSource ? badgeCell : null}
    />
  );
};
export { NoStatusListViewNode };
