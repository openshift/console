import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  NotificationDrawer,
  NotificationEntry,
  NotificationCategory,
  NotificationTypes,
} from '@console/patternfly';
import * as UIActions from '@console/internal/actions/ui';
import store, { RootState } from '@console/internal/redux';
import { Alert, PrometheusRulesResponse } from '@console/internal/components/monitoring/types';
import { getAlertsAndRules, alertURL } from '@console/internal/components/monitoring/utils';
import { NotificationAlerts } from '@console/internal/reducers/ui';
import { RedExclamationCircleIcon } from '@console/shared';
import {
  getAlertDescription,
  getAlertMessage,
  getAlertName,
  getAlertSeverity,
  getAlertTime,
} from '@console/shared/src/components/dashboard/status-card/alert-utils';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateSecondaryActions,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';
import { isAlertAction, useExtensions, AlertAction } from '@console/plugin-sdk';
import { usePrevious } from '@console/shared/src/hooks/previous';

import { coFetchJSON } from '../co-fetch';
import {
  ClusterUpdate,
  ClusterVersionKind,
  getNewerClusterVersionChannel,
  getSimilarClusterVersionChannels,
  getSortedUpdates,
  referenceForModel,
  splitClusterVersionChannel,
} from '../module/k8s';
import { ClusterVersionModel } from '../models';
import { useK8sWatchResource, WatchK8sResource } from './utils/k8s-watch-hook';
import { useAccessReview } from './utils/rbac';
import { LinkifyExternal } from './utils';

const criticalCompare = (a: Alert): boolean => getAlertSeverity(a) === 'critical';
const otherAlertCompare = (a: Alert): boolean => getAlertSeverity(a) !== 'critical';

const AlertErrorState: React.FC<AlertErrorProps> = ({ errorText }) => (
  <EmptyState variant={EmptyStateVariant.full}>
    <EmptyStateIcon className="co-status-card__alerts-icon" icon={RedExclamationCircleIcon} />
    <Title headingLevel="h5" size="lg">
      Alerts could not be loaded
    </Title>
    {errorText && <EmptyStateBody>{errorText}</EmptyStateBody>}
  </EmptyState>
);

const AlertEmptyState: React.FC<AlertEmptyProps> = ({ drawerToggle }) => (
  <EmptyState variant={EmptyStateVariant.full} className="co-status-card__alerts-msg">
    <Title headingLevel="h5" size="lg">
      No critical alerts
    </Title>
    <EmptyStateBody>
      There are currently no critical alerts firing. There may be firing alerts of other severities
      or silenced critical alerts however.
    </EmptyStateBody>
    <EmptyStateSecondaryActions>
      <Link to="/monitoring/alerts" onClick={drawerToggle}>
        View all alerts
      </Link>
    </EmptyStateSecondaryActions>
  </EmptyState>
);

export const getAlertActions = (actionsExtensions: AlertAction[]) => {
  const alertActions = new Map().set('AlertmanagerReceiversNotConfigured', {
    text: 'Configure',
    path: '/monitoring/alertmanagerconfig',
  });
  actionsExtensions.forEach(({ properties }) =>
    alertActions.set(properties.alert, {
      text: properties.text,
      path: properties.path,
      dataTestID: properties.dataTestID,
    }),
  );
  return alertActions;
};

const getAlertNotificationEntries = (
  isLoaded: boolean,
  alertData: Alert[],
  toggleNotificationDrawer: () => void,
  alertActionExtensions: AlertAction[],
  isCritical: boolean,
): React.ReactNode[] =>
  isLoaded && !_.isEmpty(alertData)
    ? alertData
        .filter((a) => (isCritical ? criticalCompare(a) : otherAlertCompare(a)))
        .map((alert, i) => {
          const action = getAlertActions(alertActionExtensions).get(alert.rule.name);
          const alertActionPath = _.isFunction(action?.path) ? action.path(alert) : action?.path;
          return (
            <NotificationEntry
              key={`${i}_${alert.activeAt}`}
              description={
                <LinkifyExternal>
                  {getAlertDescription(alert) || getAlertMessage(alert)}
                </LinkifyExternal>
              }
              timestamp={getAlertTime(alert)}
              type={NotificationTypes[getAlertSeverity(alert)]}
              title={getAlertName(alert)}
              toggleNotificationDrawer={toggleNotificationDrawer}
              targetPath={alertURL(alert, alert.rule.id)}
              actionText={action?.text}
              actionPath={alertActionPath}
              actionTestID={action?.dataTestID}
            />
          );
        })
    : [];

