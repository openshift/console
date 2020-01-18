import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { NotificationDrawer, NotificationEntry } from '@console/patternfly';
import * as UIActions from '@console/internal/actions/ui';
import store, { RootState } from '@console/internal/redux';
import { Alert, alertURL } from '@console/internal/components/monitoring';
import {
  getAlertDescription,
  getAlertMessage,
  getAlertName,
  getAlertSeverity,
  getAlertTime,
  getAlerts,
} from '@console/shared/src/components/dashboard/status-card/utils';

import { coFetchJSON } from '../co-fetch';
import { FirehoseResult } from './utils';
import {
  ClusterUpdate,
  ClusterVersionKind,
  hasAvailableUpdates,
  K8sResourceKind,
} from '../module/k8s';
import { getSortedUpdates } from './modals/cluster-update-modal';

export enum NotificationTypes {
  info = 'info',
  warning = 'warning',
  critical = 'danger',
  success = 'success',
  update = 'update',
}

export const ConnectedNotificationDrawer_: React.FC<ConnectedNotificationDrawerProps> = ({
  toggleNotificationDrawer,
  toggleNotificationsRead,
  isDrawerExpanded,
  notificationsRead,
  alerts,
  resources,
  children,
}) => {
  React.useEffect(() => {
    let pollerTimeout = null;
    const poll: NotficationPoll = (url, dataHandler) => {
      const key = 'notificationAlerts';
      store.dispatch(UIActions.monitoringLoading(key));
      const notificationPoller = (): void => {
        coFetchJSON(url)
          .then((response) => dataHandler(response))
          .then((data) => store.dispatch(UIActions.monitoringLoaded(key, data)))
          .catch((e) => store.dispatch(UIActions.monitoringErrored(key, e)))
          .then(() => (pollerTimeout = setTimeout(notificationPoller, 15 * 1000)));
      };
      notificationPoller();
    };
    const { prometheusBaseURL } = window.SERVER_FLAGS;

    if (prometheusBaseURL) {
      poll(`${prometheusBaseURL}/api/v1/rules`, getAlerts);
    } else {
      store.dispatch(
        UIActions.monitoringErrored('notificationAlerts', new Error('prometheusBaseURL not set')),
      );
    }
    return () => pollerTimeout.clearTimeout;
  }, []);
  const cv = _.get(resources.cv, 'data') as ClusterVersionKind;
  const cvLoaded: boolean = _.get(resources.cv, 'loaded');
  const updateData: ClusterUpdate[] = hasAvailableUpdates(cv) ? getSortedUpdates(cv) : [];
  const { data, loaded } = alerts;
  const updateList =
    cvLoaded && !_.isEmpty(updateData)
      ? [
          <NotificationEntry
            key="cluster-udpate"
            description={updateData[0].version || 'Unknown'}
            type={NotificationTypes.update}
            title="Cluster update available"
            toggleNotificationDrawer={toggleNotificationDrawer}
            targetURL="/settings/cluster"
          />,
        ]
      : [];
  const alertList =
    loaded && !_.isEmpty(data)
      ? data.map((alert, i) => (
          <NotificationEntry
            key={i}
            description={getAlertDescription(alert) || getAlertMessage(alert)}
            timestamp={getAlertTime(alert)}
            type={NotificationTypes[getAlertSeverity(alert)]}
            title={getAlertName(alert)}
            toggleNotificationDrawer={toggleNotificationDrawer}
            targetURL={alertURL(alert, alert.rule.id)}
          />
        ))
      : [];
  if (_.isEmpty(alertList) && _.isEmpty(updateList) && !notificationsRead) {
    toggleNotificationsRead();
  } else if ((!_.isEmpty(alertList) || !_.isEmpty(updateList)) && notificationsRead) {
    toggleNotificationsRead();
  }

  return (
    <NotificationDrawer
      toggleNotificationDrawer={toggleNotificationDrawer}
      isDrawerExpanded={isDrawerExpanded}
      alertData={alertList}
      updateData={updateList}
    >
      {children}
    </NotificationDrawer>
  );
};
type NotficationPoll = (url: string, dataHandler: (data) => any) => void;

export type WithNotificationsProps = {
  isDrawerExpanded: boolean;
  notificationsRead: boolean;
  alerts: {
    data: Alert[];
    loaded: boolean;
    loadError?: string;
  };
};

export type ConnectedNotificationDrawerProps = {
  toggleNotificationsRead: () => any;
  toggleNotificationDrawer: () => any;
  isDrawerExpanded: boolean;
  notificationsRead: boolean;
  alerts: {
    data: Alert[];
    loaded: boolean;
    loadError?: string;
  };
  resources?: {
    [key: string]: FirehoseResult | FirehoseResult<K8sResourceKind>;
  };
};

const notificationStateToProps = ({ UI }: RootState): WithNotificationsProps => ({
  isDrawerExpanded: !!UI.getIn(['notifications', 'isExpanded']),
  notificationsRead: !!UI.getIn(['notifications', 'isRead']),
  alerts: UI.getIn(['monitoring', 'notificationAlerts']) || {},
});

const connectToNotifications = connect(
  (state: RootState) => notificationStateToProps(state),
  {
    toggleNotificationDrawer: UIActions.notificationDrawerToggleExpanded,
    toggleNotificationsRead: UIActions.notificationDrawerToggleRead,
  },
);
export const ConnectedNotificationDrawer = connectToNotifications(ConnectedNotificationDrawer_);
