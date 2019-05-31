import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { getNodeRoles, nodeStatus, makeNodeSchedulable, K8sResourceKind, referenceForModel } from '../module/k8s';
import { ResourceEventStream } from './events';
import { Table, TableRow, TableData, DetailsPage, ListPage } from './factory';
import { configureUnschedulableModal } from './modals';
import { PodsPage } from './pod';
import { Kebab, navFactory, LabelList, ResourceKebab, SectionHeading, ResourceLink, Timestamp, units, cloudProviderNames, cloudProviderID, pluralize, StatusIconAndText, humanizeDecimalBytes, humanizeCpuCores, useAccessReview } from './utils';
import { Area, requirePrometheus } from './graphs';
import { MachineModel, NodeModel } from '../models';
import { CamelCaseWrap } from './utils/camel-case-wrap';

const MarkAsUnschedulable = (kind, obj) => ({
  label: 'Mark as Unschedulable',
  hidden: _.get(obj, 'spec.unschedulable'),
  callback: () => configureUnschedulableModal({resource: obj}),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.path,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});

const MarkAsSchedulable = (kind, obj) => ({
  label: 'Mark as Schedulable',
  hidden: !_.get(obj, 'spec.unschedulable', false),
  callback: () => makeNodeSchedulable(obj),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.path,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});

const { ModifyLabels, ModifyAnnotations, Edit } = Kebab.factory;
const menuActions = [MarkAsSchedulable, MarkAsUnschedulable, ModifyLabels, ModifyAnnotations, Edit];

const NodeKebab = ({node}) => <ResourceKebab actions={menuActions} kind="Node" resource={node} />;

const getMachine = (node: K8sResourceKind) => {
  const machine = _.get(node, 'metadata.annotations["machine.openshift.io/machine"]');
  if (!machine) {
    return null;
  }

  const [namespace, name] = machine.split('/');
  return { namespace, name };
};

export const NodeIPList = ({ips, expand = false}) => <div>
  {_.sortBy(ips, ['type']).map((ip, i) => ip.address && <div key={i} className="co-node-ip">
    {(expand || ip.type === 'InternalIP') && <p>
      <span className="co-ip-type">{ip.type.replace(/([a-z])([A-Z])/g, '$1 $2')}: </span>
      <span className="co-ip-addr">{ip.address}</span>
    </p>}
  </div>)}
</div>;

const tableColumnClasses = [
  classNames('col-md-5', 'col-sm-5', 'col-xs-8'),
  classNames('col-md-2', 'col-sm-3', 'col-xs-4'),
  classNames('col-md-2', 'col-sm-4', 'hidden-xs'),
  classNames('col-md-3', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const NodeTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Status', sortFunc: 'nodeReadiness', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Role', sortFunc: 'nodeRoles', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Machine', sortField: 'metadata.annotations[\'machine.openshift.io/machine\']', transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '', props: { className: tableColumnClasses[4] },
    },
  ];
};
NodeTableHeader.displayName = 'NodeTableHeader';

const NodeStatus = ({node}) => <StatusIconAndText status={nodeStatus(node)} />;

