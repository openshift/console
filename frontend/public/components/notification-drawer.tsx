import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME out-of-sync @types/react-redux version as new types cause many build errors
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom-v5-compat';
import { NotificationEntry, NotificationCategory, NotificationTypes } from '@console/patternfly';
import {
  isNotLoadedDynamicPluginInfo,
  useDynamicPluginInfo,
  DynamicPluginInfo,
} from '@console/plugin-sdk';
import * as UIActions from '../actions/ui';
import { history, resourcePath } from '@console/internal/components/utils';

import { getClusterID } from '../module/k8s/cluster-settings';

import {
  ServiceLevelNotification,
  useShowServiceLevelNotifications,
} from '@console/internal/components/utils/service-level';
import { alertURL } from '@console/internal/components/monitoring/utils';
import { RedExclamationCircleIcon, useCanClusterUpgrade } from '@console/shared';
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
  EmptyStateVariant,
  EmptyStateActions,
  EmptyStateFooter,
  NotificationDrawer as PfNotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
} from '@patternfly/react-core';
import { useClusterVersion } from '@console/shared/src/hooks/version';
import {
  Alert,
  AlertAction,
  AlertSeverity,
  isAlertAction,
  useResolvedExtensions,
  ResolvedExtension,
} from '@console/dynamic-plugin-sdk';
import { ConsolePluginModel } from '../models';
import {
  ClusterVersionKind,
  getNewerClusterVersionChannel,
  getSimilarClusterVersionChannels,
  getSortedAvailableUpdates,
  referenceForModel,
  splitClusterVersionChannel,
  VersionUpdate,
} from '../module/k8s';
import { LinkifyExternal } from './utils';
import { LabelSelector } from '@console/internal/module/k8s/label-selector';
import { useNotificationAlerts } from '@console/shared/src/hooks/useNotificationAlerts';
import { useModal } from '@console/dynamic-plugin-sdk/src/lib-core';

const AlertErrorState: React.FC<AlertErrorProps> = ({ errorText }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      headingLevel="h5"
      icon={RedExclamationCircleIcon}
      titleText={<>{t('public~Alerts could not be loaded')}</>}
      variant={EmptyStateVariant.full}
    >
      <EmptyStateFooter>
        {errorText && <EmptyStateBody>{errorText}</EmptyStateBody>}
      </EmptyStateFooter>
    </EmptyState>
  );
};

