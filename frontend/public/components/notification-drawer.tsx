import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { useDispatch } from 'react-redux';
import { Link, NavigateFunction, useNavigate } from 'react-router-dom-v5-compat';
import {
  isNotLoadedDynamicPluginInfo,
  useDynamicPluginInfo,
  DynamicPluginInfo,
} from '@console/plugin-sdk';
import * as UIActions from '@console/internal/actions/ui';
import { resourcePath } from '@console/internal/components/utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';

import { getClusterID } from '@console/internal/module/k8s/cluster-settings';

import {
  ServiceLevelNotification,
  useShowServiceLevelNotifications,
} from '@console/internal/components/utils/service-level';
import { alertURL } from '@console/internal/components/monitoring/utils';
import {
  BlueArrowCircleUpIcon,
  RedExclamationCircleIcon,
  useCanClusterUpgrade,
} from '@console/shared';
import {
  getAlertDescription,
  getAlertMessage,
  getAlertName,
  getAlertSeverity,
  getAlertTime,
} from '@console/shared/src/components/dashboard/status-card/alert-utils';
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
  NotificationDrawer as PfNotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerGroup,
  NotificationDrawerGroupList,
  NotificationDrawerHeader,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
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

export enum NotificationTypes {
  info = 'info',
  warning = 'warning',
  critical = 'danger',
  success = 'success',
}

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
export const getAlertActions = (
  actionsExtensions: ResolvedExtension<AlertAction>[],
  navigate: NavigateFunction,
) => {
  const alertActions = new Map<
    string,
    Omit<ResolvedExtension<AlertAction>['properties'], 'alert'>
  >().set('AlertmanagerReceiversNotConfigured', {
    text: i18next.t('public~Configure'),
    action: () => navigate('/monitoring/alertmanagerconfig'),
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
  itemOnClick: (location: string) => void,
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
      <NotificationDrawerListItem
        variant={NotificationTypes.info}
        key="cluster-update"
        onClick={() => {
          itemOnClick('/settings/cluster?showVersions');
        }}
      >
        <NotificationDrawerListItemHeader
          variant={NotificationTypes.info}
          title={i18next.t('public~Cluster update available')}
          icon={<BlueArrowCircleUpIcon />}
        />
        <NotificationDrawerListItemBody>
          {updateData[0].version || i18next.t('public~Unknown')}
        </NotificationDrawerListItemBody>
      </NotificationDrawerListItem>,
    );
  }
  if (newerChannel) {
    entries.push(
      <NotificationDrawerListItem
        variant={NotificationTypes.info}
        key="channel-update"
        onClick={() => {
          itemOnClick('/settings/cluster?showChannels');
        }}
      >
        <NotificationDrawerListItemHeader
          variant={NotificationTypes.info}
          title={i18next.t('public~{{newerChannel}} channel available', {
            newerChannel,
          })}
          icon={<BlueArrowCircleUpIcon />}
        />
        <NotificationDrawerListItemBody>
          {i18next.t(
            'public~The {{newerChannel}} channel is available. If you are interested in updating this cluster to {{newerChannelVersion}} in the future, change the update channel to {{newerChannel}} to receive recommended updates.',
            { newerChannel, newerChannelVersion },
          )}
        </NotificationDrawerListItemBody>
      </NotificationDrawerListItem>,
    );
  }
  if (failedPlugins.length > 0) {
    entries.push(
      ...failedPlugins.map((plugin) => (
        <NotificationDrawerListItem
          variant={NotificationTypes.warning}
          key={`${plugin.pluginName}-dynamic-plugin-fail`}
          onClick={() => {
            itemOnClick(resourcePath(referenceForModel(ConsolePluginModel), plugin.pluginName));
          }}
        >
          <NotificationDrawerListItemHeader
            variant={NotificationTypes.warning}
            title={i18next.t('public~Dynamic plugin error')}
          />
          <NotificationDrawerListItemBody>
            {i18next.t('public~Something went wrong with the {{pluginName}} plugin.', {
              pluginName: plugin.pluginName,
            })}
          </NotificationDrawerListItemBody>
        </NotificationDrawerListItem>
      )),
    );
  }
  return entries;
};

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isDrawerExpanded,
  onDrawerChange,
  drawerRef,
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
  const navigate = useNavigate();
  const itemOnClick = (location: string) => {
    toggleNotificationDrawer();
    navigate(location);
  };

  const alertActionExtensionsMap = React.useMemo(
    () => getAlertActions(alertActionExtensions, navigate),
    [alertActionExtensions, navigate],
  );

  const canUpgrade = useCanClusterUpgrade();
  const updateList: React.ReactNode[] = getUpdateNotificationEntries(
    canUpgrade,
    clusterVersion,
    pluginInfoEntries,
    itemOnClick,
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
  const [isAlertExpanded, toggleAlertExpanded] = React.useState(hasCriticalAlerts);
  const [isNonCriticalAlertExpanded, toggleNonCriticalAlertExpanded] = React.useState(true);
  const [isClusterUpdateExpanded, toggleClusterUpdateExpanded] = React.useState(true);
  React.useEffect(() => {
    if (hasCriticalAlerts && isDrawerExpanded) {
      toggleAlertExpanded(true);
    }
    if (hasNonCriticalAlerts && isDrawerExpanded) {
      toggleNonCriticalAlertExpanded(true);
    }
  }, [hasCriticalAlerts, hasNonCriticalAlerts, isDrawerExpanded]);

  React.useEffect(() => {
    onDrawerChange();
  }, [isDrawerExpanded, onDrawerChange]);

  const emptyState = loadError ? (
    <AlertErrorState errorText={loadError.toString()} />
  ) : (
    <AlertEmptyState drawerToggle={toggleNotificationDrawer} />
  );

  const ItemActionButton: React.FC<ItemActionButtonProps> = ({ alert }) => {
    const action = alertActionExtensionsMap.get(alert.rule.name);
    if (!action?.action && !action?.text) {
      return null;
    }

    return (
      <Button
        variant="link"
        onClick={(_event: React.MouseEvent<Element, MouseEvent> | undefined) => {
          _event.stopPropagation();
          toggleNotificationDrawer();
          action.action?.(alert, launchModal);
        }}
      >
        {action.text}
      </Button>
    );
  };

  const criticalAlertCategory: React.ReactElement = (
    <NotificationDrawerGroup
      key="critical-alerts"
      isExpanded={isAlertExpanded}
      title={t('public~Critical Alerts')}
      count={criticalAlerts.length}
      onExpand={() => {
        toggleAlertExpanded(!isAlertExpanded);
      }}
    >
      <NotificationDrawerList
        isHidden={!isAlertExpanded}
        aria-label={t('public~Notifications in the critical alerts group')}
      >
        {criticalAlerts.length > 0
          ? criticalAlerts.map((alert, i) => {
              const alertVariant = NotificationTypes[getAlertSeverity(alert)];
              const alertTime = getAlertTime(alert);
              return (
                <NotificationDrawerListItem
                  variant={alertVariant}
                  key={`${i}_${alert.activeAt}`}
                  onClick={() => {
                    itemOnClick(alertURL(alert, alert.rule.id));
                  }}
                >
                  <NotificationDrawerListItemHeader
                    variant={alertVariant}
                    title={getAlertName(alert)}
                  >
                    <ItemActionButton alert={alert} />
                  </NotificationDrawerListItemHeader>
                  <NotificationDrawerListItemBody
                    timestamp={alertTime && <Timestamp simple timestamp={alertTime} />}
                  >
                    <LinkifyExternal>
                      {getAlertDescription(alert) || getAlertMessage(alert)}
                    </LinkifyExternal>
                  </NotificationDrawerListItemBody>
                </NotificationDrawerListItem>
              );
            })
          : emptyState}
      </NotificationDrawerList>
    </NotificationDrawerGroup>
  );
  const nonCriticalAlertCategory: React.ReactElement =
    nonCriticalAlerts.length > 0 ? (
      <NotificationDrawerGroup
        key="other-alerts"
        isExpanded={isNonCriticalAlertExpanded}
        title={t('public~Other Alerts')}
        count={nonCriticalAlerts.length}
        onExpand={() => {
          toggleNonCriticalAlertExpanded(!isNonCriticalAlertExpanded);
        }}
      >
        <NotificationDrawerList
          isHidden={!isNonCriticalAlertExpanded}
          aria-label={t('public~Notifications in the other alerts group')}
        >
          {nonCriticalAlerts.map((alert, i) => {
            const alertVariant = NotificationTypes[getAlertSeverity(alert)];
            const alertTime = getAlertTime(alert);
            return (
              <NotificationDrawerListItem
                variant={alertVariant}
                key={`${i}_${alert.activeAt}`}
                onClick={() => {
                  itemOnClick(alertURL(alert, alert.rule.id));
                }}
              >
                <NotificationDrawerListItemHeader
                  variant={alertVariant}
                  title={getAlertName(alert)}
                >
                  <ItemActionButton alert={alert} />
                </NotificationDrawerListItemHeader>
                <NotificationDrawerListItemBody
                  timestamp={alertTime && <Timestamp simple timestamp={alertTime} />}
                >
                  <LinkifyExternal>
                    {getAlertDescription(alert) || getAlertMessage(alert)}
                  </LinkifyExternal>
                </NotificationDrawerListItemBody>
              </NotificationDrawerListItem>
            );
          })}
        </NotificationDrawerList>
      </NotificationDrawerGroup>
    ) : null;

  if (showServiceLevelNotification) {
    updateList.push(
      <ServiceLevelNotification key="service-level-notification" clusterID={clusterID} />,
    );
  }
  const recommendationsCategory: React.ReactElement = !_.isEmpty(updateList) ? (
    <NotificationDrawerGroup
      key="recommendations"
      isExpanded={isClusterUpdateExpanded}
      title={t('public~Recommendations')}
      count={updateList.length}
      onExpand={() => {
        toggleClusterUpdateExpanded(!isClusterUpdateExpanded);
      }}
    >
      <NotificationDrawerList
        isHidden={!isClusterUpdateExpanded}
        aria-label={t('public~Notifications in the recommendations group')}
      >
        {updateList}
      </NotificationDrawerList>
    </NotificationDrawerGroup>
  ) : null;

  return (
    <PfNotificationDrawer ref={drawerRef}>
      <NotificationDrawerHeader onClose={toggleNotificationDrawer} />
      <NotificationDrawerBody>
        <NotificationDrawerGroupList>
          {[criticalAlertCategory, nonCriticalAlertCategory, recommendationsCategory]}
        </NotificationDrawerGroupList>
      </NotificationDrawerBody>
    </PfNotificationDrawer>
  );
};

export type NotificationDrawerProps = {
  isDrawerExpanded: boolean;
  onDrawerChange: () => void;
  drawerRef: React.Ref<HTMLElement>;
};

type AlertErrorProps = {
  errorText: string;
};

type AlertEmptyProps = {
  drawerToggle: (event: React.MouseEvent<HTMLElement>) => void;
};

type AlertAccumulator = [Alert[], Alert[]];

type ItemActionButtonProps = {
  alert: Alert;
};
