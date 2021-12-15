import * as React from 'react';
import {
  GalleryItem,
  Gallery,
  Card,
  CardHeader,
  CardTitle,
  CardActions,
} from '@patternfly/react-core';
import { Map as ImmutableMap } from 'immutable';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
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
  k8sModels: state.sdkK8s.getIn(['RESOURCES', 'models']),
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
      <Card className="co-overview-card--gradient" data-test-id="kv-overview-status-card">
        <CardHeader>
          <CardTitle>{t('kubevirt-plugin~Status')}</CardTitle>
          <CardActions className="co-overview-card__actions">
            <Link to="/monitoring/alerts">{t('kubevirt-plugin~View alerts')}</Link>
          </CardActions>
        </CardHeader>
        <HealthBody>
          <Gallery className="co-overview-status__health" hasGutter>
            {virtStatusItems.map((item) => {
              return <GalleryItem key={item.title}>{item.Component}</GalleryItem>;
            })}
          </Gallery>
        </HealthBody>
        <DashboardAlerts />
      </Card>
    );
  },
);

type VirtOverviewStatusCardProps = {
  k8sModels: ImmutableMap<string, K8sKind>;
};
