import * as React from 'react';
import { GalleryItem, Gallery } from '@patternfly/react-core';
import { Map as ImmutableMap } from 'immutable';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import {
  isDashboardsOverviewHealthSubsystem as isDynamicDashboardsOverviewHealthSubsystem,
  DashboardsOverviewHealthSubsystem as DynamicDashboardsOverviewHealthSubsystem,
  useResolvedExtensions,
  DashboardsOverviewHealthURLSubsystem as DynamicDashboardsOverviewHealthURLSubsystem,
  isDashboardsOverviewHealthURLSubsystem as isDynamicDashboardsOverviewHealthURLSubsystem,
  ResolvedExtension,
  isResolvedDashboardsOverviewHealthURLSubsystem,
} from '@console/dynamic-plugin-sdk';
import { URLHealthItem } from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/health-item';
import { DashboardAlerts } from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/status-card';
import { FirehoseResource } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  K8sKind,
  HealthState,
  referenceForModel,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { NetworkAddonsConfigModel } from '../../models';

export const NetworkAddonsConfigResource: FirehoseResource = {
  kind: referenceForModel(NetworkAddonsConfigModel),
  namespaced: false,
  isList: true,
  prop: 'networkAddonsConfig',
};

const CLUSTER = 'cluster';
const AVAILABLE = 'Available';
const VIRTUALIZATION = 'Virtualization';

const getClusterNAC = (nacList) => nacList?.find((nac) => nac?.metadata?.name === CLUSTER);

const filterSubsystems = (
  subsystems: ResolvedExtension<DynamicDashboardsOverviewHealthSubsystem>[],
  k8sModels: ImmutableMap<string, K8sKind>,
) =>
  subsystems.filter((s) => {
    if (isDynamicDashboardsOverviewHealthURLSubsystem(s)) {
      const subsystem = (s as unknown) as ResolvedExtension<
        DynamicDashboardsOverviewHealthURLSubsystem
      >;
      return subsystem.properties.additionalResource &&
        !subsystem.properties.additionalResource.optional
        ? !!k8sModels.get(subsystem.properties.additionalResource.kind)
        : true;
    }
    return true;
  });

const NetworkingHealthItem = ({ nac }) => {
  const nacConditions = nac?.status?.conditions;

  const findAvailableCondition = (conditions) =>
    conditions?.find((cond) => cond?.type === AVAILABLE);
  const availableCondition = findAvailableCondition(nacConditions);
  const status = availableCondition?.status === true;
  const message = availableCondition?.message;
  const state = status ? HealthState.OK : HealthState.NOT_AVAILABLE;

  return <HealthItem title="Networking" state={state} details={message} />;
};

const mapStateToProps = (state: RootState) => ({
  k8sModels: state.k8s.getIn(['RESOURCES', 'models']),
});

export const VirtOverviewStatusCard = connect<VirtOverviewStatusCardProps>(mapStateToProps)(
  ({ k8sModels }) => {
    const { t } = useTranslation();

    const [dynamicSubsystemExtensions] = useResolvedExtensions<
      DynamicDashboardsOverviewHealthSubsystem
    >(isDynamicDashboardsOverviewHealthSubsystem);

    const subsystems = React.useMemo(
      () => filterSubsystems(dynamicSubsystemExtensions, k8sModels),
      [dynamicSubsystemExtensions, k8sModels],
    );

    const [networkAddonsConfigList] = useK8sWatchResource<K8sResourceKind[]>(
      NetworkAddonsConfigResource,
    );
    const clusterNAC = getClusterNAC(networkAddonsConfigList);

    const virtStatusItems: { title: string; Component: React.ReactNode }[] = [];
    subsystems.forEach((subsystem) => {
      if (
        isResolvedDashboardsOverviewHealthURLSubsystem(subsystem) &&
        subsystem?.properties?.title === VIRTUALIZATION
      ) {
        virtStatusItems.push({
          title: t('kubevirt-plugin~Virtualization'),
          Component: <URLHealthItem subsystem={subsystem.properties} models={k8sModels} />,
        });
      }
    });

    virtStatusItems.push({
      title: t('kubevirt-plugin~Networking'),
      Component: <NetworkingHealthItem nac={clusterNAC} />,
    });

    return (
      <DashboardCard gradient data-test-id="kv-overview-status-card">
        <DashboardCardHeader>
          <DashboardCardTitle>{t('kubevirt-plugin~Status')}</DashboardCardTitle>
          <DashboardCardLink to="/monitoring/alerts">
            {t('kubevirt-plugin~View alerts')}
          </DashboardCardLink>
        </DashboardCardHeader>
        <DashboardCardBody>
          <HealthBody>
            <Gallery className="co-overview-status__health" hasGutter>
              {virtStatusItems.map((item) => {
                return <GalleryItem key={item.title}>{item.Component}</GalleryItem>;
              })}
            </Gallery>
          </HealthBody>
          <DashboardAlerts />
        </DashboardCardBody>
      </DashboardCard>
    );
  },
);

type VirtOverviewStatusCardProps = {
  k8sModels: ImmutableMap<string, K8sKind>;
};
