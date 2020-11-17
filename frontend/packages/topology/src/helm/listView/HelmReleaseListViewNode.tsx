import * as React from 'react';
import { Node, observer } from '@patternfly/react-topology';
import { getResourceKind } from '../../utils/topology-utils';
import TopologyListViewNode from '../../components/list-view/TopologyListViewNode';
import TypedResourceBadgeCell from '../../components/list-view/cells/TypedResourceBadgeCell';

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
