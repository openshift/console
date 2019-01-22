/* eslint-disable no-unused-vars */

import * as _ from 'lodash-es';
import * as React from 'react';

import { nodeStatus, makeNodeSchedulable, K8sResourceKind, referenceForModel } from '../module/k8s';
import { ResourceEventStream } from './events';
import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { configureUnschedulableModal } from './modals';
import { PodsPage } from './pod';
import { Kebab, navFactory, LabelList, ResourceKebab, SectionHeading, ResourceLink, Timestamp, units, cloudProviderNames, cloudProviderID, pluralize, StatusIcon } from './utils';
import { Line, requirePrometheus } from './graphs';
import { MachineModel, NodeModel } from '../models';
import { CamelCaseWrap } from './utils/camel-case-wrap';

const MarkAsUnschedulable = (kind, obj) => ({
  label: 'Mark as Unschedulable',
  hidden: _.get(obj, 'spec.unschedulable'),
  callback: () => configureUnschedulableModal({resource: obj}),
});

const MarkAsSchedulable = (kind, obj) => ({
  label: 'Mark as Schedulable',
  hidden: !_.get(obj, 'spec.unschedulable', false),
  callback: () => makeNodeSchedulable(obj),
});

const { ModifyLabels, ModifyAnnotations, Edit } = Kebab.factory;
const menuActions = [MarkAsSchedulable, MarkAsUnschedulable, ModifyLabels, ModifyAnnotations, Edit];

const NodeKebab = ({node}) => <ResourceKebab actions={menuActions} kind="Node" resource={node} />;

export const NodeIPList = ({ips, expand = false}) => <div>
  {_.sortBy(ips, ['type']).map((ip, i) => ip.address && <div key={i} className="co-node-ip">
    {(expand || ip.type === 'InternalIP') && <p>
      <span className="co-ip-type">{ip.type.replace(/([a-z])([A-Z])/g, '$1 $2')}: </span>
      <span className="co-ip-addr">{ip.address}</span>
    </p>}
  </div>)}
</div>;

const Header = props => {
  if (!props.data) {
    return null;
  }
  return <ListHeader>
    <ColHead {...props} className="col-md-5 col-sm-6 col-xs-8" sortField="metadata.name">Node Name</ColHead>
    <ColHead {...props} className="col-md-2 col-sm-6 col-xs-4" sortFunc="nodeReadiness">Status</ColHead>
    <ColHead {...props} className="col-md-5 hidden-sm hidden-xs" sortField="status.addresses">Node Addresses</ColHead>
  </ListHeader>;
};

const HeaderSearch = props => <ListHeader>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-5" sortField="metadata.name">Node Name</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortFunc="nodeReadiness">Status</ColHead>
  <ColHead {...props} className="col-sm-5 col-xs-7" sortField="metadata.labels">Node Labels</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-3 hidden-xs" sortField="status.addresses">Node Addresses</ColHead>
</ListHeader>;

const NodeStatus = ({node}) => <StatusIcon status={nodeStatus(node)} />;

const NodeRow = ({obj: node, expand}) => {

  return <ResourceRow obj={node}>
    <div className="col-md-5 col-sm-6 col-xs-8">
      <ResourceLink kind="Node" name={node.metadata.name} title={node.metadata.uid} />
    </div>
    <div className="col-md-2 col-sm-6 col-xs-4"><NodeStatus node={node} /></div>
    <div className="col-md-5 hidden-sm hidden-xs"><NodeIPList ips={node.status.addresses} expand={expand} /></div>
    {expand && <div className="col-xs-12">
      <LabelList kind="Node" labels={node.metadata.labels} />
    </div>}
    <div className="dropdown-kebab-pf">
      <NodeKebab node={node} />
    </div>
  </ResourceRow>;
};

const NodeRowSearch = ({obj: node}) => <div className="row co-resource-list__item">
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">
    <ResourceLink kind="Node" name={node.metadata.name} title={node.metadata.uid} />
  </div>
  <div className="col-md-2 hidden-sm hidden-xs">
    <NodeStatus node={node} />
  </div>
  <div className="col-sm-5 col-xs-7">
    <LabelList kind="Node" labels={node.metadata.labels} expand={false} />
  </div>
  <div className="col-md-2 col-sm-3 hidden-xs">
    <NodeIPList ips={node.status.addresses} />
  </div>
  <div className="dropdown-kebab-pf">
    <NodeKebab node={node} />
  </div>
</div>;

// We have different list layouts for the Nodes page list and the Search page list
const NodesList = props => <List {...props} Header={Header} Row={NodeRow} />;
export const NodesListSearch = props => <List {...props} Header={HeaderSearch} Row={NodeRowSearch} kind="node" />;

const filters = [{
  type: 'node-status',
  selected: ['Ready', 'Not Ready'],
  reducer: nodeStatus,
  items: [
    {id: 'Ready', title: 'Ready'},
    {id: 'Not Ready', title: 'Not Ready'},
  ],
}];
export const NodesPage = props => <ListPage {...props} ListComponent={NodesList} rowFilters={filters} canExpand={true} />;

