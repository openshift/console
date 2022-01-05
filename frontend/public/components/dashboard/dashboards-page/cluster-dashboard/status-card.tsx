import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useExtensions,
  DashboardsOverviewHealthSubsystem,
  DashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewHealthOperator,
  isDashboardsOverviewHealthSubsystem,
  isDashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthURLSubsystem,
  isDashboardsOverviewHealthPrometheusSubsystem,
  isDashboardsOverviewHealthResourceSubsystem,
  isDashboardsOverviewHealthOperator,
} from '@console/plugin-sdk';
import {
  DashboardsOverviewHealthSubsystem as DynamicDashboardsOverviewHealthSubsystem,
  DashboardsOverviewHealthPrometheusSubsystem as DynamicDashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewHealthURLSubsystem as DynamicDashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthOperator as DynamicDashboardsOverviewHealthOperator,
  isDashboardsOverviewHealthSubsystem as isDynamicDashboardsOverviewHealthSubsystem,
  isDashboardsOverviewHealthURLSubsystem as isDynamicDashboardsOverviewHealthURLSubsystem,
  isDashboardsOverviewHealthPrometheusSubsystem as isDynamicDashboardsOverviewHealthPrometheusSubsystem,
  isResolvedDashboardsOverviewHealthURLSubsystem,
  isResolvedDashboardsOverviewHealthPrometheusSubsystem,
  isResolvedDashboardsOverviewHealthResourceSubsystem,
  isResolvedDashboardsOverviewHealthOperator,
  ResolvedExtension,
  useResolvedExtensions,
  WatchK8sResource,
} from '@console/dynamic-plugin-sdk';
import {
  Gallery,
  GalleryItem,
  Card,
  CardHeader,
  CardTitle,
  CardActions,
} from '@patternfly/react-core';
import { BlueArrowCircleUpIcon, FLAGS, getInfrastructurePlatform } from '@console/shared';

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
import { ClusterDashboardContext } from './context';
import { useAccessReview } from '../../../utils';
import { useNotificationAlerts } from '@console/shared/src/hooks/useNotificationAlerts';

const filterSubsystems = (
  subsystems: (
    | DashboardsOverviewHealthSubsystem
    | ResolvedExtension<DynamicDashboardsOverviewHealthSubsystem>
  )[],
  k8sModels: ImmutableMap<string, K8sKind>,
) =>
  subsystems.filter((s) => {
    if (
      isDashboardsOverviewHealthURLSubsystem(s) ||
      isDashboardsOverviewHealthPrometheusSubsystem(s) ||
      isDynamicDashboardsOverviewHealthURLSubsystem(s) ||
      isDynamicDashboardsOverviewHealthPrometheusSubsystem(s)
    ) {
      const subsystem = s as
        | DashboardsOverviewHealthPrometheusSubsystem
        | DashboardsOverviewHealthURLSubsystem
        | ResolvedExtension<DynamicDashboardsOverviewHealthPrometheusSubsystem>
        | ResolvedExtension<DynamicDashboardsOverviewHealthURLSubsystem>;
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

  const clusterVersionIsEditable =
    useAccessReview({
      group: ClusterVersionModel.apiGroup,
      resource: ClusterVersionModel.plural,
      verb: 'patch',
      name: 'version',
    }) && window.SERVER_FLAGS.branding !== 'dedicated';

  const showClusterUpdate =
    hasCVResource &&
    cvLoaded &&
    hasAvailableUpdates(cv) &&
    clusterVersionIsEditable &&
    !labelSelector;
  return (
    <AlertsBody error={!_.isEmpty(loadError)}>
      {showClusterUpdate && (
        <StatusItem
          key="clusterUpdate"
          Icon={BlueArrowCircleUpIcon}
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
  const subsystemExtensions = useExtensions<DashboardsOverviewHealthSubsystem>(
    isDashboardsOverviewHealthSubsystem,
  );
  const [dynamicSubsystemExtensions] = useResolvedExtensions<
    DynamicDashboardsOverviewHealthSubsystem
  >(isDynamicDashboardsOverviewHealthSubsystem);

  const subsystems = React.useMemo(() => {
    const filteredSubsystems = filterSubsystems(
      [...subsystemExtensions, ...dynamicSubsystemExtensions],
      k8sModels,
    );
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
  }, [subsystemExtensions, dynamicSubsystemExtensions, k8sModels]);

  const operatorSubsystemIndex = React.useMemo(
    () =>
      subsystems.findIndex(
        (e) =>
          isDashboardsOverviewHealthOperator(e) || isResolvedDashboardsOverviewHealthOperator(e),
      ),
    [subsystems],
  );
  const { infrastructure, infrastructureLoaded } = React.useContext(ClusterDashboardContext);
  const { t } = useTranslation();
  const healthItems: { title: string; Component: React.ReactNode }[] = [];
  subsystems.forEach((subsystem) => {
    if (
      isDashboardsOverviewHealthURLSubsystem(subsystem) ||
      isResolvedDashboardsOverviewHealthURLSubsystem(subsystem)
    ) {
      healthItems.push({
        title: subsystem.properties.title,
        Component: <URLHealthItem subsystem={subsystem.properties} models={k8sModels} />,
      });
    } else if (
      isDashboardsOverviewHealthPrometheusSubsystem(subsystem) ||
      isResolvedDashboardsOverviewHealthPrometheusSubsystem(subsystem)
    ) {
      const { disallowedProviders } = subsystem.properties;
      if (
        disallowedProviders?.length &&
        (!infrastructureLoaded ||
          disallowedProviders.includes(getInfrastructurePlatform(infrastructure)))
      ) {
        return;
      }
      healthItems.push({
        title: subsystem.properties.title,
        Component: <PrometheusHealthItem subsystem={subsystem.properties} models={k8sModels} />,
      });
    } else if (
      isDashboardsOverviewHealthResourceSubsystem(subsystem) ||
      isResolvedDashboardsOverviewHealthResourceSubsystem(subsystem)
    ) {
      healthItems.push({
        title: subsystem.properties.title,
        Component: <ResourceHealthItem subsystem={subsystem.properties} />,
      });
    }
  });

  if (operatorSubsystemIndex !== -1) {
    const operatorSubsystems: DashboardsOverviewHealthOperator['properties'][] = [];
    const dynamicOperatorSubsystems: ResolvedExtension<
      DynamicDashboardsOverviewHealthOperator
    >['properties'][] = [];
    subsystems.forEach((e) => {
      if (isResolvedDashboardsOverviewHealthOperator(e)) {
        dynamicOperatorSubsystems.push(e.properties);
      } else if (isDashboardsOverviewHealthOperator(e)) {
        operatorSubsystems.push(e.properties);
      }
    });
    healthItems.splice(operatorSubsystemIndex, 0, {
      title: 'Operators',
      Component: (
        <OperatorHealthItem
          operatorExtensions={operatorSubsystems}
          dynamicOperatorSubsystems={dynamicOperatorSubsystems}
        />
      ),
    });
  }

  return (
    <Card data-test-id="status-card" className="co-overview-card--gradient">
      <CardHeader>
        <CardTitle>{t('public~Status')}</CardTitle>
        <CardActions className="co-overview-card__actions">
          <Link to="/monitoring/alerts">{t('public~View alerts')}</Link>
        </CardActions>
      </CardHeader>
      <HealthBody>
        <Gallery className="co-overview-status__health" hasGutter>
          {healthItems.map((item) => {
            return <GalleryItem key={item.title}>{item.Component}</GalleryItem>;
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