const getUpdateNotificationEntries = (
  cv: ClusterVersionKind,
  isEditable: boolean,
  toggleNotificationDrawer: () => void,
): React.ReactNode[] => {
  if (!cv || !isEditable) {
    return [];
  }
  const updateData: ClusterUpdate[] = getSortedUpdates(cv);
  const currentChannel = cv?.spec?.channel;
  const currentPrefix = splitClusterVersionChannel(currentChannel)?.prefix;
  const similarChannels = getSimilarClusterVersionChannels(cv, currentPrefix);
  const newerChannel = getNewerClusterVersionChannel(similarChannels, currentChannel);
  const newerChannelVersion = splitClusterVersionChannel(newerChannel)?.version;
  const entries = [];
  if (!_.isEmpty(updateData)) {
    entries.push(
      <NotificationEntry
        actionPath="/settings/cluster?showVersions"
        actionText="Update cluster"
        key="cluster-update"
        description={updateData[0].version || 'Unknown'}
        type={NotificationTypes.update}
        title="Cluster update available"
        toggleNotificationDrawer={toggleNotificationDrawer}
        targetPath="/settings/cluster?showVersions"
      />,
    );
  }
  if (newerChannel) {
    entries.push(
      <NotificationEntry
        actionPath="/settings/cluster?showChannels"
        actionText="Update channel"
        key="channel-update"
        description={`The ${newerChannel} channel is available. If you are
            interested in updating this cluster to ${newerChannelVersion} in the
            future, change the update channel to ${newerChannel} to receive recommended
            updates.`}
        type={NotificationTypes.update}
        title={`${newerChannel} channel available`}
        toggleNotificationDrawer={toggleNotificationDrawer}
        targetPath="/settings/cluster?showChannels"
      />,
    );
  }
  return entries;
};

const pollerTimeouts = {};
const pollers = {};
const cvResource: WatchK8sResource = {
  kind: referenceForModel(ClusterVersionModel),
  namespaced: false,
  name: 'version',
  isList: false,
  optional: true,
};

export const refreshNotificationPollers = () => {
  _.each(pollerTimeouts, clearTimeout);
  _.invoke(pollers, 'silences');
  _.invoke(pollers, 'notificationAlerts');
};

const getAlerts = (alertsResults: PrometheusRulesResponse): Alert[] =>
  alertsResults
    ? getAlertsAndRules(alertsResults.data)
        .alerts.filter(
          (a) =>
            a.state === 'firing' &&
            getAlertName(a) !== 'Watchdog' &&
            getAlertName(a) !== 'UpdateAvailable',
        )
        .sort((a, b) => +new Date(getAlertTime(b)) - +new Date(getAlertTime(a)))
    : [];

