import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import {
  useExtensions,
  DashboardsOverviewHealthSubsystem,
  DashboardsOverviewHealthPrometheusSubsystem,
  isDashboardsOverviewHealthSubsystem,
  isDashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthURLSubsystem,
  isDashboardsOverviewHealthPrometheusSubsystem,
  isDashboardsOverviewHealthResourceSubsystem,
  isDashboardsOverviewHealthOperator,
} from '@console/plugin-sdk';
import { Gallery, GalleryItem, Button } from '@patternfly/react-core';
import { BlueArrowCircleUpIcon, FLAGS, getInfrastructurePlatform } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { withDashboardResources } from '../../with-dashboard-resources';
import AlertItem, {
  StatusItem,
} from '@console/shared/src/components/dashboard/status-card/AlertItem';
import { alertURL } from '../../../monitoring/utils';
import {
  ClusterVersionKind,
  referenceForModel,
  hasAvailableUpdates,
  K8sKind,
} from '../../../../module/k8s';
import { ClusterVersionModel } from '../../../../models';
import { clusterUpdateModal } from '../../../modals/cluster-update-modal';
import { RootState } from '../../../../redux';
import {
  OperatorHealthItem,
  PrometheusHealthItem,
  URLHealthItem,
  ResourceHealthItem,
} from './health-item';
import { WatchK8sResource, useK8sWatchResource } from '../../../utils/k8s-watch-hook';
import { useFlag } from '@console/shared/src/hooks/flag';
import { ClusterDashboardContext } from './context';
import { useAccessReview } from '../../../utils';

const filterSubsystems = (
  subsystems: DashboardsOverviewHealthSubsystem[],
  k8sModels: ImmutableMap<string, K8sKind>,
) =>
  subsystems.filter((s) => {
    if (
      isDashboardsOverviewHealthURLSubsystem(s) ||
      isDashboardsOverviewHealthPrometheusSubsystem(s)
    ) {
      const subsystem = s as
        | DashboardsOverviewHealthPrometheusSubsystem
        | DashboardsOverviewHealthURLSubsystem;
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

const ClusterAlerts = withDashboardResources(
  ({ watchAlerts, stopWatchAlerts, notificationAlerts }) => {
    const hasCVResource = useFlag(FLAGS.CLUSTER_VERSION);
    const [cv, cvLoaded] = useK8sWatchResource<ClusterVersionKind>(
      hasCVResource ? cvResource : ({} as WatchK8sResource),
    );
    React.useEffect(() => {
      watchAlerts();
      return stopWatchAlerts;
    }, [watchAlerts, stopWatchAlerts]);

    const { data: alerts, loaded: alertsLoaded, loadError: alertsResponseError } =
      notificationAlerts || {};

    const UpdateIcon = React.useCallback(() => <BlueArrowCircleUpIcon />, []);

    const items: React.ReactNode[] = [];

    const clusterVersionIsEditable = useAccessReview({
      group: ClusterVersionModel.apiGroup,
      resource: ClusterVersionModel.plural,
      verb: 'patch',
      name: 'version',
    });

    if (hasCVResource && cvLoaded && hasAvailableUpdates(cv) && clusterVersionIsEditable) {
      items.push(
        <StatusItem Icon={UpdateIcon} message="A cluster version update is available">
          <Button variant="link" onClick={() => clusterUpdateModal({ cv })} isInline>
            View details
          </Button>
        </StatusItem>,
      );
    }

    if (alertsLoaded && !_.isEmpty(alerts)) {
      items.push(
        ...alerts.map((alert) => <AlertItem key={alertURL(alert, alert.rule.id)} alert={alert} />),
      );
    }

    return <AlertsBody error={!_.isEmpty(alertsResponseError)}>{items}</AlertsBody>;
  },
);

const mapStateToProps = (state: RootState) => ({
  k8sModels: state.k8s.getIn(['RESOURCES', 'models']),
});

export const StatusCard = connect<StatusCardProps>(mapStateToProps)(({ k8sModels }) => {
  const subsystemExtensions = useExtensions<DashboardsOverviewHealthSubsystem>(
    isDashboardsOverviewHealthSubsystem,
  );

  const subsystems = React.useMemo(() => filterSubsystems(subsystemExtensions, k8sModels), [
    subsystemExtensions,
    k8sModels,
  ]);

  const operatorSubsystemIndex = React.useMemo(
    () => subsystems.findIndex(isDashboardsOverviewHealthOperator),
    [subsystems],
  );
  const { infrastructure, infrastructureLoaded } = React.useContext(ClusterDashboardContext);

  const healthItems: { title: string; Component: React.ReactNode }[] = [];
  subsystems.forEach((subsystem) => {
    if (isDashboardsOverviewHealthURLSubsystem(subsystem)) {
      healthItems.push({
        title: subsystem.properties.title,
        Component: <URLHealthItem subsystem={subsystem.properties} models={k8sModels} />,
      });
    } else if (isDashboardsOverviewHealthPrometheusSubsystem(subsystem)) {
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
    } else if (isDashboardsOverviewHealthResourceSubsystem(subsystem)) {
      healthItems.push({
        title: subsystem.properties.title,
        Component: <ResourceHealthItem subsystem={subsystem.properties} />,
      });
    }
  });
  if (operatorSubsystemIndex !== -1) {
    const operatorSubsystems = subsystems.filter(isDashboardsOverviewHealthOperator);
    healthItems.splice(operatorSubsystemIndex, 0, {
      title: 'Operators',
      Component: <OperatorHealthItem operatorExtensions={operatorSubsystems} />,
    });
  }

  return (
    <DashboardCard gradient data-test-id="status-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
        <DashboardCardLink to="/monitoring/alerts">View alerts</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <Gallery className="co-overview-status__health" hasGutter>
            {healthItems.map((item) => {
              return <GalleryItem key={item.title}>{item.Component}</GalleryItem>;
            })}
          </Gallery>
        </HealthBody>
        <ClusterAlerts />
      </DashboardCardBody>
    </DashboardCard>
  );
});

type StatusCardProps = {
  k8sModels: ImmutableMap<string, K8sKind>;
};
