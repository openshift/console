import * as _ from 'lodash';
import * as React from 'react';
import { NodeKind, referenceForModel } from '@console/internal/module/k8s';
import { EditButton, getNodeMachineNameAndNamespace, getNodeAddresses } from '@console/shared';
import {
  useAccessReview,
  SectionHeading,
  LabelList,
  Kebab,
  ResourceLink,
  cloudProviderNames,
  cloudProviderID,
  Timestamp,
} from '@console/internal/components/utils';
import { NodeModel, MachineModel } from '@console/internal/models';
import { pluralize } from '@patternfly/react-core';

import NodeIPList from './NodeIPList';
import NodeStatus from './NodeStatus';

type NodeDetailsOverviewProps = {
  node: NodeKind;
};

const NodeDetailsOverview: React.FC<NodeDetailsOverviewProps> = ({ node }) => {
  const machine = getNodeMachineNameAndNamespace(node);
  const canUpdate = useAccessReview({
    group: NodeModel.apiGroup,
    resource: NodeModel.plural,
    verb: 'patch',
    name: node.metadata.name,
    namespace: node.metadata.namespace,
  });
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Node Details" />
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
            <dt>
              Node Labels
              <EditButton
                canEdit={canUpdate}
                ariaLabel="Edit Node Labels"
                onClick={Kebab.factory.ModifyLabels(NodeModel, node).callback}
              />
            </dt>
            <dd>
              <LabelList kind="Node" labels={node.metadata.labels} />
            </dd>
            <dt>
              Taints
              <EditButton
                canEdit={canUpdate}
                ariaLabel="Edit Taints"
                onClick={Kebab.factory.ModifyTaints(NodeModel, node).callback}
              />
            </dt>
            <dd>{pluralize(_.size(node.spec.taints), 'Taint')}</dd>
            <dt>
              Annotations
              <EditButton
                canEdit={canUpdate}
                ariaLabel="Edit Annotations"
                onClick={Kebab.factory.ModifyAnnotations(NodeModel, node).callback}
              />
            </dt>
            <dd>{pluralize(_.size(node.metadata.annotations), 'Annotation')}</dd>
            {machine.name && (
              <>
                <dt>Machine</dt>
                <dd>
                  <ResourceLink
                    kind={referenceForModel(MachineModel)}
                    name={machine.name}
                    namespace={machine.namespace}
                  />
                </dd>
              </>
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
  );
};

export default NodeDetailsOverview;
