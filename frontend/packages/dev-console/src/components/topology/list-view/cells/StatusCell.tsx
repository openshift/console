import { Node } from '@patternfly/react-topology';
import * as React from 'react';
import { DataListCell } from '@patternfly/react-core';

import './StatusCell.scss';

type StatusProps = {
  item: Node;
};

export const StatusCell: React.FC<StatusProps> = ({ item }) => {
  const { status } = item.getData().resources;
  return (
    <DataListCell id={`${item.getId()}_status`}>
      {status ? <div className="odc-topology-list-view__detail--status">{status}</div> : null}
    </DataListCell>
  );
};
