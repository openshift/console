import type { ComponentType, FC } from 'react';
import { useMemo } from 'react';
import { Content, Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks';
import type { PageComponentProps } from '@console/internal/components/utils';
import { SectionHeading, WorkloadPausedAlert } from '@console/internal/components/utils';
import { MachineConfigPoolModel } from '@console/internal/models';
import type { MachineConfigPoolKind, NodeKind } from '@console/internal/module/k8s';
import { LabelSelector } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import BMCConfiguration from './BMCConfiguration';
import MachineConfigPoolCharacteristics from './MachineConfigPoolCharacteristics';
import MachineConfigPoolSummary from './MachineConfigPoolSummary';
import MachineDetails from './MachineDetails';

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
      <PaneBody>
        <SectionHeading text={t('console-app~Machine')} />
        <Content component="p">
          {t(
            'console-app~This section details the provisioning and configuration of the node, from the underlying machine, OS, and hardware specifications to the applied system-level configurations. Use this information to understand the origin of the node and how to configure it to run workloads.',
          )}
        </Content>
      </PaneBody>
      <PaneBody>
        <Grid hasGutter>
          <GridItem sm={6}>
            <MachineDetails node={obj} />
          </GridItem>
          <GridItem sm={6}>
            <BMCConfiguration node={obj} />
          </GridItem>
        </Grid>
      </PaneBody>
      {machineConfigPoolsLoaded ? (
        <PaneBody>
          {paused && <WorkloadPausedAlert model={MachineConfigPoolModel} obj={machineConfigPool} />}
          <Grid hasGutter>
            <GridItem sm={6}>
              <MachineConfigPoolSummary
                obj={machineConfigPool}
                loadError={machineConfigPoolsLoadError}
              />
            </GridItem>
            <GridItem sm={6}>
              {machineConfigPool && <MachineConfigPoolCharacteristics obj={machineConfigPool} />}
            </GridItem>
          </Grid>
        </PaneBody>
      ) : (
        <SkeletonDetails />
      )}
    </>
  );
};

export default NodeMachine;
