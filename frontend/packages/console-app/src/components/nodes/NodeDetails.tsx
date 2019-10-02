import * as _ from 'lodash';
import * as React from 'react';
import { NodeKind, referenceForModel } from '@console/internal/module/k8s';
import {
  useAccessReview,
  SectionHeading,
  LabelList,
  Kebab,
  ResourceLink,
  cloudProviderNames,
  cloudProviderID,
  Timestamp,
  CamelCaseWrap,
  units,
} from '@console/internal/components/utils';
import { NodeModel, MachineModel } from '@console/internal/models';
import { Button, pluralize } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';
import { getNodeMachineNameAndNamespace, getNodeAddresses } from '@console/shared';
import NodeIPList from './NodeIPList';
import NodeStatus from './NodeStatus';
import NodeGraphs from './NodeGraphs';

type NodeDetailsProps = {
  obj: NodeKind;
};

const NodeDetails: React.FC<NodeDetailsProps> = ({ obj: node }) => {
  const images = _.filter(node.status.images, 'names');
  const machine = getNodeMachineNameAndNamespace(node);
  const canUpdate = useAccessReview({
    group: NodeModel.apiGroup,
    resource: NodeModel.plural,
    verb: 'patch',
    name: node.metadata.name,
    namespace: node.metadata.namespace,
  });
  return (
    <React.Fragment>
      <div className="co-m-pane__body">
        <SectionHeading text="Node Overview" />
        <NodeGraphs node={node} />
        <div className="row">
          <div className="col-md-6 col-xs-12">
            <dl className="co-m-pane__details">
              <dt>Node Name</dt>
              <dd>{node.metadata.name || '-'}</dd>
              <dt>Status</dt>
              <dd>
                <NodeStatus node={node} />
              </dd>
              <dt>External ID</dt>
              <dd>{_.get(node, 'spec.externalID', '-')}</dd>
              <dt>Node Addresses</dt>
              <dd>
                <NodeIPList ips={getNodeAddresses(node)} expand />
              </dd>
              <dt>Node Labels</dt>
              <dd>
                <LabelList kind="Node" labels={node.metadata.labels} />
              </dd>
              <dt>Taints</dt>
              <dd>
                {canUpdate ? (
                  <Button
                    variant="link"
                    type="button"
                    isInline
                    onClick={Kebab.factory.ModifyTaints(NodeModel, node).callback}
                  >
                    {pluralize(_.size(node.spec.taints), 'Taint')}
                    <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
                  </Button>
                ) : (
                  pluralize(_.size(node.spec.taints), 'Taint')
                )}
              </dd>
              <dt>Annotations</dt>
              <dd>
                {canUpdate ? (
                  <Button
                    variant="link"
                    type="button"
                    isInline
                    onClick={Kebab.factory.ModifyAnnotations(NodeModel, node).callback}
                  >
                    {pluralize(_.size(node.metadata.annotations), 'Annotation')}
                    <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
                  </Button>
                ) : (
                  pluralize(_.size(node.metadata.annotations), 'Annotation')
                )}
              </dd>
              {machine.name && (
                <React.Fragment>
                  <dt>Machine</dt>
                  <dd>
                    <ResourceLink
                      kind={referenceForModel(MachineModel)}
                      name={machine.name}
                      namespace={machine.namespace}
                    />
                  </dd>
                </React.Fragment>
              )}
              <dt>Provider ID</dt>
              <dd>{cloudProviderNames([cloudProviderID(node)])}</dd>
              {_.has(node, 'spec.unschedulable') && <dt>Unschedulable</dt>}
              {_.has(node, 'spec.unschedulable') && (
                <dd className="text-capitalize">
                  {_.get(node, 'spec.unschedulable', '-').toString()}
                </dd>
              )}
              <dt>Created</dt>
              <dd>
                <Timestamp timestamp={node.metadata.creationTimestamp} />
              </dd>
            </dl>
          </div>
          <div className="col-md-6 col-xs-12">
            <dl className="co-m-pane__details">
              <dt>Operating System</dt>
              <dd className="text-capitalize">
                {_.get(node, 'status.nodeInfo.operatingSystem', '-')}
              </dd>
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
              {_.map(node.status.conditions, (c, i) => (
                <tr key={i}>
                  <td>
                    <CamelCaseWrap value={c.type} />
                  </td>
                  <td>{c.status || '-'}</td>
                  <td>
                    <CamelCaseWrap value={c.reason} />
                  </td>
                  <td>
                    <Timestamp timestamp={c.lastHeartbeatTime} />
                  </td>
                  <td>
                    <Timestamp timestamp={c.lastTransitionTime} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="co-m-pane__body">
        <SectionHeading text="Images" />
        <div className="co-table-container">
          <table className="table table--layout-fixed">
            <colgroup>
              <col className="col-sm-10 col-xs-9" />
              <col className="col-sm-2 col-xs-3" />
            </colgroup>
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {_.map(images, (image, i) => (
                <tr key={i}>
                  <td className="co-break-all co-select-to-copy">
                    {image.names.find(
                      (name: string) => !name.includes('@') && !name.includes('<none>'),
                    ) || image.names[0]}
                  </td>
                  <td>{units.humanize(image.sizeBytes, 'binaryBytes', true).string || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </React.Fragment>
  );
};

export default NodeDetails;
