import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import {
  isDashboardsOverviewHealthSubsystem,
  isDashboardsOverviewHealthURLSubsystem,
  isDashboardsOverviewHealthPrometheusSubsystem,
  isDashboardsOverviewHealthOperator,
} from '@console/plugin-sdk';
import { ArrowCircleUpIcon } from '@patternfly/react-icons';
import { Gallery, GalleryItem, Button } from '@patternfly/react-core';
import { FLAGS } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { withDashboardResources, DashboardItemProps } from '../../with-dashboard-resources';
import AlertItem, {
  StatusItem,
} from '@console/shared/src/components/dashboard/status-card/AlertItem';
import {
  connectToFlags,
  FlagsObject,
  WithFlagsProps,
  flagPending,
} from '../../../../reducers/features';
import * as plugins from '../../../../plugins';
import { FirehoseResource } from '../../../utils';
import { alertURL } from '../../../monitoring';
import {
  ClusterVersionKind,
  referenceForModel,
  hasAvailableUpdates,
  K8sKind,
} from '../../../../module/k8s';
import { ClusterVersionModel } from '../../../../models';
import { clusterUpdateModal } from '../../../modals/cluster-update-modal';
import { RootState } from '../../../../redux';
import { OperatorHealthItem, PrometheusHealthItem, URLHealthItem } from './health-item';

const getSubsystems = (flags: FlagsObject, k8sModels: ImmutableMap<string, K8sKind>) =>
  plugins.registry.getDashboardsOverviewHealthSubsystems().filter((e) => {
    if (!plugins.registry.isExtensionInUse(e, flags)) {
      return false;
    }
    if (
      isDashboardsOverviewHealthPrometheusSubsystem(e) ||
      isDashboardsOverviewHealthURLSubsystem(e)
    ) {
      return e.properties.additionalResource && !e.properties.additionalResource.optional
        ? !!k8sModels.get(e.properties.additionalResource.kind)
        : true;
    }
    return true;
  });

const cvResource: FirehoseResource = {
  kind: referenceForModel(ClusterVersionModel),
  namespaced: false,
  name: 'version',
  isList: false,
  prop: 'cv',
};

const ClusterAlerts = connectToFlags(FLAGS.CLUSTER_VERSION)(
  withDashboardResources<WithFlagsProps & DashboardItemProps>(
    ({
      watchAlerts,
      stopWatchAlerts,
      notificationAlerts,
      watchK8sResource,
      stopWatchK8sResource,
      resources,
      flags,
    }) => {
      const hasCVResource = flags[FLAGS.CLUSTER_VERSION];
      React.useEffect(() => {
        watchAlerts();
        if (hasCVResource) {
          watchK8sResource(cvResource);
        }
        return () => {
          stopWatchAlerts();
          if (hasCVResource) {
            stopWatchK8sResource(cvResource);
          }
        };
      }, [watchAlerts, stopWatchAlerts, watchK8sResource, stopWatchK8sResource, hasCVResource]);

      const { data: alerts, loaded: alertsLoaded, loadError: alertsResponseError } =
        notificationAlerts || {};

      const cv = _.get(resources.cv, 'data') as ClusterVersionKind;
      const cvLoaded = _.get(resources.cv, 'loaded');
      const cvError = resources.cv?.loadError;
      const LinkComponent = React.useCallback(
        () => (
          <Button variant="link" onClick={() => clusterUpdateModal({ cv })} isInline>
            View details
          </Button>
        ),
        [cv],
      );
      const UpdateIcon = React.useCallback(
        () => <ArrowCircleUpIcon className="update-pending" />,
        [],
      );

      let items: React.ReactNode;
      if (!flagPending(hasCVResource)) {
        if (hasCVResource && (hasAvailableUpdates(cv) || !_.isEmpty(alerts))) {
          items = (
            <>
              {hasAvailableUpdates(cv) && (
                <StatusItem
                  Icon={UpdateIcon}
                  message="A cluster version update is available"
                  LinkComponent={LinkComponent}
                />
              )}
              {alerts.map((alert) => (
                <AlertItem key={alertURL(alert, alert.rule.id)} alert={alert} />
              ))}
            </>
          );
        } else if (!_.isEmpty(alerts)) {
          items = alerts.map((alert) => (
            <AlertItem key={alertURL(alert, alert.rule.id)} alert={alert} />
          ));
        }
      }

      return (
        <AlertsBody
          isLoading={
            flagPending(hasCVResource) || !alertsLoaded || (hasCVResource && !cvLoaded && !cvError)
          }
          error={!_.isEmpty(alertsResponseError)}
          emptyMessage="No cluster alerts or messages"
        >
          {items}
        </AlertsBody>
      );
    },
  ),
);

const mapStateToProps = (state: RootState) => ({
  k8sModels: state.k8s.getIn(['RESOURCES', 'models']),
});

export const StatusCard = connect(mapStateToProps)(
  connectToFlags<StatusCardProps>(
    ...plugins.registry.getGatingFlagNames([isDashboardsOverviewHealthSubsystem]),
  )(({ flags, k8sModels }) => {
    const subsystems = getSubsystems(flags, k8sModels);
    const operatorSubsystemIndex = subsystems.findIndex(isDashboardsOverviewHealthOperator);

    const healthItems: { title: string; Component: React.ReactNode }[] = [];
    subsystems.forEach((subsystem) => {
      if (isDashboardsOverviewHealthURLSubsystem(subsystem)) {
        healthItems.push({
          title: subsystem.properties.title,
          Component: <URLHealthItem subsystem={subsystem.properties} models={k8sModels} />,
        });
      } else if (isDashboardsOverviewHealthPrometheusSubsystem(subsystem)) {
        healthItems.push({
          title: subsystem.properties.title,
          Component: <PrometheusHealthItem subsystem={subsystem.properties} models={k8sModels} />,
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
            <Gallery className="co-overview-status__health" gutter="md">
              {healthItems.map((item) => {
                return <GalleryItem key={item.title}>{item.Component}</GalleryItem>;
              })}
            </Gallery>
          </HealthBody>
          <ClusterAlerts />
        </DashboardCardBody>
      </DashboardCard>
    );
  }),
);

type StatusCardProps = WithFlagsProps & {
  k8sModels: ImmutableMap<string, K8sKind>;
};