const NodeGraphs = requirePrometheus(({node}) => {
  const nodeIp = _.find<{type: string, address: string}>(node.status.addresses, {type: 'InternalIP'});
  const ipQuery = nodeIp && `{instance=~'.*${nodeIp.address}.*'}`;
  const memoryLimit = units.dehumanize(node.status.allocatable.memory, 'binaryBytesWithoutB').value;
  const integerLimit = input => parseInt(input, 10);

  return <React.Fragment>
    <div className="row">
      <div className="col-md-4">
        <Line title="Memory Usage" query={ipQuery && `node_memory_Active${ipQuery}`} units="binaryBytes" limit={memoryLimit} />
      </div>
      <div className="col-md-4">
        <Line title="CPU Usage" query={ipQuery && `instance:node_cpu:rate:sum${ipQuery}`} units="numeric" limit={integerLimit(node.status.allocatable.cpu)} />
      </div>
      <div className="col-md-4">
        <Line title="Number of Pods" query={ipQuery && `kubelet_running_pod_count${ipQuery}`} units="numeric" limit={integerLimit(node.status.allocatable.pods)} />
      </div>
      <div className="col-md-4">
        <Line title="Network In" query={ipQuery && `instance:node_network_receive_bytes:rate:sum${ipQuery}`} units="decimalBytes" />
      </div>
      <div className="col-md-4">
        <Line title="Network Out" query={ipQuery && `instance:node_network_transmit_bytes:rate:sum${ipQuery}`} units="decimalBytes" />
      </div>
      <div className="col-md-4">
        <Line title="Filesystem (bytes)" query={ipQuery && `instance:node_filesystem_usage:sum${ipQuery}`} units="decimalBytes" />
      </div>
    </div>

    <br />
  </React.Fragment>;
});

const getMachine = (node: K8sResourceKind) => {
  const machine = _.get(node, 'metadata.annotations.machine');
  if (!machine) {
    return null;
  }

  const [namespace, name] = machine.split('/');
  return { namespace, name };
};

const Details = ({obj: node}) => {
  const images = _.filter(node.status.images, 'names');
  const machine = getMachine(node);
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Node Overview" />
      <NodeGraphs node={node} />
      <div className="row">
        <div className="col-md-6 col-xs-12">
          <dl className="co-m-pane__details">
            <dt>Node Name</dt>
            <dd>{node.metadata.name || '-'}</dd>
            <dt>External ID</dt>
            <dd>{_.get(node, 'spec.externalID', '-')}</dd>
            <dt>Node Addresses</dt>
            <dd><NodeIPList ips={_.get(node, 'status.addresses')} expand={true} /></dd>
            <dt>Node Labels</dt>
            <dd><LabelList kind="Node" labels={node.metadata.labels} /></dd>
            <dt>Annotations</dt>
            <dd><a className="co-m-modal-link" onClick={Kebab.factory.ModifyAnnotations(NodeModel, node).callback}>{pluralize(_.size(node.metadata.annotations), 'Annotation')}</a></dd>
            {machine && <React.Fragment>
              <dt>Machine</dt>
              <dd><ResourceLink kind={referenceForModel(MachineModel)} name={machine.name} namespace={machine.namespace} /></dd>
            </React.Fragment>}
            <dt>Provider ID</dt>
            <dd>{cloudProviderNames([cloudProviderID(node)])}</dd>
            {_.has(node, 'spec.unschedulable') && <dt>Unschedulable</dt>}
            {_.has(node, 'spec.unschedulable') && <dd className="text-capitalize">{_.get(node, 'spec.unschedulable', '-').toString()}
            </dd>}
            <dt>Created</dt>
            <dd><Timestamp timestamp={node.metadata.creationTimestamp} /></dd>
          </dl>
        </div>
        <div className="col-md-6 col-xs-12">
          <dl className="co-m-pane__details">
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

    <div className="co-m-pane__body">
      <SectionHeading text="Node Conditions" />
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
              <td><CamelCaseWrap value={c.type} /></td>
              <td>{c.status || '-'}</td>
              <td><CamelCaseWrap value={c.reason} /></td>
              <td><Timestamp timestamp={c.lastHeartbeatTime} /></td>
              <td><Timestamp timestamp={c.lastTransitionTime} /></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>

    <div className="co-m-pane__body">
      <SectionHeading text="Images" />
      <div className="co-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            {_.map(images, (image, i) => <tr key={i}>
              <td>{image.names.find(name => !name.includes('@')) || image.names[0]}</td>
              <td>{units.humanize(image.sizeBytes, 'decimalBytes', true).string || '-'}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </React.Fragment>;
};

const {details, editYaml, events, pods} = navFactory;

const pages = [
  details(Details),
  editYaml(),
  pods(({obj}) => <PodsPage showTitle={false} fieldSelector={`spec.nodeName=${obj.metadata.name}`} />),
  events(ResourceEventStream),
];
export const NodesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={pages}
/>;
