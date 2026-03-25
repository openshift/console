import type { FC } from 'react';
import TypedResourceBadgeCell from '@console/topology/src/components/list-view/cells/TypedResourceBadgeCell';
import TopologyListViewNode from '@console/topology/src/components/list-view/TopologyListViewNode';
import type { OdcBaseNode } from '@console/topology/src/elements';
import { getResourceKind } from '@console/topology/src/utils';
import { EventSourceIcon } from '../../utils/icons';
import { NodeType } from '../topology-types';

interface NoStatusListViewNodeProps {
  item: OdcBaseNode;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const NoStatusListViewNode: FC<NoStatusListViewNodeProps> = (props) => {
  const kind = getResourceKind(props.item);
  const badgeCell = (
    <TypedResourceBadgeCell key="type-icon" kind={kind} typeIcon={<EventSourceIcon />} />
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
