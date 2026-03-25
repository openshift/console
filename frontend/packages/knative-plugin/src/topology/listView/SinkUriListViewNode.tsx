import type { FC } from 'react';
import { DataListCell } from '@patternfly/react-core';
import { observer } from '@patternfly/react-topology';
import TypedResourceBadgeCell from '@console/topology/src/components/list-view/cells/TypedResourceBadgeCell';
import TopologyListViewNode from '@console/topology/src/components/list-view/TopologyListViewNode';
import type { OdcBaseNode } from '@console/topology/src/elements';

interface SinkUriListViewNodeProps {
  item: OdcBaseNode;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const ObservedSinkUriListViewNode: FC<SinkUriListViewNodeProps> = ({ item, ...rest }) => {
  const sinkUri = item.getResource()?.spec?.sinkUri;

  const labelCell = (
    <DataListCell className="odc-topology-list-view__label-cell" key="label" id={sinkUri}>
      <TypedResourceBadgeCell key="type-icon" kind={item.getResourceKind()} />
      {sinkUri}
    </DataListCell>
  );

  return <TopologyListViewNode item={item} labelCell={labelCell} noPods {...rest} />;
};

const SinkUriListViewNode = observer(ObservedSinkUriListViewNode);
export { SinkUriListViewNode };
