import * as _ from 'lodash';
import * as React from 'react';
import { NodeAddress } from '@console/shared';

type NodeIPListProps = {
  ips: NodeAddress[];
  expand?: boolean;
};

const NodeIPList: React.FC<NodeIPListProps> = ({ ips, expand = false }) => (
  <>
    {_.sortBy(ips, ['type']).map(
      ({ type, address }) =>
        address && (
          <div key={`{${type}/${address}`} className="co-node-ip">
            {(expand || type === 'InternalIP') && (
              <>
                <span className="co-ip-type">{type.replace(/([a-z])([A-Z])/g, '$1 $2')}: </span>
                <span className="co-ip-addr">{address}</span>
                <br />
              </>
            )}
          </div>
        ),
    )}
  </>
);

export default NodeIPList;
