import React from 'react';

import {angulars} from './react-wrapper';
import {makeList} from './factory';
import {Cog, LabelList, ResourceIcon} from './utils';

const NodeIPList = ({ips, compacted = true}) => <div>
  {_.sortBy(ips, ['type']).map((ip, i) => <div key={i} className="co-node-ip">
    {(!compacted || ip.type === 'InternalIP') && <p>
      <span className="co-ip-type">{ip.type}: </span>
      <span className="co-ip-addr">{ip.address}</span>
    </p>}
  </div>)}
</div>

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">Node Name</div>
  <div className="col-md-2 hidden-sm hidden-xs">Status</div>
  <div className="col-sm-5 col-xs-7">Node Labels</div>
  <div className="col-md-2 col-sm-3 hidden-xs">Node Addresses</div>
</div>;

const NodeCog = ({node}) => {
  const options = [Cog.factory.ModifyLabels].map(f => f(angulars.kinds.NODE, node));
  return <Cog options={options} size="small" anchor="left"></Cog>;
}

const NodeRow = (node) => <div className="row co-resource-list__item">
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">
    <NodeCog node={node} />
    <ResourceIcon kind={angulars.kinds.NODE.id} />
    <a href={`nodes/${node.metadata.name}`} title={node.metadata.uid}>
      {node.metadata.name}
    </a>
  </div>
  <div className="col-md-2 hidden-sm hidden-xs">
    {_.filter(node.status.conditions, {status: 'True'}).map((condition) => condition.type).join(', ')}
  </div>
  <div className="col-sm-5 col-xs-7">
    <LabelList kind={angulars.kinds.NODE.id} labels={node.metadata.labels} dontExpand={true} />
  </div>
  <div className="col-md-2 col-sm-3 hidden-xs">
    <NodeIPList ips={node.status.addresses} />
  </div>
</div>

const kind = 'NODE';

const NodesList = makeList('Nodes', kind, Header, NodeRow);

export {NodesList};
