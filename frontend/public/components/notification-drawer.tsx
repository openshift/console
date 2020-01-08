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

export enum NotificationTypes {
  info = 'info',
  warning = 'warning',
  critical = 'danger',
  success = 'success',
  update = 'update',
}

const fakeUpdateData = [
  {
    description: '4.4.0-0.ci-2020-01-01-204859',
    type: NotificationTypes.update,
    title: 'Cluster update avaialble',
  },
  {
    description: '4.4.0-0.ci-2020-01-01-2048510',
    type: NotificationTypes.update,
    title: 'Cluster security update avaialble',
  },
];

export const ConnectedNotificationDrawer_: React.FC<ConnectedNotificationDrawerProps> = ({
  toggleNotificationDrawer,
  toggleNotificationsRead,
  isDrawerExpanded,
  notificationsRead,
  alerts,
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
  let updateList = [];
  let alertList = [];
  const { data } = alerts;
  if (fakeUpdateData.length > 0) {
    updateList = fakeUpdateData.map(({ description, title, type }, i) => (
      <NotificationEntry
        key={i}
        description={description}
        timestamp={new Date().toISOString()}
        type={type}
        title={title}
        targetURL="/settings/cluster"
        toggleNotificationDrawer={toggleNotificationDrawer}
      />
    ));
  }
  if (data && data.length > 0) {
    alertList = data.map((alert, i) => (
      <NotificationEntry
        key={i}
        description={getAlertDescription(alert) || getAlertMessage(alert)}
        timestamp={getAlertTime(alert)}
        type={NotificationTypes[getAlertSeverity(alert)]}
        title={getAlertName(alert)}
        toggleNotificationDrawer={toggleNotificationDrawer}
        targetURL={alertURL(alert, alert.rule.id)}
      />
    ));
  }
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
