import type { ComponentType, FC } from 'react';
import { useMemo } from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks';
import { MachineDetails } from '@console/internal/components/machine';
import {
  MachineConfigPoolCharacteristics,
  MachineConfigPoolSummary,
} from '@console/internal/components/machine-config-pool';
import type { PageComponentProps } from '@console/internal/components/utils';
import { SectionHeading, WorkloadPausedAlert } from '@console/internal/components/utils';
import { MachineConfigPoolModel, MachineModel } from '@console/internal/models';
import type { MachineConfigPoolKind, MachineKind, NodeKind } from '@console/internal/module/k8s';
import { LabelSelector } from '@console/internal/module/k8s/label-selector';
import { getNodeMachineNameAndNamespace } from '@console/shared/src';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

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
      {machineLoadError ? (
        <div>{t('console-app~Error loading machine')}</div>
      ) : machineLoaded ? (
        machine ? (
          <MachineDetails obj={machine} hideConditions />
        ) : (
          <div>{t('console-app~Machine not found')}</div>
        )
      ) : (
        <SkeletonDetails />
      )}
      {machineConfigPoolsLoadError ? (
        <div>{t('console-app~Error loading machine config pool')}</div>
      ) : machineConfigPoolsLoaded ? (
        machineConfigPool ? (
          <PaneBody>
            {paused && (
              <WorkloadPausedAlert model={MachineConfigPoolModel} obj={machineConfigPool} />
            )}
            <Grid hasGutter>
              <GridItem sm={6}>
                <SectionHeading text={t('console-app~Configuration')} />
                <MachineConfigPoolSummary obj={machineConfigPool} />
              </GridItem>
              <GridItem sm={6}>
                <SectionHeading text={t('console-app~MachineConfigs')} />
                <MachineConfigPoolCharacteristics obj={machineConfigPool} />
              </GridItem>
            </Grid>
          </PaneBody>
        ) : (
          <div>{t('console-app~Machine config pool not found')}</div>
        )
      ) : (
        <SkeletonDetails />
      )}
    </>
  );
};

export default NodeMachine;