export const ConnectedNotificationDrawer_: React.FC<ConnectedNotificationDrawerProps> = ({
  isDesktop,
  toggleNotificationDrawer,
  isDrawerExpanded,
  onDrawerChange,
  alerts,
  children,
}) => {
  React.useEffect(() => {
    const poll: NotificationPoll = (url, key: 'notificationAlerts' | 'silences', dataHandler) => {
      store.dispatch(UIActions.monitoringLoading(key));
      const notificationPoller = (): void => {
        coFetchJSON(url)
          .then((response) => dataHandler(response))
          .then((data) => store.dispatch(UIActions.monitoringLoaded(key, data)))
          .catch((e) => store.dispatch(UIActions.monitoringErrored(key, e)))
          .then(() => (pollerTimeouts[key] = setTimeout(notificationPoller, 15 * 1000)));
      };
      pollers[key] = notificationPoller;
      notificationPoller();
    };
    const { alertManagerBaseURL, prometheusBaseURL } = window.SERVER_FLAGS;

    if (prometheusBaseURL) {
      poll(`${prometheusBaseURL}/api/v1/rules`, 'notificationAlerts', getAlerts);
    } else {
      store.dispatch(
        UIActions.monitoringErrored('notificationAlerts', new Error('prometheusBaseURL not set')),
      );
    }

    if (alertManagerBaseURL) {
      poll(`${alertManagerBaseURL}/api/v2/silences`, 'silences', (silences) => {
        // Set a name field on the Silence to make things easier
        _.each(silences, (s) => {
          s.name = _.get(_.find(s.matchers, { name: 'alertname' }), 'value');
          if (!s.name) {
            // No alertname, so fall back to displaying the other matchers
            s.name = s.matchers
              .map((m) => `${m.name}${m.isRegex ? '=~' : '='}${m.value}`)
              .join(', ');
          }
        });
        return silences;
      });
    } else {
      store.dispatch(
        UIActions.monitoringErrored('silences', new Error('alertManagerBaseURL not set')),
      );
    }

    return () => _.each(pollerTimeouts, clearTimeout);
  }, []);
  const [clusterVersionData] = useK8sWatchResource<ClusterVersionKind>(cvResource);
  const alertActionExtensions = useExtensions<AlertAction>(isAlertAction);

  const { data, loaded, loadError } = alerts || {};

  const clusterVersionIsEditable =
    useAccessReview({
      group: ClusterVersionModel.apiGroup,
      resource: ClusterVersionModel.plural,
      verb: 'patch',
      name: 'version',
    }) && window.SERVER_FLAGS.branding !== 'dedicated';

  const updateList: React.ReactNode[] = getUpdateNotificationEntries(
    clusterVersionData,
    clusterVersionIsEditable,
    toggleNotificationDrawer,
  );
  const criticalAlertList: React.ReactNode[] = getAlertNotificationEntries(
    true,
    data,
    toggleNotificationDrawer,
    alertActionExtensions,
    true,
  );
  const otherAlertList: React.ReactNode[] = getAlertNotificationEntries(
    loaded,
    data,
    toggleNotificationDrawer,
    alertActionExtensions,
    false,
  );
  const [isAlertExpanded, toggleAlertExpanded] = React.useState<boolean>(
    !_.isEmpty(criticalAlertList),
  );
  const [isNonCriticalAlertExpanded, toggleNonCriticalAlertExpanded] = React.useState<boolean>(
    true,
  );
  const [isClusterUpdateExpanded, toggleClusterUpdateExpanded] = React.useState<boolean>(true);
  const prevDrawerToggleState = usePrevious(isDrawerExpanded);

  const hasCriticalAlerts = criticalAlertList.length > 0;
  const hasNonCriticalAlerts = otherAlertList.length > 0;
  React.useEffect(() => {
    if (hasCriticalAlerts && !prevDrawerToggleState && isDrawerExpanded) {
      toggleAlertExpanded(true);
    }
    if (hasNonCriticalAlerts && !prevDrawerToggleState && isDrawerExpanded) {
      toggleNonCriticalAlertExpanded(true);
    }
  }, [
    hasCriticalAlerts,
    hasNonCriticalAlerts,
    isAlertExpanded,
    isDrawerExpanded,
    prevDrawerToggleState,
  ]);
  React.useEffect(() => {
    onDrawerChange();
  }, [isDrawerExpanded, onDrawerChange]);

  const emptyState = !_.isEmpty(loadError) ? (
    <AlertErrorState errorText={loadError.message} />
  ) : (
    <AlertEmptyState drawerToggle={toggleNotificationDrawer} />
  );

  const criticalAlerts = _.isEmpty(criticalAlertList) ? emptyState : criticalAlertList;
  const criticalAlertCategory: React.ReactElement = (
    <NotificationCategory
      key="critical-alerts"
      isExpanded={isAlertExpanded}
      label="Critical Alerts"
      count={criticalAlertList.length}
      onExpandContents={toggleAlertExpanded}
    >
      {criticalAlerts}
    </NotificationCategory>
  );
  const nonCriticalAlertCategory: React.ReactElement = !_.isEmpty(otherAlertList) ? (
    <NotificationCategory
      key="other-alerts"
      isExpanded={isNonCriticalAlertExpanded}
      label="Other Alerts"
      count={otherAlertList.length}
      onExpandContents={toggleNonCriticalAlertExpanded}
    >
      {otherAlertList}
    </NotificationCategory>
  ) : null;

  const recommendationsCategory: React.ReactElement = !_.isEmpty(updateList) ? (
    <NotificationCategory
      key="recommendations"
      isExpanded={isClusterUpdateExpanded}
      label="Recommendations"
      count={updateList.length}
      onExpandContents={toggleClusterUpdateExpanded}
    >
      {updateList}
    </NotificationCategory>
  ) : null;

  return (
    <NotificationDrawer
      className="co-notification-drawer"
      isInline={isDesktop}
      isExpanded={isDrawerExpanded}
      notificationEntries={[
        criticalAlertCategory,
        nonCriticalAlertCategory,
        recommendationsCategory,
      ]}
      onClose={toggleNotificationDrawer}
    >
      {children}
    </NotificationDrawer>
  );
};

type NotificationPoll = (
  url: string,
  key: 'notificationAlerts' | 'silences',
  dataHandler: (data) => any,
) => void;

export type WithNotificationsProps = {
  isDrawerExpanded: boolean;
  alerts?: {
    data: Alert[];
    loaded: boolean;
    loadError?: {
      message?: string;
    };
  };
  silences?: any;
};

export type ConnectedNotificationDrawerProps = {
  isDesktop: boolean;
  toggleNotificationDrawer: () => any;
  isDrawerExpanded: boolean;
  onDrawerChange: () => void;
  alerts: NotificationAlerts;
};

const notificationStateToProps = ({ UI }: RootState): WithNotificationsProps => ({
  isDrawerExpanded: !!UI.getIn(['notifications', 'isExpanded']),
  alerts: UI.getIn(['monitoring', 'notificationAlerts']),
  silences: UI.getIn(['monitoring', 'silences']),
});

type AlertErrorProps = {
  errorText: string;
};

type AlertEmptyProps = {
  drawerToggle: (event: React.MouseEvent<HTMLElement>) => void;
};

const connectToNotifications = connect((state: RootState) => notificationStateToProps(state), {
  toggleNotificationDrawer: UIActions.notificationDrawerToggleExpanded,
});
export const ConnectedNotificationDrawer = connectToNotifications(ConnectedNotificationDrawer_);
