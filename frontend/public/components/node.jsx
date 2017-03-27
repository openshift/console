import React from 'react';

import { k8sPatch, isNodeReady } from '../module/k8s';
import { ResourceEventStream } from './events';
import { DetailsPage, ListPage, makeList } from './factory';
import { configureUnschedulableModal } from './modals';
import { PodsPage } from './pod';
import { SparklineWidget } from './sparkline-widget/sparkline-widget';
import { Cog, navFactory, kindObj, LabelList, ResourceCog, ResourceHeading, ResourceLink, Timestamp, units, cloudProviderNames, cloudProviderID, pluralize, containerLinuxUpdateOperator } from './utils';

const makeNodeScheduable = (resourceKind, resource) => {
  const patch = [{ op: 'replace', path: '/spec/unschedulable', value: false }];
  k8sPatch(resourceKind, resource, patch).catch((error) => {
    throw error;
  });
};

const MarkAsUnschedulable = (kind, obj) => ({
  label: 'Mark as Unschedulable...',
  weight: 100,
  hidden: _.has(obj, 'spec.unschedulable') && obj.spec.unschedulable,
  callback: () => configureUnschedulableModal({
    resourceKind: kind,
    resource: obj,
  })
});

const MarkAsSchedulable = (kind, obj) => ({
  label: 'Mark as Schedulable',
  weight: 100,
  hidden: !_.has(obj, 'spec.unschedulable'),
  callback: () => makeNodeScheduable(kind, obj)
});

const menuActions = [MarkAsSchedulable, MarkAsUnschedulable, Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit];

const NodeCog = ({node}) => <ResourceCog actions={menuActions} kind="node" resource={node} />;

const NodeIPList = ({ips, expand = false}) => <div>
  {_.sortBy(ips, ['type']).map((ip, i) => <div key={i} className="co-node-ip">
    {(expand || ip.type === 'InternalIP') && <p>
      <span className="co-ip-type">{ip.type}: </span>
      <span className="co-ip-addr">{ip.address}</span>
    </p>}
  </div>)}
</div>;

const Header = ({data}) => {
  if (data) {
    const isOperatorInstalled = containerLinuxUpdateOperator.isOperatorInstalled(data[0]);
    return <div className="row co-m-table-grid__head">
      <div className="col-xs-4">Node Name</div>
      <div className={isOperatorInstalled ? 'col-xs-2' : 'col-xs-4'}>Status</div>
      { isOperatorInstalled && <div className="col-xs-3">OS Update</div> }
      <div className={isOperatorInstalled ? 'col-xs-3' : 'col-xs-4'}>Node Addresses</div>
    </div>;
  }
  return null;
};

const HeaderSearch = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">Node Name</div>
  <div className="col-md-2 hidden-sm hidden-xs">Status</div>
  <div className="col-sm-5 col-xs-7">Node Labels</div>
  <div className="col-md-2 col-sm-3 hidden-xs">Node Addresses</div>
</div>;

const NodeStatus = ({node}) => isNodeReady(node) ? <span className="node-ready"><i className="fa fa-check"></i> Ready</span> : <span className="node-not-ready"><i className="fa fa-minus-circle"></i> Not Ready</span>;

const NodeCLUpdateStatus = ({node}) => {
  const updateStatus = containerLinuxUpdateOperator.getUpdateStatus(node);
  const newVersion = containerLinuxUpdateOperator.getNewVersion(node);
  const lastCheckedDate = containerLinuxUpdateOperator.getLastCheckedTime(node);

  return <div>
    <span><i className={updateStatus.className}></i>&nbsp;&nbsp;{updateStatus.text}</span>
    {!_.isEmpty(newVersion)  && !containerLinuxUpdateOperator.isSoftwareUpToDate(node) &&
      <div>
        <small className="">Container Linux {containerLinuxUpdateOperator.getVersion(node)} &#10141; {newVersion}</small>
      </div>}
    {!_.isEmpty(lastCheckedDate) && containerLinuxUpdateOperator.isSoftwareUpToDate(node) &&
      <div>
        <small className="">Last checked on <div className="co-inline-block">{<Timestamp timestamp={lastCheckedDate} isUnix={true} />}</div></small>
      </div>}
  </div>;
};

