import type { ComponentType, FC } from 'react';
import { useMemo } from 'react';
import {
  Alert,
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
import { machineConfigReference } from '@console/internal/components/machine-config';
import type { PageComponentProps } from '@console/internal/components/utils';
import {
  Selector,
  DetailsItem,
  ResourceLink,
  SectionHeading,
  WorkloadPausedAlert,
} from '@console/internal/components/utils';
import { MachineConfigPoolModel, MachineModel } from '@console/internal/models';
import type { MachineConfigPoolKind, MachineKind, NodeKind } from '@console/internal/module/k8s';
import { LabelSelector } from '@console/internal/module/k8s/label-selector';
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

type MachineConfigPoolSummaryProps = {
  obj: MachineConfigPoolKind;
};

const MachineConfigPoolSummary: FC<MachineConfigPoolSummaryProps> = ({ obj }) => {
  const { t } = useTranslation();
  const maxUnavailable = obj?.spec?.maxUnavailable ?? 1;
  const machineConfigSelector = obj?.spec?.machineConfigSelector;

  return (
    <>
      <SectionHeading text={t('console-app~MachineConfigPool')} />
      <DescriptionList>
        <DetailsItem label={t('console-app~Name')} obj={obj}>
          <ResourceLink
            groupVersionKind={getGroupVersionKindForResource(obj)}
            name={obj.metadata.name}
          />
        </DetailsItem>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('console-app~Max unavailable machines')}</DescriptionListTerm>
          <DescriptionListDescription>{maxUnavailable}</DescriptionListDescription>
        </DescriptionListGroup>
        <DetailsItem label={t('console-app~Paused')} obj={obj} path={'spec.paused'}>
          {obj?.spec?.paused ? t('console-app~True') : t('console-app~False')}
        </DetailsItem>
        <DetailsItem label={t('console-app~Node selector')} obj={obj} path="spec.nodeSelector">
          <Selector kind={t('console-app~Node')} selector={obj?.spec?.nodeSelector} />
        </DetailsItem>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('console-app~MachineConfig selector')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Selector kind={machineConfigReference} selector={machineConfigSelector} />
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </>
  );
};

type MachineConfigPoolCharacteristicsProps = {
  obj: MachineConfigPoolKind;
};

const MachineConfigPoolCharacteristics: FC<MachineConfigPoolCharacteristicsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const configuration = obj?.status?.configuration;

  return (
    <DescriptionList>
      {configuration && (
        <>
          <SectionHeading text={t('console-app~MachineConfigs')} />
          <DescriptionListGroup>
            <DescriptionListTerm>{t('console-app~Current configuration')}</DescriptionListTerm>
            <DescriptionListDescription>
              {configuration.name ? (
                <ResourceLink
                  kind={machineConfigReference}
                  name={configuration.name}
                  title={configuration.name}
                />
              ) : (
                '-'
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t('console-app~Current configuration source')}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {configuration.source
                ? configuration.source.map((nextSource) => (
                    <ResourceLink
                      key={`${nextSource.apiVersion}-${nextSource.kind}-${nextSource.name}`}
                      kind={machineConfigReference}
                      name={nextSource.name}
                      title={nextSource.name}
                    />
                  ))
                : '-'}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </>
      )}
    </DescriptionList>
  );
};

export type MachineDetailsProps = {
  obj: MachineKind;
};

const MachineDetails: FC<MachineDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const machineRole = getMachineRole(obj);
  const instanceType = getMachineInstanceType(obj);
  const region = getMachineRegion(obj);
  const zone = getMachineZone(obj);

  if (!obj) {
    return null;
  }

  return (
    <>
      <PaneBody>
        <SectionHeading text={t('console-app~Machine details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <DescriptionList>
              <DetailsItem label={t('console-app~Name')} obj={obj}>
                <ResourceLink
                  groupVersionKind={getGroupVersionKindForResource(obj)}
                  name={obj.metadata.name}
                />
              </DetailsItem>
              <DetailsItem label={t('console-app~Namespace')} obj={obj} path="metadata.namespace">
                <ResourceLink
                  kind="Namespace"
                  name={obj.metadata.namespace}
                  title={obj.metadata.uid}
                  namespace={null}
                />
              </DetailsItem>
            </DescriptionList>
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              <DetailsItem label={t('console-app~Phase')} obj={obj} path="status.phase">
                <Status status={getMachinePhase(obj)} />
              </DetailsItem>
              <DetailsItem
                label={t('console-app~Provider state')}
                obj={obj}
                path="status.providerStatus.instanceState"
              >
                {obj.status?.providerStatus?.instanceState}
              </DetailsItem>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('console-app~Machine role')}</DescriptionListTerm>
                <DescriptionListDescription>{machineRole}</DescriptionListDescription>
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
                  <NodeIPList ips={getMachineAddresses(obj)} expand />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
    </>
  );
};

const NodeMachine: ComponentType<PageComponentProps<NodeKind>> = ({ obj }) => {
  const { t } = useTranslation();
  const [machineName, machineNamespace] = getNodeMachineNameAndNamespace(obj);
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

  const [
    machineConfigPools,
    machineConfigPoolsLoaded,
    machineConfigPoolsLoadError,
  ] = useK8sWatchResource<MachineConfigPoolKind[]>({
    groupVersionKind: {
      kind: MachineConfigPoolModel.kind,
      group: MachineConfigPoolModel.apiGroup,
      version: MachineConfigPoolModel.apiVersion,
    },
    isList: true,
  });

  const machineConfigPool = useMemo(() => {
    if (!machineConfigPoolsLoaded || !machineConfigPools?.length) {
      return undefined;
    }
    return machineConfigPools.find((mcp) => {
      if (!mcp.spec?.nodeSelector) {
        return false;
      }
      const labelSelector = new LabelSelector(mcp.spec.nodeSelector);
      return labelSelector.matches(obj);
    });
  }, [machineConfigPools, machineConfigPoolsLoaded, obj]);

  const paused = machineConfigPool?.spec?.paused;

  return (
    <>
      {machineConfigPoolsLoadError ? (
        <div>{t('console-app~Error loading machine config pool')}</div>
      ) : machineConfigPoolsLoaded ? (
        <PaneBody>
          {paused && <WorkloadPausedAlert model={MachineConfigPoolModel} obj={machineConfigPool} />}
          <Grid hasGutter>
            <GridItem sm={6}>
              {machineConfigPool && <MachineConfigPoolSummary obj={machineConfigPool} />}
            </GridItem>
            <GridItem sm={6}>
              {machineConfigPool && <MachineConfigPoolCharacteristics obj={machineConfigPool} />}
            </GridItem>
          </Grid>
          {!machineConfigPool ? (
            <Alert
              variant="info"
              title={t('console-app~There is no MachineConfigPool associated with this node')}
            />
          ) : null}
        </PaneBody>
      ) : (
        <SkeletonDetails />
      )}
      {machineLoadError ? (
        <div>{t('console-app~Error loading machine')}</div>
      ) : machineLoaded ? (
        machine ? (
          <MachineDetails obj={machine} />
        ) : (
          <PaneBody>
            <SectionHeading text={t('console-app~Machine details')} />
            <div>{t('console-app~There is no machine associated with this node')}</div>
          </PaneBody>
        )
      ) : (
        <SkeletonDetails />
      )}
    </>
  );
};

export default NodeMachine;
