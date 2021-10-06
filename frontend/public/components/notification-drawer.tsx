import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { connect, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  NotificationDrawer,
  NotificationEntry,
  NotificationCategory,
  NotificationTypes,
} from '@console/patternfly';
import {
  alertingErrored,
  alertingLoaded,
  alertingLoading,
  setAlertCount,
} from '@console/internal/actions/observe';
import * as UIActions from '@console/internal/actions/ui';
import { RootState } from '@console/internal/redux';
import {
  Alert,
  PrometheusRulesResponse,
  AlertSeverity,
} from '@console/internal/components/monitoring/types';

import { getClusterID } from '../module/k8s/cluster-settings';

import { ServiceLevelNotification } from '@console/internal/components/utils/service-level';
import { getAlertsAndRules, alertURL } from '@console/internal/components/monitoring/utils';
import { NotificationAlerts } from '@console/internal/reducers/observe';
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
import { useClusterVersion } from '@console/shared/src/hooks/version';
import { usePrevious } from '@console/shared/src/hooks/previous';
import {
  AlertAction,
  isAlertAction,
  useResolvedExtensions,
  ResolvedExtension,
} from '@console/dynamic-plugin-sdk';
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
import { LabelSelector } from '@console/internal/module/k8s/label-selector';
import { useNotificationAlerts } from '@console/shared/src/hooks/useNotificationAlerts';

const criticalAlertLabelSelector = new LabelSelector({ severity: AlertSeverity.Critical });

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

// FIXME (jon): AlertmanagerReceiversNotConfigured action should be defined as an extension in the
// console-app package. Also, rather than build a map on every call of this function, we might want
// to hook this into redux.
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

const SupportNotification = (cv: ClusterVersionKind, toggleNotificationDrawer: () => void) => {
  const clusterID = getClusterID(cv);
  return (
    <ServiceLevelNotification
      key="service-level-notification"
      clusterID={clusterID}
      toggleNotificationDrawer={toggleNotificationDrawer}
    />
  );
};

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

  if (SupportNotification(cv, toggleNotificationDrawer) !== null) {
    entries.push(SupportNotification(cv, toggleNotificationDrawer));
  }
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

