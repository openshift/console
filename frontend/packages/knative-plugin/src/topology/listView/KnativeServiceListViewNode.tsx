import * as React from 'react';
import { Node, observer } from '@patternfly/react-topology';
import {
  TopologyListViewNode,
  TypedResourceBadgeCell,
} from '@console/topology/src/components/list-view';
import { getResource, getResourceKind } from '@console/topology/src/utils';
import { isServerlessFunction } from '../knative-topology-utils';

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

  const typeIconClass: string = isServerlessFunction(getResource(item))
    ? 'icon-serverless-function'
    : 'icon-knative';

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

const KnativeServiceListViewNode = observer(ObservedKnativeServiceListViewNode);
export { KnativeServiceListViewNode };
