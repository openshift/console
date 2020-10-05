import { Node } from '@patternfly/react-topology';
import * as React from 'react';
import { DataListCell } from '@patternfly/react-core';

import './StatusCell.scss';
import { ResourceStatus } from '@console/shared';
import { getResource } from '../../topology-utils';

type StatusProps = {
  item: Node;
};

export const StatusCell: React.FC<StatusProps> = ({ item }) => {
  const obj = getResource(item);
  return (
    <DataListCell id={`${item.getId()}_status`}>
      <div className="odc-topology-list-view__detail--status">
        <ResourceStatus obj={obj} />
      </div>
    </DataListCell>
  );
};
