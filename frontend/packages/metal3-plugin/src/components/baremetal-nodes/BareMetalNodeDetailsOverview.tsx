import * as React from 'react';
import { Button, pluralize } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import NodeIPList from '@console/app/src/components/nodes/NodeIPList';
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
import { NodeKind, referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import {
  getNodeMachineNameAndNamespace,
  getNodeAddresses,
  getName,
  getNamespace,
  DASH,
} from '@console/shared';
import { BareMetalHostModel } from '../../models';
import { bareMetalNodeStatus } from '../../status/baremetal-node-status';
import { BareMetalHostKind, CertificateSigningRequestKind } from '../../types';
import BareMetalNodeStatus from './BareMetalNodeStatus';

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
  const { t } = useTranslation();
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
      <SectionHeading text={t('metal3-plugin~Node Details')} />
      <div className="row">
        <div className="col-md-6 col-xs-12">
          <dl className="co-m-pane__details">
            <dt>{t('metal3-plugin~Node Name')}</dt>
            <dd>{node.metadata.name || DASH}</dd>
            <dt>{t('metal3-plugin~Status')}</dt>
            <dd>
              <BareMetalNodeStatus {...status} nodeMaintenance={nodeMaintenance} csr={csr} />
            </dd>
            <dt>{t('metal3-plugin~External ID')}</dt>
            <dd>{_.get(node, 'spec.externalID', DASH)}</dd>
            <dt>{t('metal3-plugin~Node Addresses')}</dt>
            <dd>
              <NodeIPList ips={getNodeAddresses(node)} expand />
            </dd>
            <dt>{t('metal3-plugin~Node Labels')}</dt>
            <dd>
              <LabelList kind="Node" labels={node.metadata.labels} />
            </dd>
            <dt>{t('metal3-plugin~Taints')}</dt>
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
            <dt>{t('metal3-plugin~Annotations')}</dt>
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
                <dt>{t('metal3-plugin~Machine')}</dt>
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
                <dt>{t('metal3-plugin~Bare Metal Host')}</dt>
                <dd>
                  <ResourceLink
                    kind={referenceForModel(BareMetalHostModel)}
                    name={getName(host)}
                    namespace={getNamespace(host)}
                  />
                </dd>
              </>
            )}
            <dt>{t('metal3-plugin~Provider ID')}</dt>
            <dd>{cloudProviderNames([cloudProviderID(node)])}</dd>
            {_.has(node, 'spec.unschedulable') && <dt>Unschedulable</dt>}
            {_.has(node, 'spec.unschedulable') && (
              <dd className="text-capitalize">
                {_.get(node, 'spec.unschedulable', DASH).toString()}
              </dd>
            )}
            <dt>{t('metal3-plugin~Created')}</dt>
            <dd>
              <Timestamp timestamp={node.metadata.creationTimestamp} />
            </dd>
          </dl>
        </div>
        <div className="col-md-6 col-xs-12">
          <dl className="co-m-pane__details">
            <dt>{t('metal3-plugin~Operating System')}</dt>
            <dd className="text-capitalize">
              {_.get(node, 'status.nodeInfo.operatingSystem', DASH)}
            </dd>
            <dt>{t('metal3-plugin~OS Image')}</dt>
            <dd>{_.get(node, 'status.nodeInfo.osImage', DASH)}</dd>
            <dt>{t('metal3-plugin~Architecture')}</dt>
            <dd className="text-uppercase">{_.get(node, 'status.nodeInfo.architecture', DASH)}</dd>
            <dt>{t('metal3-plugin~Kernel Version')}</dt>
            <dd>{_.get(node, 'status.nodeInfo.kernelVersion', DASH)}</dd>
            <dt>{t('metal3-plugin~Boot ID')}</dt>
            <dd>{_.get(node, 'status.nodeInfo.bootID', DASH)}</dd>
            <dt>{t('metal3-plugin~Container Runtime')}</dt>
            <dd>{_.get(node, 'status.nodeInfo.containerRuntimeVersion', DASH)}</dd>
            <dt>{t('metal3-plugin~Kubelet Version')}</dt>
            <dd>{_.get(node, 'status.nodeInfo.kubeletVersion', DASH)}</dd>
            <dt>{t('metal3-plugin~Kube-Proxy Version')}</dt>
            <dd>{_.get(node, 'status.nodeInfo.kubeProxyVersion', DASH)}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default BareMetalNodeDetailsOverview;
