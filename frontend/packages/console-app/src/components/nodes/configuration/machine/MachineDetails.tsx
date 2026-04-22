import type { FC } from 'react';
import {
  Alert,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import NodeIPList from '@console/app/src/components/nodes/NodeIPList';
import Status from '@console/dynamic-plugin-sdk/src/app/components/status/Status';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks';
import { DetailsItem, ResourceLink, SectionHeading } from '@console/internal/components/utils';
import { MachineModel } from '@console/internal/models';
import type { MachineKind, NodeKind } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  getMachineAddresses,
  getMachineInstanceType,
  getMachinePhase,
  getMachineRegion,
  getMachineRole,
  getMachineZone,
} from '@console/shared/src/selectors/machine';
import { getNodeMachineNameAndNamespace } from '@console/shared/src/selectors/node';

const SkeletonDetails: FC = () => (
  <div data-test="skeleton-detail-view" className="skeleton-detail-view">
    <div className="skeleton-detail-view--head" />
    <div className="skeleton-detail-view--grid">
      <div className="skeleton-detail-view--column">
        <div className="skeleton-detail-view--tile skeleton-detail-view--tile-plain" />
        <div className="skeleton-detail-view--tile skeleton-detail-view--tile-resource" />
        <div className="skeleton-detail-view--tile skeleton-detail-view--tile-labels" />
        <div className="skeleton-detail-view--tile skeleton-detail-view--tile-resource" />
      </div>
      <div className="skeleton-detail-view--column">
        <div className="skeleton-detail-view--tile skeleton-detail-view--tile-plain" />
        <div className="skeleton-detail-view--tile skeleton-detail-view--tile-plain" />
        <div className="skeleton-detail-view--tile skeleton-detail-view--tile-resource" />
        <div className="skeleton-detail-view--tile skeleton-detail-view--tile-plain" />
      </div>
    </div>
  </div>
);

type MachineDetailProps = {
  node: NodeKind;
};

const MachineDetails: FC<MachineDetailProps> = ({ node }) => {
  const { t } = useTranslation();
  const [machineName, machineNamespace] = getNodeMachineNameAndNamespace(node);
  const [machine, machineLoaded, machineLoadError] = useK8sWatchResource<MachineKind>(
    machineName && machineNamespace
      ? {
          groupVersionKind: {
            kind: MachineModel.kind,
            group: MachineModel.apiGroup,
            version: MachineModel.apiVersion,
          },
          name: machineName,
          namespace: machineNamespace,
        }
      : null,
  );

  const instanceType = machine && getMachineInstanceType(machine);
  const region = machine && getMachineRegion(machine);
  const zone = machine && getMachineZone(machine);

  return (
    <PaneBody>
      <SectionHeading text={t('console-app~Machine details')} />
      {machineLoadError ? (
        <Alert isInline variant="danger" title={t('console-app~Machine is not available')}>
          {machineLoadError.message || t('console-app~Unable to load Machine resources')}
        </Alert>
      ) : !machineLoaded ? (
        <SkeletonDetails />
      ) : !machine ? (
        <Content>{t('console-app~There is no machine associated with this node')}</Content>
      ) : (
        <Grid hasGutter>
          <GridItem sm={6}>
            <DescriptionList>
              <DetailsItem label={t('console-app~Name')} obj={machine}>
                <ResourceLink
                  groupVersionKind={getGroupVersionKindForResource(machine)}
                  name={machine.metadata.name}
                />
              </DetailsItem>
              <DetailsItem
                label={t('console-app~Namespace')}
                obj={machine}
                path="metadata.namespace"
              >
                <ResourceLink kind="Namespace" name={machine.metadata.namespace} namespace={null} />
              </DetailsItem>
            </DescriptionList>
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              <DetailsItem label={t('console-app~Phase')} obj={machine} path="status.phase">
                <Status status={getMachinePhase(machine)} />
              </DetailsItem>
              <DetailsItem
                label={t('console-app~Provider state')}
                obj={machine}
                path="status.providerStatus.instanceState"
              >
                {machine.status?.providerStatus?.instanceState}
              </DetailsItem>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('console-app~Machine role')}</DescriptionListTerm>
                <DescriptionListDescription>{getMachineRole(machine)}</DescriptionListDescription>
              </DescriptionListGroup>
              {instanceType && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('console-app~Instance type')}</DescriptionListTerm>
                  <DescriptionListDescription>{instanceType}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {region && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('console-app~Region')}</DescriptionListTerm>
                  <DescriptionListDescription>{region}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {zone && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('console-app~Availability zone')}</DescriptionListTerm>
                  <DescriptionListDescription>{zone}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>{t('console-app~Machine addresses')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <NodeIPList ips={getMachineAddresses(machine)} expand />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      )}
    </PaneBody>
  );
};

export default MachineDetails;
