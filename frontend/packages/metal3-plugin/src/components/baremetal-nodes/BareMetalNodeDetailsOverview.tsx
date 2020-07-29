import * as _ from 'lodash';
import * as React from 'react';
import { NodeKind, referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
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
import { Button, pluralize } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';
import {
  getNodeMachineNameAndNamespace,
  getNodeAddresses,
  getName,
  getNamespace,
  DASH,
} from '@console/shared';
import NodeIPList from '@console/app/src/components/nodes/NodeIPList';
import { BareMetalHostModel } from '../../models';
import { BareMetalHostKind, CertificateSigningRequestKind } from '../../types';
import BareMetalNodeStatus from './BareMetalNodeStatus';
import { bareMetalNodeStatus } from '../../status/baremetal-node-status';

type BareMetalNodeDetailsOverview = {
  node: NodeKind;
  host: BareMetalHostKind;
  nodeMaintenance: K8sResourceKind;
  csr: CertificateSigningRequestKind;
};

const BareMetalNodeDetailsOverview: React.FC<BareMetalNodeDetailsOverview> = ({
  node,
  host,
  nodeMaintenance,
  csr,
}) => {
  const status = bareMetalNodeStatus({ node, nodeMaintenance, csr });
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
            <dd>{node.metadata.name || DASH}</dd>
            <dt>Status</dt>
            <dd>
              <BareMetalNodeStatus {...status} nodeMaintenance={nodeMaintenance} csr={csr} />
            </dd>
            <dt>External ID</dt>
            <dd>{_.get(node, 'spec.externalID', DASH)}</dd>
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
            {host && (
              <>
                <dt>Bare Metal Host</dt>
                <dd>
                  <ResourceLink
                    kind={referenceForModel(BareMetalHostModel)}
                    name={getName(host)}
                    namespace={getNamespace(host)}
                  />
                </dd>
              </>
            )}
            <dt>Provider ID</dt>
            <dd>{cloudProviderNames([cloudProviderID(node)])}</dd>
            {_.has(node, 'spec.unschedulable') && <dt>Unschedulable</dt>}
            {_.has(node, 'spec.unschedulable') && (
              <dd className="text-capitalize">
                {_.get(node, 'spec.unschedulable', DASH).toString()}
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
              {_.get(node, 'status.nodeInfo.operatingSystem', DASH)}
            </dd>
            <dt>OS Image</dt>
            <dd>{_.get(node, 'status.nodeInfo.osImage', DASH)}</dd>
            <dt>Architecture</dt>
            <dd className="text-uppercase">{_.get(node, 'status.nodeInfo.architecture', DASH)}</dd>
            <dt>Kernel Version</dt>
            <dd>{_.get(node, 'status.nodeInfo.kernelVersion', DASH)}</dd>
            <dt>Boot ID</dt>
            <dd>{_.get(node, 'status.nodeInfo.bootID', DASH)}</dd>
            <dt>Container Runtime</dt>
            <dd>{_.get(node, 'status.nodeInfo.containerRuntimeVersion', DASH)}</dd>
            <dt>Kubelet Version</dt>
            <dd>{_.get(node, 'status.nodeInfo.kubeletVersion', DASH)}</dd>
            <dt>Kube-Proxy Version</dt>
            <dd>{_.get(node, 'status.nodeInfo.kubeProxyVersion', DASH)}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default BareMetalNodeDetailsOverview;
