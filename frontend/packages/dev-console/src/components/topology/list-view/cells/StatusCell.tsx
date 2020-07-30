import { Node } from '@patternfly/react-topology';
import * as React from 'react';
import { DataListCell } from '@patternfly/react-core';

type StatusProps = {
  item: Node;
};

export const StatusCell: React.FC<StatusProps> = ({ item }) => {
  const { status } = item.getData().resources;
  return status ? (
    <DataListCell id={`${item.getId()}_metrics`}>
      <div className="odc-topology-list-view__detail--status">{status}</div>
    </DataListCell>
  ) : null;
};
