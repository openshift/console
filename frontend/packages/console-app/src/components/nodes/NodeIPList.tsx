import type { FC } from 'react';
import * as _ from 'lodash';
import type { NodeAddress } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import DetailPropertyList from '@console/shared/src/components/lists/DetailPropertyList';
import DetailPropertyListItem from '@console/shared/src/components/lists/DetailPropertyListItem';

type NodeIPListProps = {
  ips: NodeAddress[];
  expand?: boolean;
};

const NodeIPList: FC<NodeIPListProps> = ({ ips, expand = false }) => (
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
