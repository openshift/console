import * as React from 'react';
import { Node, observer } from '@patternfly/react-topology';
import { TypedResourceBadgeCell } from '../../list-view/cells';
import { getResourceKind } from '../../topology-utils';
import { TopologyListViewNode } from '../../list-view';

interface HelmReleaseListViewNodeProps {
  item: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const ObservedHelmReleaseListViewNode: React.FC<HelmReleaseListViewNodeProps> = ({
  item,
  selectedIds,
  onSelect,
  children,
}) => {
  const { data } = item.getData();
  const kind = getResourceKind(item);
  const typeIconClass = data.chartIcon || 'icon-helm';

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

const HelmReleaseListViewNode = observer(ObservedHelmReleaseListViewNode);
export { HelmReleaseListViewNode };