const NodeTableRow: React.FC<NodeTableRowProps> = ({obj: node, index, key, style}) => {
  const machine = getMachine(node);
  const roles = getNodeRoles(node).sort();
  return (
    <TableRow id={node.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind="Node" name={node.metadata.name} title={node.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <NodeStatus node={node} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {roles.length ? roles.join(', ') : '-'}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {machine && <ResourceLink kind={referenceForModel(MachineModel)} name={machine.name} namespace={machine.namespace} />}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <NodeKebab node={node} />
      </TableData>
    </TableRow>
  );
};
NodeTableRow.displayName = 'NodeTableRow';
type NodeTableRowProps = {
  obj: K8sResourceKind;
  index: number;
  key?: string;
  style: object;
};

const NodesList = props => <Table {...props} aria-label="Nodes" Header={NodeTableHeader} Row={NodeTableRow} virtualize />;

const filters = [{
  type: 'node-status',
  selected: ['Ready', 'Not Ready'],
  reducer: nodeStatus,
  items: [
    {id: 'Ready', title: 'Ready'},
    {id: 'Not Ready', title: 'Not Ready'},
  ],
}];
export const NodesPage = props => <ListPage {...props} ListComponent={NodesList} rowFilters={filters} />;

const NodeGraphs = requirePrometheus(({node}) => {
  const nodeIp = _.find<{type: string, address: string}>(node.status.addresses, {type: 'InternalIP'});
  const ipQuery = nodeIp && `{instance=~'.*${nodeIp.address}.*'}`;

  return <React.Fragment>
    <div className="row">
      <div className="col-md-4">
        <Area
          title="Memory Usage"
          formatY={humanizeDecimalBytes}
          query={ipQuery && `node_memory_Active_bytes${ipQuery}`}
        />
      </div>
      <div className="col-md-4">
        <Area
          title="CPU Usage"
          formatY={humanizeCpuCores}
          query={ipQuery && `instance:node_cpu:rate:sum${ipQuery}`}
        />
      </div>
      <div className="col-md-4">
        <Area
          title="Number of Pods"
          query={ipQuery && `kubelet_running_pod_count${ipQuery}`}
        />
      </div>
      <div className="col-md-4">
        <Area
          title="Network In"
          formatY={humanizeDecimalBytes}
          query={ipQuery && `instance:node_network_receive_bytes:rate:sum${ipQuery}`}
        />
      </div>
      <div className="col-md-4">
        <Area
          title="Network Out"
          formatY={humanizeDecimalBytes}
          query={ipQuery && `instance:node_network_transmit_bytes:rate:sum${ipQuery}`}
        />
      </div>
      <div className="col-md-4">
        <Area
          title="Filesystem"
          formatY={humanizeDecimalBytes}
          query={ipQuery && `instance:node_filesystem_usage:sum${ipQuery}`}
        />
      </div>
    </div>
    <br />
  </React.Fragment>;
});

const Details = ({obj: node}) => {
  const images = _.filter(node.status.images, 'names');
  const machine = getMachine(node);
  const canUpdate = useAccessReview({
    group: NodeModel.apiGroup,
    resource: NodeModel.path,
    verb: 'patch',
    name: node.metadata.name,
    namespace: node.metadata.namespace,
  });
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Node Overview" />
      <NodeGraphs node={node} />
      <div className="row">
        <div className="col-md-6 col-xs-12">
          <dl className="co-m-pane__details">
            <dt>Node Name</dt>
            <dd>{node.metadata.name || '-'}</dd>
            <dt>Status</dt>
            <dd><NodeStatus node={node} /></dd>
            <dt>External ID</dt>
            <dd>{_.get(node, 'spec.externalID', '-')}</dd>
            <dt>Node Addresses</dt>
            <dd><NodeIPList ips={_.get(node, 'status.addresses')} expand={true} /></dd>
            <dt>Node Labels</dt>
            <dd><LabelList kind="Node" labels={node.metadata.labels} /></dd>
            <dt>Taints</dt>
            <dd>
              {canUpdate
                ? <button type="button" className="btn btn-link co-modal-btn-link co-modal-btn-link--left" onClick={Kebab.factory.ModifyTaints(NodeModel, node).callback}>{pluralize(_.size(node.spec.taints), 'Taint')}</button>
                : pluralize(_.size(node.spec.taints), 'Taint')}
            </dd>
            <dt>Annotations</dt>
            <dd>
              {canUpdate
                ? <button type="button" className="btn btn-link co-modal-btn-link co-modal-btn-link--left" onClick={Kebab.factory.ModifyAnnotations(NodeModel, node).callback}>{pluralize(_.size(node.metadata.annotations), 'Annotation')}</button>
                : pluralize(_.size(node.metadata.annotations), 'Annotation')}
            </dd>
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
            <dt>OS Image</dt>
            <dd>{_.get(node, 'status.nodeInfo.osImage', '-')}</dd>
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
        <table className="table table--layout-fixed">
          <colgroup>
            <col className="col-sm-10 col-xs-9"></col>
            <col className="col-sm-2 col-xs-3"></col>
          </colgroup>
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            {_.map(images, (image, i) => <tr key={i}>
              <td className="co-break-all">{image.names.find(name => !name.includes('@')) || image.names[0]}</td>
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