export const ConnectedNotificationDrawer_: React.FC<ConnectedNotificationDrawerProps> = ({
  isDesktop,
  toggleNotificationDrawer,
  isDrawerExpanded,
  onDrawerChange,
  children,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  React.useEffect(() => {
    const poll: NotificationPoll = (url, key: 'notificationAlerts' | 'silences', dataHandler) => {
      dispatch(alertingLoading(key));
      const notificationPoller = (): void => {
        coFetchJSON(url)
          .then((response) => dataHandler(response))
          .then((data) => dispatch(alertingLoaded(key, data)))
          .catch((e) => dispatch(alertingErrored(key, e)))
          .then(() => (pollerTimeouts[key] = setTimeout(notificationPoller, 15 * 1000)));
      };
      pollers[key] = notificationPoller;
      notificationPoller();
    };
    const { alertManagerBaseURL, prometheusBaseURL } = window.SERVER_FLAGS;

    if (prometheusBaseURL) {
      poll(
        `${prometheusBaseURL}/${PrometheusEndpoint.RULES}`,
        'notificationAlerts',
        (alertsResults: PrometheusRulesResponse): Alert[] =>
          alertsResults
            ? getAlertsAndRules(alertsResults.data)
                .alerts.filter(
                  (a) =>
                    a.state === 'firing' &&
                    getAlertName(a) !== 'Watchdog' &&
                    getAlertName(a) !== 'UpdateAvailable',
                )
                .sort((a, b) => +new Date(getAlertTime(b)) - +new Date(getAlertTime(a)))
            : [],
      );
    } else {
      dispatch(
        alertingErrored('notificationAlerts', new Error(t('public~prometheusBaseURL not set'))),
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
      dispatch(alertingErrored('silences', new Error(t('public~alertManagerBaseURL not set'))));
    }

    return () => _.each(pollerTimeouts, clearTimeout);
  }, [dispatch, t]);
  const clusterVersion: ClusterVersionKind = useClusterVersion();
  const [alerts, , loadError] = useNotificationAlerts();
  const alertIds = React.useMemo(() => alerts?.map((alert) => alert.rule.name) || [], [alerts]);
  const [alertActionExtensions] = useResolvedExtensions<AlertAction>(
    React.useCallback(
      (e): e is AlertAction => isAlertAction(e) && alertIds.includes(e.properties.alert),
      [alertIds],
    ),
  );

  const alertActionExtensionsMap = React.useMemo(() => getAlertActions(alertActionExtensions), [
    alertActionExtensions,
  ]);

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

  const [criticalAlerts, nonCriticalAlerts] = React.useMemo(
    () =>
      alerts.reduce<AlertAccumulator>(
        ([criticalAlertAcc, nonCriticalAlertAcc], alert) => {
          return criticalAlertLabelSelector.matchesLabels(alert.labels)
            ? [[...criticalAlertAcc, alert], nonCriticalAlertAcc]
            : [criticalAlertAcc, [...nonCriticalAlertAcc, alert]];
        },
        [[], []],
      ),
    [alerts],
  );

  const hasCriticalAlerts = criticalAlerts.length > 0;
  const hasNonCriticalAlerts = nonCriticalAlerts.length > 0;
  const [isAlertExpanded, toggleAlertExpanded] = React.useState<boolean>(hasCriticalAlerts);
  const [isNonCriticalAlertExpanded, toggleNonCriticalAlertExpanded] = React.useState<boolean>(
    true,
  );
  const [isClusterUpdateExpanded, toggleClusterUpdateExpanded] = React.useState<boolean>(true);
  const prevDrawerToggleState = usePrevious(isDrawerExpanded);
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

  // Update alert count.
  const alertCount = alerts?.length ?? 0;
  React.useEffect(() => {
    dispatch(setAlertCount(alertCount));
  }, [alertCount, dispatch]);

  const emptyState = loadError ? (
    <AlertErrorState errorText={loadError.toString()} />
  ) : (
    <AlertEmptyState drawerToggle={toggleNotificationDrawer} />
  );

  const criticalAlertCategory: React.ReactElement = (
    <NotificationCategory
      key="critical-alerts"
      isExpanded={isAlertExpanded}
      label={t('public~Critical Alerts')}
      count={criticalAlerts.length}
      onExpandContents={toggleAlertExpanded}
    >
      {criticalAlerts.length > 0
        ? criticalAlerts.map((alert, i) => {
            const action = alertActionExtensionsMap.get(alert.rule.name);
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
                alertAction={() => action?.action?.(alert)}
              />
            );
          })
        : emptyState}
    </NotificationCategory>
  );
  const nonCriticalAlertCategory: React.ReactElement =
    nonCriticalAlerts.length > 0 ? (
      <NotificationCategory
        key="other-alerts"
        isExpanded={isNonCriticalAlertExpanded}
        label={t('public~Other Alerts')}
        count={nonCriticalAlerts.length}
        onExpandContents={toggleNonCriticalAlertExpanded}
      >
        {nonCriticalAlerts.map((alert, i) => {
          const action = alertActionExtensionsMap.get(alert.rule.name);
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
              alertAction={() => action?.action?.(alert)}
            />
          );
        })}
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
  alerts?: NotificationAlerts;
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
});

type AlertErrorProps = {
  errorText: string;
};

type AlertEmptyProps = {
  drawerToggle: (event: React.MouseEvent<HTMLElement>) => void;
};

type AlertAccumulator = [Alert[], Alert[]];

const connectToNotifications = connect((state: RootState) => notificationStateToProps(state), {
  toggleNotificationDrawer: UIActions.notificationDrawerToggleExpanded,
});
export const ConnectedNotificationDrawer = connectToNotifications(ConnectedNotificationDrawer_);