const AlertEmptyState: React.FC<AlertEmptyProps> = ({ drawerToggle }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      headingLevel="h5"
      titleText={<>{t('public~No critical alerts')}</>}
      variant={EmptyStateVariant.full}
      className="co-status-card__alerts-msg"
    >
      <EmptyStateBody>
        {t(
          'public~There are currently no critical alerts firing. There may be firing alerts of other severities or silenced critical alerts however.',
        )}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Link to="/monitoring/alerts" onClick={drawerToggle}>
            {t('public~View all alerts')}
          </Link>
        </EmptyStateActions>
      </EmptyStateFooter>
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

const getUpdateNotificationEntries = (
  canUpgrade: boolean,
  cv: ClusterVersionKind,
  pluginInfoEntries: DynamicPluginInfo[],
  toggleNotificationDrawer: () => void,
): React.ReactNode[] => {
  if (!cv || !canUpgrade) {
    return [];
  }
  const updateData: VersionUpdate[] = getSortedAvailableUpdates(cv);
  const currentChannel = cv?.spec?.channel;
  const currentPrefix = splitClusterVersionChannel(currentChannel)?.prefix;
  const similarChannels = getSimilarClusterVersionChannels(cv, currentPrefix);
  const newerChannel = getNewerClusterVersionChannel(similarChannels, currentChannel);
  const newerChannelVersion = splitClusterVersionChannel(newerChannel)?.version;
  const entries = [];

  const failedPlugins = pluginInfoEntries
    .filter(isNotLoadedDynamicPluginInfo)
    .filter((plugin) => plugin.status === 'Failed');

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
  if (failedPlugins.length > 0) {
    entries.push(
      ...failedPlugins.map((plugin) => {
        const link = resourcePath(referenceForModel(ConsolePluginModel), plugin.pluginName);
        return (
          <NotificationEntry
            actionPath={link}
            actionText={i18next.t('public~View plugin')}
            key={`${plugin.pluginName}-dynamic-plugin-fail`}
            description={i18next.t('public~Something went wrong with the {{pluginName}} plugin.', {
              pluginName: plugin.pluginName,
            })}
            type={NotificationTypes.warning}
            title={i18next.t('public~Dynamic plugin error')}
            toggleNotificationDrawer={toggleNotificationDrawer}
            targetPath={link}
          />
        );
      }),
    );
  }
  return entries;
};

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isDrawerExpanded,
  onDrawerChange,
}) => {
  const { t } = useTranslation();
  const clusterID = getClusterID(useClusterVersion());
  const showServiceLevelNotification = useShowServiceLevelNotifications(clusterID);
  const [pluginInfoEntries] = useDynamicPluginInfo();
  const dispatch = useDispatch();
  const clusterVersion: ClusterVersionKind = useClusterVersion();
  const [alerts, , loadError] = useNotificationAlerts();
  const launchModal = useModal();
  const alertIds = React.useMemo(() => alerts?.map((alert) => alert.rule.name) || [], [alerts]);
  const [alertActionExtensions] = useResolvedExtensions<AlertAction>(
    React.useCallback(
      (e): e is AlertAction => isAlertAction(e) && alertIds.includes(e.properties.alert),
      [alertIds],
    ),
  );

  const toggleNotificationDrawer = () => {
    dispatch(UIActions.notificationDrawerToggleExpanded());
  };

  const alertActionExtensionsMap = React.useMemo(() => getAlertActions(alertActionExtensions), [
    alertActionExtensions,
  ]);

  const canUpgrade = useCanClusterUpgrade();
  const updateList: React.ReactNode[] = getUpdateNotificationEntries(
    canUpgrade,
    clusterVersion,
    pluginInfoEntries,
    toggleNotificationDrawer,
  );

  const [criticalAlerts, nonCriticalAlerts] = React.useMemo(() => {
    const criticalAlertLabelSelector = new LabelSelector({ severity: AlertSeverity.Critical });
    return alerts.reduce<AlertAccumulator>(
      ([criticalAlertAcc, nonCriticalAlertAcc], alert) => {
        return criticalAlertLabelSelector.matchesLabels(alert.labels)
          ? [[...criticalAlertAcc, alert], nonCriticalAlertAcc]
          : [criticalAlertAcc, [...nonCriticalAlertAcc, alert]];
      },
      [[], []],
    );
  }, [alerts]);

  const hasCriticalAlerts = criticalAlerts.length > 0;
  const hasNonCriticalAlerts = nonCriticalAlerts.length > 0;
  const [isAlertExpanded, toggleAlertExpanded] = React.useState<boolean>(hasCriticalAlerts);
  const [isNonCriticalAlertExpanded, toggleNonCriticalAlertExpanded] = React.useState<boolean>(
    true,
  );
  const [isClusterUpdateExpanded, toggleClusterUpdateExpanded] = React.useState<boolean>(true);
  React.useEffect(() => {
    if (hasCriticalAlerts && isDrawerExpanded) {
      toggleAlertExpanded(true);
    }
    if (hasNonCriticalAlerts && isDrawerExpanded) {
      toggleNonCriticalAlertExpanded(true);
    }
  }, [hasCriticalAlerts, hasNonCriticalAlerts, isAlertExpanded, isDrawerExpanded]);

  React.useEffect(() => {
    onDrawerChange();
  }, [isDrawerExpanded, onDrawerChange]);

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
                alertAction={() => action?.action?.(alert, launchModal)}
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
              alertAction={() => action?.action?.(alert, launchModal)}
            />
          );
        })}
      </NotificationCategory>
    ) : null;

  if (showServiceLevelNotification) {
    updateList.push(
      <ServiceLevelNotification
        key="service-level-notification"
        clusterID={clusterID}
        toggleNotificationDrawer={toggleNotificationDrawer}
      />,
    );
  }
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
    <PfNotificationDrawer>
      <NotificationDrawerHeader onClose={toggleNotificationDrawer} />
      <NotificationDrawerBody>
        {[criticalAlertCategory, nonCriticalAlertCategory, recommendationsCategory]}
      </NotificationDrawerBody>
    </PfNotificationDrawer>
  );
};

export type NotificationDrawerProps = {
  toggleNotificationDrawer: () => any;
  isDrawerExpanded: boolean;
  onDrawerChange: () => void;
};

type AlertErrorProps = {
  errorText: string;
};

type AlertEmptyProps = {
  drawerToggle: (event: React.MouseEvent<HTMLElement>) => void;
};

type AlertAccumulator = [Alert[], Alert[]];
