import * as React from 'react';
import { Node, observer } from '@patternfly/react-topology';
import {
  getResourceKind,
  TopologyListViewNode,
  TypedResourceBadgeCell,
} from '@console/dev-console/src/components/topology';

interface KnativeServiceListViewNodeProps {
  item: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const ObservedKnativeServiceListViewNode: React.FC<KnativeServiceListViewNodeProps> = ({
  item,
  selectedIds,
  onSelect,
  children,
}) => {
  const kind = getResourceKind(item);

  const badgeCell = (
    <TypedResourceBadgeCell key="type-icon" kind={kind} typeIconClass={'icon-knative'} />
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

const KnativeServiceListViewNode = observer(ObservedKnativeServiceListViewNode);
export { KnativeServiceListViewNode };
