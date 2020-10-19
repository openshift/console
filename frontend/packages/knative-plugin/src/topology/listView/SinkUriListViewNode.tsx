import * as React from 'react';
import { observer } from '@patternfly/react-topology';
import {
  OdcBaseNode,
  TopologyListViewNode,
  TypedResourceBadgeCell,
} from '@console/dev-console/src/components/topology';
import { DataListCell } from '@patternfly/react-core';

interface KnativeServiceListViewNodeProps {
  item: OdcBaseNode;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const ObservedSinkUriListViewNode: React.FC<KnativeServiceListViewNodeProps> = ({
  item,
  selectedIds,
  onSelect,
  children,
}) => {
  const sinkUri = item.getResource()?.spec?.sinkUri;

  const labelCell = (
    <DataListCell className="odc-topology-list-view__label-cell" key="label" id={sinkUri}>
      <TypedResourceBadgeCell key="type-icon" kind={item.getResourceKind()} />
      {sinkUri}
    </DataListCell>
  );

  return (
    <TopologyListViewNode
      item={item}
      selectedIds={selectedIds}
      onSelect={onSelect}
      labelCell={labelCell}
    >
      {children}
    </TopologyListViewNode>
  );
};

const SinkUriListViewNode = observer(ObservedSinkUriListViewNode);
export { SinkUriListViewNode };