const NodeCLStatusRow = ({node}) => {
  const updateStatus = containerLinuxUpdateOperator.getUpdateStatus(node);
  return <span><i className={updateStatus.className}></i>&nbsp;&nbsp;{updateStatus.text}</span>;
};

const NodeRow = ({obj: node, expand}) => {
  const isOperatorInstalled = containerLinuxUpdateOperator.isOperatorInstalled(node);

  return <div className="row co-resource-list__item">
    <div className="middler">
      <div className="col-xs-4">
        <NodeCog node={node} />
        <ResourceLink kind="node" name={node.metadata.name} title={node.metadata.uid} />
      </div>
      <div className={isOperatorInstalled ? 'col-xs-2' : 'col-xs-4'}>
        <NodeStatus node={node} />
      </div>
      { isOperatorInstalled &&  <div className="col-xs-3">
        <NodeCLStatusRow node={node} />
      </div>}
      <div className={isOperatorInstalled ? 'col-xs-3' : 'col-xs-4'}>
        <NodeIPList ips={node.status.addresses} expand={expand} />
      </div>
    </div>
    {expand && <div className="col-xs-12">
      <LabelList kind="node" labels={node.metadata.labels} />
    </div>}
  </div>;
};

const NodeRowSearch = ({obj: node}) => <div className="row co-resource-list__item">
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">
    <NodeCog node={node} />
    <ResourceLink kind="node" name={node.metadata.name} title={node.metadata.uid} />
  </div>
  <div className="col-md-2 hidden-sm hidden-xs">
    <NodeStatus node={node} />
  </div>
  <div className="col-sm-5 col-xs-7">
    <LabelList kind="node" labels={node.metadata.labels} expand={false} />
  </div>
  <div className="col-md-2 col-sm-3 hidden-xs">
    <NodeIPList ips={node.status.addresses} />
  </div>
</div>;

// We have different list layouts for the Nodes page list and the Search page list
const NodesList = makeList('Nodes', 'node', Header, NodeRow);
export const NodesListSearch = makeList('Nodes', 'node', HeaderSearch, NodeRowSearch);

const dropdownFilters = [{
  type: 'node-status',
  items: {
    all: 'Status: All',
    ready: 'Status: Ready',
    notReady: 'Status: Not Ready',
  },
  title: 'Ready Status',
}];
export const NodesPage = props => <ListPage {...props} ListComponent={NodesList} dropdownFilters={dropdownFilters} canExpand={true} />;

