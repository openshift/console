import React from 'react';

import {angulars, register} from './react-wrapper';
import {makeList, makeListPage} from './factory';
import {Cog, LabelList, NavTitle, ResourceIcon} from './utils';

const NodeIPList = ({ips, expand = false}) => <div>
  {_.sortBy(ips, ['type']).map((ip, i) => <div key={i} className="co-node-ip">
    {(expand || ip.type === 'InternalIP') && <p>
      <span className="co-ip-type">{ip.type}: </span>
      <span className="co-ip-addr">{ip.address}</span>
    </p>}
  </div>)}
</div>;

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-4">Node Name</div>
  <div className="col-xs-4">Status</div>
  <div className="col-xs-4">Node Addresses</div>
</div>;

const HeaderSearch = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">Node Name</div>
  <div className="col-md-2 hidden-sm hidden-xs">Status</div>
  <div className="col-sm-5 col-xs-7">Node Labels</div>
  <div className="col-md-2 col-sm-3 hidden-xs">Node Addresses</div>
</div>;

const NodeCog = ({node}) => {
  const options = [Cog.factory.ModifyLabels].map(f => f(angulars.kinds.NODE, node));
  return <Cog options={options} size="small" anchor="left" />;
};

const NodeLink = ({node}) => <a href={`nodes/${node.metadata.name}`} title={node.metadata.uid}>{node.metadata.name}</a>;

const NodeStatus = ({node}) => angulars.k8sNodes.isReady(node) ? <span className="node-ready"><i className="fa fa-check"></i> Ready</span> : <span className="node-not-ready"><i className="fa fa-minus-circle"></i> Not Ready</span>;

const NodeRow = ({obj: node, expand}) => <div className="row co-resource-list__item">
  <div className="middler">
    <div className="col-xs-4">
      <NodeCog node={node} />
      <ResourceIcon kind="node" />
      <NodeLink node={node} />
    </div>
    <div className="col-xs-4">
      <NodeStatus node={node} />
    </div>
    <div className="col-xs-4">
      <NodeIPList ips={node.status.addresses} expand={expand} />
    </div>
  </div>
  {expand && <div className="col-xs-12">
    <LabelList kind="node" labels={node.metadata.labels} />
  </div>}
</div>;

const NodeRowSearch = ({obj: node}) => <div className="row co-resource-list__item">
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">
    <NodeCog node={node} />
    <ResourceIcon kind="node" />
    <NodeLink node={node} />
  </div>
  <div className="col-md-2 hidden-sm hidden-xs">
    <NodeStatus node={node} />
  </div>
  <div className="col-sm-5 col-xs-7">
    <LabelList kind="node" labels={node.metadata.labels} dontExpand={true} />
  </div>
  <div className="col-md-2 col-sm-3 hidden-xs">
    <NodeIPList ips={node.status.addresses} />
  </div>
</div>;

const NodesPage = () => <div className="co-p-nodes">
  <NavTitle title="Nodes" />
  <NodesListPage canExpand={true} />
</div>;

// We have different list layouts for the Nodes page list and the Search page list
const NodesList = makeList('Nodes', 'node', Header, NodeRow);
const NodesListSearch = makeList('Nodes', 'node', HeaderSearch, NodeRowSearch);

const dropdownFilters = [{
  type: 'node-status',
  items: {
    all: 'Status: All',
    ready: 'Status: Ready',
    notReady: 'Status: Not Ready',
  },
  title: 'Ready Status',
}];
const NodesListPage = makeListPage('NodesPage', 'node', NodesList, dropdownFilters);

export {NodeIPList, NodesList, NodesListSearch, NodesPage};
register('NodesPage', NodesPage);
register('NodeIPList', NodeIPList);
