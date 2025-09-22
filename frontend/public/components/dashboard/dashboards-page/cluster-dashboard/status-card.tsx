import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import { Link } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import {
  DashboardsOverviewHealthSubsystem,
  DashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthOperator,
  isDashboardsOverviewHealthSubsystem,
  isDashboardsOverviewHealthURLSubsystem,
  isDashboardsOverviewHealthPrometheusSubsystem,
  isResolvedDashboardsOverviewHealthURLSubsystem,
  isResolvedDashboardsOverviewHealthPrometheusSubsystem,
  isResolvedDashboardsOverviewHealthResourceSubsystem,
  isResolvedDashboardsOverviewHealthOperator,
  ResolvedExtension,
  useResolvedExtensions,
  WatchK8sResource,
} from '@console/dynamic-plugin-sdk';
import { Gallery, GalleryItem, Card, CardHeader, CardTitle } from '@patternfly/react-core';
import { BlueArrowCircleUpIcon, FLAGS, useCanClusterUpgrade } from '@console/shared';

import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import AlertItem, {
  StatusItem,
} from '@console/shared/src/components/dashboard/status-card/AlertItem';
import { alertURL } from '../../../monitoring/utils';
import {
  ClusterVersionKind,
  referenceForModel,
  hasAvailableUpdates,
  K8sKind,
  ObjectMetadata,
} from '../../../../module/k8s';
import { ClusterVersionModel } from '../../../../models';
import { RootState } from '../../../../redux';
import {
  OperatorHealthItem,
  PrometheusHealthItem,
  URLHealthItem,
  ResourceHealthItem,
} from './health-item';
import { useK8sWatchResource } from '../../../utils/k8s-watch-hook';
import { useFlag } from '@console/shared/src/hooks/flag';
import { useNotificationAlerts } from '@console/shared/src/hooks/useNotificationAlerts';

const filterSubsystems = (
  subsystems: (
    | DashboardsOverviewHealthSubsystem
    | ResolvedExtension<DashboardsOverviewHealthSubsystem>
  )[],
  k8sModels: ImmutableMap<string, K8sKind>,
) =>
  subsystems.filter((s) => {
    if (
      isDashboardsOverviewHealthURLSubsystem(s) ||
      isDashboardsOverviewHealthPrometheusSubsystem(s)
    ) {
      const subsystem = (s as unknown) as
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

export const DashboardAlerts: React.FC<DashboardAlertsProps> = ({ labelSelector }) => {
  const { t } = useTranslation();
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
          message={t('public~A cluster version update is available')}
        >
          <Link to="/settings/cluster?showVersions">{t('public~Update cluster')}</Link>
        </StatusItem>
      )}
      {alerts.map((alert) => (
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

  const subsystems = React.useMemo(() => {
    const filteredSubsystems = filterSubsystems([...subsystemExtensions], k8sModels);
    return filteredSubsystems.map((e) => {
      if (
        isResolvedDashboardsOverviewHealthURLSubsystem(e) ||
        isResolvedDashboardsOverviewHealthPrometheusSubsystem(e) ||
        isResolvedDashboardsOverviewHealthResourceSubsystem(e)
      ) {
        const popup = e.properties.popupComponent
          ? { popupComponent: () => Promise.resolve(e.properties.popupComponent) }
          : {};
        return {
          ...e,
          properties: {
            ...e.properties,
            ...popup,
          },
        };
      }
      return e;
    });
  }, [subsystemExtensions, k8sModels]);

  const operatorSubsystemIndex = React.useMemo(
    () => subsystems.findIndex((e) => isResolvedDashboardsOverviewHealthOperator(e)),
    [subsystems],
  );
  const { t } = useTranslation();
  const healthItems: { title: string; Component: React.ReactNode }[] = [];
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
    const operatorSubsystems: ResolvedExtension<
      DashboardsOverviewHealthOperator
    >['properties'][] = [];
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
    <Card data-test-id="status-card">
      <CardHeader
        actions={{
          actions: (
            <>
              <Link to="/monitoring/alerts" data-test="status-card-view-alerts">
                {t('public~View alerts')}
              </Link>
            </>
          ),
          hasNoOffset: false,
          className: 'co-overview-card__actions',
        }}
      >
        <CardTitle>{t('public~Status')}</CardTitle>
      </CardHeader>
      <HealthBody>
        <Gallery className="co-overview-status__health" hasGutter>
          {healthItems.map((item) => {
            return (
              <GalleryItem key={item.title} data-test={item.title}>
                {item.Component}
              </GalleryItem>
            );
          })}
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
