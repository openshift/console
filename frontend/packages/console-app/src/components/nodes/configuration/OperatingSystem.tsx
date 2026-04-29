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
import { MachineConfigPoolModel, NodeModel } from '@console/internal/models';
import type { MachineConfigPoolKind, NodeKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { LabelSelector } from '@console/internal/module/k8s/label-selector';
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

type MachineConfigPoolSummaryProps = {
  obj?: MachineConfigPoolKind;
  loadError?: any;
};

const MachineConfigPoolSummary: FC<MachineConfigPoolSummaryProps> = ({ obj, loadError }) => {
  const { t } = useTranslation();
  const maxUnavailable = obj?.spec?.maxUnavailable ?? 1;
  const machineConfigSelector = obj?.spec?.machineConfigSelector;

  return (
    <>
      <SectionHeading text={t('console-app~MachineConfigPool')} />
      {loadError ? (
        <Alert
          isInline
          variant="danger"
          title={t('console-app~MachineConfigPools are not available')}
        >
          {loadError.message || t('console-app~Unable to load MachineConfigPool resources')}
        </Alert>
      ) : !obj ? (
        <Alert
          variant="info"
          title={t('console-app~There is no MachineConfigPool associated with this node')}
        />
      ) : (
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
            <Selector kind={referenceForModel(NodeModel)} selector={obj?.spec?.nodeSelector} />
          </DetailsItem>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('console-app~MachineConfig selector')}</DescriptionListTerm>
            <DescriptionListDescription>
              <Selector kind={machineConfigReference} selector={machineConfigSelector} />
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      )}
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

const NodeMachine: ComponentType<PageComponentProps<NodeKind>> = ({ obj }) => {
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
