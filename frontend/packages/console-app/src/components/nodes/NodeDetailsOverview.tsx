import type { FC } from 'react';
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  cloudProviderNames,
  cloudProviderID,
} from '@console/internal/components/utils/cloud-provider';
import { DetailsItem } from '@console/internal/components/utils/details-item';
import { SectionHeading } from '@console/internal/components/utils/headings';
import { LabelList } from '@console/internal/components/utils/label-list';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { NodeModel, MachineModel } from '@console/internal/models';
import type { NodeKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { useLabelsModal } from '@console/shared/src/hooks/useLabelsModal';
import {
  getNodeMachineNameAndNamespace,
  getNodeAddresses,
} from '@console/shared/src/selectors/node';
import { CommonActionCreator } from '../../actions/hooks/types';
import { useCommonActions } from '../../actions/hooks/useCommonActions';
import NodeUptime from './node-dashboard/NodeUptime';
import NodeIPList from './NodeIPList';
import NodeStatus from './NodeStatus';

type NodeDetailsOverviewProps = {
  node: NodeKind;
};

const NodeDetailsOverview: FC<NodeDetailsOverviewProps> = ({ node }) => {
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
  const [modifyTaints] = useCommonActions(NodeModel, node, [CommonActionCreator.ModifyTaints]);
  const [modifyAnnotations] = useCommonActions(NodeModel, node, [
    CommonActionCreator.ModifyAnnotations,
  ]);

  return (
    <PaneBody>
      <SectionHeading text={t('console-app~Node details')} />
      <Grid hasGutter>
        <GridItem md={6}>
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
                    onClick={() => {
                      const action = modifyTaints[CommonActionCreator.ModifyTaints]?.cta;
                      if (typeof action === 'function') {
                        action();
                      }
                    }}
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
                    onClick={() => {
                      const action = modifyAnnotations[CommonActionCreator.ModifyAnnotations]?.cta;
                      if (typeof action === 'function') {
                        action();
                      }
                    }}
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
        </GridItem>
        <GridItem md={6}>
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
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export default NodeDetailsOverview;
