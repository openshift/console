import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
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
import {
  RedExclamationCircleIcon,
  AlertAction,
  isAlertAction,
  useResolvedExtensions,
  ResolvedExtension,
} from '@console/dynamic-plugin-sdk';
import {
  getAlertDescription,
  getAlertMessage,
  getAlertName,
  getAlertSeverity,
  getAlertTime,
} from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/status-card/alert-utils';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateSecondaryActions,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';
import { useClusterVersion } from '@console/dynamic-plugin-sdk/src/shared/hooks/version';
import { usePrevious } from '@console/dynamic-plugin-sdk/src/shared/hooks/previous';

import { history } from '@console/internal/components/utils';
import { coFetchJSON } from '../co-fetch';
import {
  ClusterUpdate,
  ClusterVersionKind,
  getNewerClusterVersionChannel,
  getSimilarClusterVersionChannels,
  getSortedUpdates,
  splitClusterVersionChannel,
} from '../module/k8s';
import { ClusterVersionModel } from '../models';
import { useAccessReview } from './utils/rbac';
import { LinkifyExternal } from './utils';
import { PrometheusEndpoint } from './graphs/helpers';

const criticalCompare = (a: Alert): boolean => getAlertSeverity(a) === 'critical';
const otherAlertCompare = (a: Alert): boolean => getAlertSeverity(a) !== 'critical';

const AlertErrorState: React.FC<AlertErrorProps> = ({ errorText }) => {
  const { t } = useTranslation();
  return (
    <EmptyState variant={EmptyStateVariant.full}>
      <EmptyStateIcon className="co-status-card__alerts-icon" icon={RedExclamationCircleIcon} />
      <Title headingLevel="h5" size="lg">
        {t('public~Alerts could not be loaded')}
      </Title>
      {errorText && <EmptyStateBody>{errorText}</EmptyStateBody>}
    </EmptyState>
  );
};

const AlertEmptyState: React.FC<AlertEmptyProps> = ({ drawerToggle }) => {
  const { t } = useTranslation();
  return (
    <EmptyState variant={EmptyStateVariant.full} className="co-status-card__alerts-msg">
      <Title headingLevel="h5" size="lg">
        {t('public~No critical alerts')}
      </Title>
      <EmptyStateBody>
        {t(
          'public~There are currently no critical alerts firing. There may be firing alerts of other severities or silenced critical alerts however.',
        )}
      </EmptyStateBody>
      <EmptyStateSecondaryActions>
        <Link to="/monitoring/alerts" onClick={drawerToggle}>
          {t('public~View all alerts')}
        </Link>
      </EmptyStateSecondaryActions>
    </EmptyState>
  );
};

export const getAlertActions = (actionsExtensions: ResolvedExtension<AlertAction>[]) => {
  const alertActions = new Map<
    string,
    Omit<ResolvedExtension<AlertAction>['properties'], 'alert'>
  >().set('AlertmanagerReceiversNotConfigured', {
    text: i18next.t('public~Configure'),
    action: () => history.push('/monitoring/alertmanagerconfig'),
  });
  actionsExtensions.forEach(({ properties }) =>
    alertActions.set(properties.alert, {
      text: properties.text,
      action: properties.action,
    }),
  );
  return alertActions;
};

const getAlertNotificationEntries = (
  isLoaded: boolean,
  alertData: Alert[],
  toggleNotificationDrawer: () => void,
  alertActionExtensions: ResolvedExtension<AlertAction>[],
  isCritical: boolean,
): React.ReactNode[] =>
  isLoaded && !_.isEmpty(alertData)
    ? alertData
        .filter((a) => (isCritical ? criticalCompare(a) : otherAlertCompare(a)))
        .map((alert, i) => {
          const action = getAlertActions(alertActionExtensions).get(alert.rule.name);

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
              alertAction={() => action.action(alert)}
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
        actionText={i18next.t('public~Update cluster')}
        key="cluster-update"
        description={updateData[0].version || i18next.t('public~Unknown')}
        type={NotificationTypes.update}
        title={i18next.t('public~Cluster update available')}
        toggleNotificationDrawer={toggleNotificationDrawer}
        targetPath="/settings/cluster?showVersions"
      />,
    );
  }
  if (newerChannel) {
    entries.push(
      <NotificationEntry
        actionPath="/settings/cluster?showChannels"
        actionText={i18next.t('public~Update channel')}
        key="channel-update"
        description={i18next.t(
          'public~The {{newerChannel}} channel is available. If you are interested in updating this cluster to {{newerChannelVersion}} in the future, change the update channel to {{newerChannel}} to receive recommended updates.',
          { newerChannel, newerChannelVersion },
        )}
        type={NotificationTypes.update}
        title={i18next.t('public~{{newerChannel}} channel available', {
          newerChannel,
        })}
        toggleNotificationDrawer={toggleNotificationDrawer}
        targetPath="/settings/cluster?showChannels"
      />,
    );
  }
  return entries;
};

const pollerTimeouts = {};
const pollers = {};

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
  const { t } = useTranslation();
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
      poll(`${prometheusBaseURL}/${PrometheusEndpoint.RULES}`, 'notificationAlerts', getAlerts);
    } else {
      store.dispatch(
        UIActions.monitoringErrored(
          'notificationAlerts',
          new Error(t('public~prometheusBaseURL not set')),
        ),
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
        UIActions.monitoringErrored('silences', new Error(t('public~alertManagerBaseURL not set'))),
      );
    }

    return () => _.each(pollerTimeouts, clearTimeout);
  }, [t]);
  const clusterVersion: ClusterVersionKind = useClusterVersion();

  const { data, loaded, loadError } = alerts || {};
  const alertIds = React.useMemo(() => data?.map((datum) => datum.rule.name) || [], [data]);
  const [resolvedAlerts] = useResolvedExtensions<AlertAction>(
    React.useCallback(
      (e): e is AlertAction => isAlertAction(e) && alertIds.includes(e.properties.alert),
      [alertIds],
    ),
  );

  const clusterVersionIsEditable =
    useAccessReview({
      group: ClusterVersionModel.apiGroup,
      resource: ClusterVersionModel.plural,
      verb: 'patch',
      name: 'version',
    }) && window.SERVER_FLAGS.branding !== 'dedicated';

  const updateList: React.ReactNode[] = getUpdateNotificationEntries(
    clusterVersion,
    clusterVersionIsEditable,
    toggleNotificationDrawer,
  );
  const criticalAlertList: React.ReactNode[] = getAlertNotificationEntries(
    true,
    data,
    toggleNotificationDrawer,
    resolvedAlerts,
    true,
  );
  const otherAlertList: React.ReactNode[] = getAlertNotificationEntries(
    loaded,
    data,
    toggleNotificationDrawer,
    resolvedAlerts,
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
      label={t('public~Critical Alerts')}
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
      label={t('public~Other Alerts')}
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
      label={t('public~Recommendations')}
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
