import * as React from 'react';
import { Node, observer } from '@patternfly/react-topology';
import { TypedResourceBadgeCell } from '../../list-view/cells';
import { getResourceKind } from '../../topology-utils';
import { TopologyListViewNode } from '../../list-view';

interface OperatorGroupListViewNodeProps {
  item: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const ObservedOperatorGroupListViewNode: React.FC<OperatorGroupListViewNodeProps> = ({
  item,
  selectedIds,
  onSelect,
  children,
}) => {
  const { data } = item.getData();
  const kind = data.operatorKind || getResourceKind(item);
  const typeIconClass = data?.builderImage;

  const badgeCell = (
    <TypedResourceBadgeCell key="type-icon" kind={kind} typeIconClass={typeIconClass} />
  );

  return (
    <TopologyListViewNode
      item={item}
      selectedIds={selectedIds}
      onSelect={onSelect}
      badgeCell={badgeCell}
    >
      {children}
    </TopologyListViewNode>
  );
};

const OperatorGroupListViewNode = observer(ObservedOperatorGroupListViewNode);
export { OperatorGroupListViewNode };
