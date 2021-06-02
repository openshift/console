import * as React from 'react';
import * as _ from 'lodash';
import { NodeAddress, DetailPropertyList, DetailPropertyListItem } from '@console/shared';

type NodeIPListProps = {
  ips: NodeAddress[];
  expand?: boolean;
};

const NodeIPList: React.FC<NodeIPListProps> = ({ ips, expand = false }) => (
  <DetailPropertyList>
    {_.sortBy(ips, ['type']).map(
      ({ type, address }) =>
        address &&
        (expand || type === 'InternalIP') && (
          <DetailPropertyListItem
            key={`{${type}/${address}`}
            title={type.replace(/([a-z])([A-Z])/g, '$1 $2')}
          >
            {address}
          </DetailPropertyListItem>
        ),
    )}
  </DetailPropertyList>
);

export default NodeIPList;