const Details = (node) => {
  const nodeIp = _.find(node.status.addresses, {type: 'InternalIP'});
  const ipQuery = nodeIp && `{instance=~'.*${nodeIp.address}.*'}`;

  const memoryLimit = units.dehumanize(node.status.allocatable.memory, 'binaryBytesWithoutB').value;

  const integerLimit = input => parseInt(input, 10);

  return <div>
    <ResourceHeading resourceName="Node" />
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-xs-12">
          <div className="co-sparkline-wrapper">
            <div className="row no-gutter">
              <div className="col-md-4">
                <SparklineWidget heading="RAM" query={ipQuery && `node_memory_Active${ipQuery}`} units="binaryBytes" limit={memoryLimit} />
              </div>
              <div className="col-md-4">
                <SparklineWidget heading="CPU" query={ipQuery && `instance:node_cpu:rate:sum${ipQuery}`} units="numeric" limit={integerLimit(node.status.allocatable.cpu)} />
              </div>
              <div className="col-md-4">
                <SparklineWidget heading="Number of Pods" query={`kubelet_running_pod_count{instance=~'.*${node.metadata.name}.*'}`} units="numeric" limit={integerLimit(node.status.allocatable.pods)} />
              </div>
              <div className="col-md-4">
                <SparklineWidget heading="Network In" query={ipQuery && `instance:node_network_receive_bytes:rate:sum${ipQuery}`} units="decimalBytes" />
              </div>
              <div className="col-md-4">
                <SparklineWidget heading="Network Out" query={ipQuery && `instance:node_network_transmit_bytes:rate:sum${ipQuery}`} units="decimalBytes" />
              </div>
              <div className="col-md-4">
                <SparklineWidget heading="Filesystem" query={ipQuery && `instance:node_filesystem_usage:sum${ipQuery}`} units="decimalBytes" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xs-12">
          <dl>
            <dt>Node Name</dt>
            <dd>{node.metadata.name || '-'}</dd>
            <dt>External ID</dt>
            <dd>{_.get(node, 'spec.externalID', '-')}</dd>
            <dt>Node Addresses</dt>
            <dd><NodeIPList ips={_.get(node, 'status.addresses')} expand={true} /></dd>
            <dt>Node Labels</dt>
            <dd><LabelList kind="node" labels={node.metadata.labels} /></dd>
            <dt>Annotations</dt>
            <dd><a className="co-m-modal-link" onClick={Cog.factory.ModifyAnnotations(kindObj('node'), node).callback}>{pluralize(_.size(node.metadata.annotations), 'Annotation')}</a></dd>
            <dt>Provider ID</dt>
            <dd>{cloudProviderNames([cloudProviderID(node)])}</dd>
            {_.has(node, 'spec.unschedulable') && <dt>Unschedulable</dt>}
            {_.has(node, 'spec.unschedulable') &&  <dd className="text-capitalize">{_.get(node, 'spec.unschedulable', '-').toString()}
              </dd>}
            <dt>Created</dt>
            <dd><Timestamp timestamp={node.metadata.creationTimestamp} /></dd>
          </dl>
        </div>
        <div className="col-md-6 col-xs-12">
          <dl>
            <dt>Operating System</dt>
            <dd className="text-capitalize">{_.get(node, 'status.nodeInfo.operatingSystem', '-')}</dd>
            <dt>Architecture</dt>
            <dd className="text-uppercase">{_.get(node, 'status.nodeInfo.architecture', '-')}</dd>
            <dt>Kernel Version</dt>
            <dd>{_.get(node, 'status.nodeInfo.kernelVersion', '-')}</dd>
            <dt>Boot ID</dt>
            <dd>{_.get(node, 'status.nodeInfo.bootID', '-')}</dd>
            <dt>Container Runtime</dt>
            <dd>{_.get(node, 'status.nodeInfo.containerRuntimeVersion', '-')}</dd>
            <dt>Kubelet Version</dt>
            <dd>{_.get(node, 'status.nodeInfo.kubeletVersion', '-')}</dd>
            <dt>Kube-Proxy Version</dt>
            <dd>{_.get(node, 'status.nodeInfo.kubeProxyVersion', '-')}</dd>
          </dl>
        </div>
      </div>
    </div>

    { containerLinuxUpdateOperator.isOperatorInstalled(node) && <div className="co-m-pane__body">
      <div className="row">
        <div className="col-xs-12">
          <h1 className="co-section-title">Container Linux</h1>
        </div>
        <div className="col-md-6 col-xs-12">
          <dl>
            <dt>Current Version</dt>
            <dd>{containerLinuxUpdateOperator.getVersion(node)}</dd>
            <dt>Channel</dt>
            <dd className="text-capitalize">{containerLinuxUpdateOperator.getChannel(node)}</dd>
          </dl>
        </div>
        <div className="col-md-6 col-xs-12">
          <dl>
            <dt>Update Status</dt>
            <dd><NodeCLUpdateStatus node={node} /></dd>
          </dl>
        </div>
      </div>
    </div> }

    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-xs-12">
          <h1 className="co-section-title">Node Conditions</h1>
          <div className="co-table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Updated</th>
                  <th>Changed</th>
                </tr>
              </thead>
              <tbody>
                {_.map(node.status.conditions, (c, i) => <tr key={i}>
                  <td>{c.type}</td>
                  <td>{c.status || '-'}</td>
                  <td>{c.reason || '-'}</td>
                  <td><Timestamp timestamp={c.lastHeartbeatTime} /></td>
                  <td><Timestamp timestamp={c.lastTransitionTime} /></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-xs-12">
          <h1 className="co-section-title">Images</h1>
          <div className="co-table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                </tr>
              </thead>
              <tbody>
                {_.map(node.status.images, (image, i) => <tr key={i}>
                  <td>{image.names.join(',')}</td>
                  <td>{units.humanize(image.sizeBytes, 'decimalBytes', true).string || '-'}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>;
};

const {details, editYaml, events, pods} = navFactory;
const pages = [
  details(Details),
  editYaml(),
  pods(({metadata: {name}}) => <PodsPage showTitle={false} fieldSelector={`spec.nodeName=${name}`} />),
  events(ResourceEventStream),
];

export const NodesDetailsPage = props => <DetailsPage {...props} pages={pages} menuActions={menuActions} />;
