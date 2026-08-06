import type { FC, ReactNode } from 'react';
import { useMemo } from 'react';
import { Gallery, GalleryItem, Card, CardHeader, CardTitle } from '@patternfly/react-core';
import type { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import type {
  DashboardsOverviewHealthSubsystem,
  DashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthOperator,
  ResolvedExtension,
  WatchK8sResource,
} from '@console/dynamic-plugin-sdk';
import {
  isDashboardsOverviewHealthSubsystem,
  isDashboardsOverviewHealthURLSubsystem,
  isDashboardsOverviewHealthPrometheusSubsystem,
  isResolvedDashboardsOverviewHealthURLSubsystem,
  isResolvedDashboardsOverviewHealthPrometheusSubsystem,
  isResolvedDashboardsOverviewHealthResourceSubsystem,
  isResolvedDashboardsOverviewHealthOperator,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import AlertItem, {
  StatusItem,
} from '@console/shared/src/components/dashboard/status-card/AlertItem';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { BlueArrowCircleUpIcon } from '@console/shared/src/components/status/icons';
import { ALL_NAMESPACES_KEY, FLAGS } from '@console/shared/src/constants/common';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useCanClusterUpgrade } from '@console/shared/src/hooks/useCanClusterUpgrade';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import {
  useNamespacedNotificationAlerts,
  useNotificationAlerts,
} from '@console/shared/src/hooks/useNotificationAlerts';
import { ClusterVersionModel } from '../../../../models';
import type { ClusterVersionKind, K8sKind, ObjectMetadata } from '../../../../module/k8s';
import { referenceForModel, hasAvailableUpdates } from '../../../../module/k8s';
import type { RootState } from '../../../../redux';
import { alertURL } from '../../../monitoring/utils';
import { useK8sWatchResource } from '../../../utils/k8s-watch-hook';
import {
  OperatorHealthItem,
  PrometheusHealthItem,
  URLHealthItem,
  ResourceHealthItem,
} from './health-item';

const filterSubsystems = (
  subsystems: (
    DashboardsOverviewHealthSubsystem | ResolvedExtension<DashboardsOverviewHealthSubsystem>
  )[],
  k8sModels: ImmutableMap<string, K8sKind>,
) =>
  subsystems.filter((s) => {
    if (
      isDashboardsOverviewHealthURLSubsystem(s) ||
      isDashboardsOverviewHealthPrometheusSubsystem(s)
    ) {
      const subsystem = s as unknown as
        | ResolvedExtension<DashboardsOverviewHealthPrometheusSubsystem>
        | ResolvedExtension<DashboardsOverviewHealthURLSubsystem>;
      return subsystem.properties.additionalResource &&
        !subsystem.properties.additionalResource.optional
        ? !!k8sModels.get(subsystem.properties.additionalResource.kind)
        : true;
    }
    return true;
  });

const cvResource: WatchK8sResource = {
  kind: referenceForModel(ClusterVersionModel),
  namespaced: false,
  name: 'version',
  isList: false,
};

export const DashboardAlerts: FC<DashboardAlertsProps> = ({ labelSelector }) => {
  const { t } = useTranslation('public');
  const hasCVResource = useFlag(FLAGS.CLUSTER_VERSION);
  const [alerts, , loadError] = useNotificationAlerts(labelSelector);
  const [cv, cvLoaded] = useK8sWatchResource<ClusterVersionKind>(
    hasCVResource ? cvResource : ({} as WatchK8sResource),
  );
  const canUpgrade = useCanClusterUpgrade();

  const showClusterUpdate =
    canUpgrade && hasCVResource && cvLoaded && hasAvailableUpdates(cv) && !labelSelector;
  return (
    <AlertsBody error={!_.isEmpty(loadError)}>
      {showClusterUpdate && (
        <StatusItem
          key="clusterUpdate"
          Icon={() => <BlueArrowCircleUpIcon size="heading_2xl" />}
          message={t('A cluster version update is available')}
        >
          <Link to="/settings/cluster?showVersions">{t('Update cluster')}</Link>
        </StatusItem>
      )}
      {alerts.map((alert) => (
        <AlertItem key={alertURL(alert, alert.rule.id)} alert={alert} />
      ))}
    </AlertsBody>
  );
};

export const DashboardNamespacedAlerts: FC<DashboardNamespacedAlertsProps> = ({ namespace }) => {
  const [namespacedAlerts, , loadError] = useNamespacedNotificationAlerts(namespace);

  return (
    <AlertsBody error={!_.isEmpty(loadError)}>
      {namespacedAlerts.map((alert) => (
        <AlertItem key={alertURL(alert, alert.rule.id)} alert={alert} />
      ))}
    </AlertsBody>
  );
};

const mapStateToProps = (state: RootState) => ({
  k8sModels: state.k8s.getIn(['RESOURCES', 'models']),
});
export const StatusCard = connect<StatusCardProps>(mapStateToProps)(({ k8sModels }) => {
  const [subsystemExtensions] = useResolvedExtensions<DashboardsOverviewHealthSubsystem>(
    isDashboardsOverviewHealthSubsystem,
  );
  const [, setActiveNamespace] = useActiveNamespace();

  const subsystems = useMemo(
    () => filterSubsystems([...subsystemExtensions], k8sModels),
    [subsystemExtensions, k8sModels],
  );

  const operatorSubsystemIndex = useMemo(
    () => subsystems.findIndex((e) => isResolvedDashboardsOverviewHealthOperator(e)),
    [subsystems],
  );
  const { t } = useTranslation('public');
  const healthItems: { title: string; Component: ReactNode }[] = [];
  subsystems.forEach((subsystem) => {
    if (isResolvedDashboardsOverviewHealthURLSubsystem(subsystem)) {
      healthItems.push({
        title: subsystem.properties.title,
        Component: <URLHealthItem subsystem={subsystem.properties} models={k8sModels} />,
      });
    } else if (isResolvedDashboardsOverviewHealthPrometheusSubsystem(subsystem)) {
      const { disallowedControlPlaneTopology } = subsystem.properties;
      if (
        disallowedControlPlaneTopology?.length &&
        disallowedControlPlaneTopology.includes(window.SERVER_FLAGS.controlPlaneTopology)
      ) {
        return;
      }
      healthItems.push({
        title: subsystem.properties.title,
        Component: <PrometheusHealthItem subsystem={subsystem.properties} models={k8sModels} />,
      });
    } else if (isResolvedDashboardsOverviewHealthResourceSubsystem(subsystem)) {
      healthItems.push({
        title: subsystem.properties.title,
        Component: <ResourceHealthItem subsystem={subsystem.properties} />,
      });
    }
  });

  if (operatorSubsystemIndex !== -1) {
    const operatorSubsystems: ResolvedExtension<DashboardsOverviewHealthOperator>['properties'][] =
      [];
    subsystems.forEach((e) => {
      if (isResolvedDashboardsOverviewHealthOperator(e)) {
        operatorSubsystems.push(e.properties);
      }
    });
    healthItems.splice(operatorSubsystemIndex, 0, {
      title: 'Operators',
      Component: <OperatorHealthItem operatorSubsystems={operatorSubsystems} />,
    });
  }

  return (
    <Card data-test="status-card" data-test-id="status-card">
      <CardHeader
        actions={{
          actions: (
            <>
              <Link
                to="/monitoring/alerts"
                data-test="status-card-view-alerts"
                onClick={() => {
                  // Set all namespaces selection so alert list is unfiltered
                  setActiveNamespace(ALL_NAMESPACES_KEY);
                }}
              >
                {t('View alerts')}
              </Link>
            </>
          ),
          hasNoOffset: false,
          className: 'co-overview-card__actions',
        }}
      >
        <CardTitle>{t('Status')}</CardTitle>
      </CardHeader>
      <HealthBody>
        <Gallery className="co-overview-status__health" hasGutter>
          {healthItems.map((item) => (
            <GalleryItem key={item.title} data-test={item.title}>
              {item.Component}
            </GalleryItem>
          ))}
        </Gallery>
      </HealthBody>
      <DashboardAlerts />
    </Card>
  );
});

type StatusCardProps = {
  k8sModels: ImmutableMap<string, K8sKind>;
};

type DashboardAlertsProps = {
  labelSelector?: ObjectMetadata['labels'];
};

type DashboardNamespacedAlertsProps = {
  namespace: string;
};
