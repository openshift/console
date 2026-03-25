import type { ReactNode, FC } from 'react';
import type { Node } from '@patternfly/react-topology';
import { observer } from '@patternfly/react-topology';
import { TypedResourceBadgeCell } from '../../components/list-view/cells';
import TopologyListViewNode from '../../components/list-view/TopologyListViewNode';
import { getResourceKind } from '../../utils/topology-utils';

interface OperatorGroupListViewNodeProps {
  item: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  children?: ReactNode;
}

const OperatorGroupListViewNode: FC<OperatorGroupListViewNodeProps> = ({
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

export default observer(OperatorGroupListViewNode);
