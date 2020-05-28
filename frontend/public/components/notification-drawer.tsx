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
import { Alert, alertURL } from '@console/internal/components/monitoring';
import { NotificationAlerts } from '@console/internal/reducers/ui';
import { RedExclamationCircleIcon } from '@console/shared';
import {
  getAlertDescription,
  getAlertMessage,
  getAlertName,
  getAlertSeverity,
  getAlertTime,
  getAlerts,
} from '@console/shared/src/components/dashboard/status-card/alert-utils';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateSecondaryActions,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';

import { coFetchJSON } from '../co-fetch';
import { ClusterUpdate, ClusterVersionKind, referenceForModel } from '../module/k8s';
import { ClusterVersionModel } from '../models';
import { getSortedUpdates } from './modals/cluster-update-modal';
import { usePrevious } from '@console/metal3-plugin/src/hooks';
import { useK8sWatchResource, WatchK8sResource } from './utils/k8s-watch-hook';

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

export const alertActions = new Map().set('AlertmanagerReceiversNotConfigured', {
  text: 'Configure',
  path: '/monitoring/alertmanagerconfig',
});

const getAlertNotificationEntries = (
  isLoaded: boolean,
  alertData: Alert[],
  toggleNotificationDrawer: () => void,
  isCritical: boolean,
): React.ReactNode[] =>
  isLoaded && !_.isEmpty(alertData)
    ? alertData
        .filter((a) => (isCritical ? criticalCompare(a) : otherAlertCompare(a)))
        .map((alert, i) => {
          const action = alertActions.get(alert.rule.name);
          return (
            <NotificationEntry
              key={`${i}_${alert.activeAt}`}
              description={getAlertDescription(alert) || getAlertMessage(alert)}
              timestamp={getAlertTime(alert)}
              type={NotificationTypes[getAlertSeverity(alert)]}
              title={getAlertName(alert)}
              toggleNotificationDrawer={toggleNotificationDrawer}
              targetPath={alertURL(alert, alert.rule.id)}
              actionText={action?.text}
              actionPath={action?.path}
            />
          );
        })
    : [];

const getUpdateNotificationEntries = (
  isLoaded: boolean,
  updateData: ClusterUpdate[],
  toggleNotificationDrawer: () => void,
): React.ReactNode[] =>
  isLoaded && !_.isEmpty(updateData)
    ? [
        <NotificationEntry
          key="cluster-udpate"
          description={updateData[0].version || 'Unknown'}
          type={NotificationTypes.update}
          title="Cluster update available"
          toggleNotificationDrawer={toggleNotificationDrawer}
          targetPath="/settings/cluster"
        />,
      ]
    : [];

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

export const ConnectedNotificationDrawer_: React.FC<ConnectedNotificationDrawerProps> = ({
  isDesktop,
  toggleNotificationDrawer,
  toggleNotificationsRead,
  isDrawerExpanded,
  onDrawerChange,
  notificationsRead,
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
      poll(`${alertManagerBaseURL}/api/v1/silences`, 'silences', ({ data }) => {
        // Set a name field on the Silence to make things easier
        _.each(data, (s) => {
          s.name = _.get(_.find(s.matchers, { name: 'alertname' }), 'value');
          if (!s.name) {
            // No alertname, so fall back to displaying the other matchers
            s.name = s.matchers
              .map((m) => `${m.name}${m.isRegex ? '=~' : '='}${m.value}`)
              .join(', ');
          }
        });
        return data;
      });
    } else {
      store.dispatch(
        UIActions.monitoringErrored('silences', new Error('alertManagerBaseURL not set')),
      );
    }

    return () => _.each(pollerTimeouts, clearTimeout);
  }, []);
  const [clusterVersionData, clusterVersionLoaded] = useK8sWatchResource<ClusterVersionKind>(
    cvResource,
  );
  const updateData: ClusterUpdate[] = getSortedUpdates(clusterVersionData);
  const { data, loaded, loadError } = alerts || {};

  const updateList: React.ReactNode[] = getUpdateNotificationEntries(
    clusterVersionLoaded,
    updateData,
    toggleNotificationDrawer,
  );
  const criticalAlertList: React.ReactNode[] = getAlertNotificationEntries(
    true,
    data,
    toggleNotificationDrawer,
    true,
  );
  const otherAlertList: React.ReactNode[] = getAlertNotificationEntries(
    loaded,
    data,
    toggleNotificationDrawer,
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

  const messageCategory: React.ReactElement = !_.isEmpty(updateList) ? (
    <NotificationCategory
      key="messages"
      isExpanded={isClusterUpdateExpanded}
      label="Messages"
      count={updateList.length}
      onExpandContents={toggleClusterUpdateExpanded}
    >
      {updateList}
    </NotificationCategory>
  ) : null;

  if (_.isEmpty(data) && _.isEmpty(updateList) && !notificationsRead) {
    toggleNotificationsRead();
  } else if ((!_.isEmpty(data) || !_.isEmpty(updateList)) && notificationsRead) {
    toggleNotificationsRead();
  }

  return (
    <NotificationDrawer
      className="co-notification-drawer"
      isInline={isDesktop}
      isExpanded={isDrawerExpanded}
      notificationEntries={[criticalAlertCategory, nonCriticalAlertCategory, messageCategory]}
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
  notificationsRead: boolean;
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
  toggleNotificationsRead: () => any;
  toggleNotificationDrawer: () => any;
  isDrawerExpanded: boolean;
  notificationsRead: boolean;
  onDrawerChange: () => void;
  alerts: NotificationAlerts;
};

const notificationStateToProps = ({ UI }: RootState): WithNotificationsProps => ({
  isDrawerExpanded: !!UI.getIn(['notifications', 'isExpanded']),
  notificationsRead: !!UI.getIn(['notifications', 'isRead']),
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
  toggleNotificationsRead: UIActions.notificationDrawerToggleRead,
});
export const ConnectedNotificationDrawer = connectToNotifications(ConnectedNotificationDrawer_);
