import * as React from 'react';
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
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
import { DetailsItem } from '@console/internal/components/utils/details-item';
import { NodeModel, MachineModel } from '@console/internal/models';
import { NodeKind, referenceForModel } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { useLabelsModal } from '@console/shared/src/hooks/useLabelsModal';
import {
  getNodeMachineNameAndNamespace,
  getNodeAddresses,
} from '@console/shared/src/selectors/node';
import NodeUptime from './node-dashboard/NodeUptime';
import NodeIPList from './NodeIPList';
import NodeStatus from './NodeStatus';

type NodeDetailsOverviewProps = {
  node: NodeKind;
};

const NodeDetailsOverview: React.FC<NodeDetailsOverviewProps> = ({ node }) => {
  const launchLabelsModal = useLabelsModal(node);
  const [machineName, machineNamespace] = getNodeMachineNameAndNamespace(node);
  const canUpdate = useAccessReview({
    group: NodeModel.apiGroup,
    resource: NodeModel.plural,
    verb: 'patch',
    name: node.metadata.name,
    namespace: node.metadata.namespace,
  });
  const { t } = useTranslation();

  return (
    <PaneBody>
      <SectionHeading text={t('console-app~Node details')} />
      <div className="row">
        <div className="col-md-6 col-xs-12">
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Node name')}</DescriptionListTerm>
              <DescriptionListDescription>{node.metadata.name || '-'}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Status')}</DescriptionListTerm>
              <DescriptionListDescription>
                <NodeStatus node={node} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~External ID')}</DescriptionListTerm>
              <DescriptionListDescription>
                {_.get(node, 'spec.externalID', '-')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Uptime')}</DescriptionListTerm>
              <DescriptionListDescription>
                <NodeUptime obj={node} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Node addresses')}</DescriptionListTerm>
              <DescriptionListDescription>
                <NodeIPList ips={getNodeAddresses(node)} expand />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DetailsItem
              label={t('console-app~Labels')}
              obj={node}
              path="metadata.labels"
              onEdit={launchLabelsModal}
              canEdit={canUpdate}
              editAsGroup
            >
              <LabelList kind="Node" labels={node.metadata.labels} />
            </DetailsItem>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Taints')}</DescriptionListTerm>
              <DescriptionListDescription>
                {canUpdate ? (
                  <Button
                    icon={<PencilAltIcon />}
                    iconPosition="end"
                    variant="link"
                    type="button"
                    isInline
                    onClick={Kebab.factory.ModifyTaints(NodeModel, node).callback}
                  >
                    {_.size(node.spec.taints)}{' '}
                    {t('console-app~Taint', { count: _.size(node.spec.taints) })}
                  </Button>
                ) : (
                  <span>
                    {_.size(node.spec.taints)}{' '}
                    {t('console-app~Taint', { count: _.size(node.spec.taints) })}
                  </span>
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Annotations')}</DescriptionListTerm>
              <DescriptionListDescription>
                {canUpdate ? (
                  <Button
                    icon={<PencilAltIcon />}
                    iconPosition="end"
                    variant="link"
                    type="button"
                    isInline
                    onClick={Kebab.factory.ModifyAnnotations(NodeModel, node).callback}
                  >
                    {_.size(node.metadata.annotations)}{' '}
                    {t('console-app~Annotation', { count: _.size(node.metadata.annotations) })}
                  </Button>
                ) : (
                  <span>
                    {_.size(node.metadata.annotations)}{' '}
                    {t('console-app~Annotation', { count: _.size(node.metadata.annotations) })}
                  </span>
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            {machineName && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('console-app~Machine')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <ResourceLink
                    kind={referenceForModel(MachineModel)}
                    name={machineName}
                    namespace={machineNamespace}
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Provider ID')}</DescriptionListTerm>
              <DescriptionListDescription>
                {cloudProviderNames([cloudProviderID(node)])}
              </DescriptionListDescription>
            </DescriptionListGroup>
            {_.has(node, 'spec.unschedulable') && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('console-app~Unschedulable')}</DescriptionListTerm>
                <DescriptionListDescription className="text-capitalize">
                  {_.get(node, 'spec.unschedulable', '-').toString()}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Created')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Timestamp timestamp={node.metadata.creationTimestamp} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </div>
        <div className="col-md-6 col-xs-12">
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Operating system')}</DescriptionListTerm>
              <DescriptionListDescription className="text-capitalize">
                {_.get(node, 'status.nodeInfo.operatingSystem', '-')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~OS image')}</DescriptionListTerm>
              <DescriptionListDescription>
                {_.get(node, 'status.nodeInfo.osImage', '-')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Architecture')}</DescriptionListTerm>
              <DescriptionListDescription>
                {_.get(node, 'status.nodeInfo.architecture', '-')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Kernel version')}</DescriptionListTerm>
              <DescriptionListDescription>
                {_.get(node, 'status.nodeInfo.kernelVersion', '-')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Boot ID')}</DescriptionListTerm>
              <DescriptionListDescription>
                {_.get(node, 'status.nodeInfo.bootID', '-')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Container runtime')}</DescriptionListTerm>
              <DescriptionListDescription>
                {_.get(node, 'status.nodeInfo.containerRuntimeVersion', '-')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Kubelet version')}</DescriptionListTerm>
              <DescriptionListDescription>
                {_.get(node, 'status.nodeInfo.kubeletVersion', '-')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Kube-Proxy version')}</DescriptionListTerm>
              <DescriptionListDescription>
                {_.get(node, 'status.nodeInfo.kubeProxyVersion', '-')}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </div>
      </div>
    </PaneBody>
  );
};

export default NodeDetailsOverview;
