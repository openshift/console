import * as React from 'react';
import { Node, observer } from '@patternfly/react-topology';
import TypedResourceBadgeCell from '@console/topology/src/components/list-view/cells/TypedResourceBadgeCell';
import TopologyListViewNode from '@console/topology/src/components/list-view/TopologyListViewNode';
import { getResourceKind } from '@console/topology/src/utils/topology-utils';

interface HelmReleaseListViewNodeProps {
  item: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const HelmReleaseListViewNode: React.FC<HelmReleaseListViewNodeProps> = ({
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

export default observer(HelmReleaseListViewNode);
