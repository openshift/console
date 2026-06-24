import * as _ from 'lodash';
import {
  FC,
  ReactElement,
  ReactNode,
  MouseEvent,
  Ref,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { Link, NavigateFunction, useNavigate } from 'react-router';
import type { PluginInfoEntry } from '@openshift/dynamic-plugin-sdk';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import * as UIActions from '@console/internal/actions/ui';
import { resourcePath } from '@console/internal/components/utils/resource-link';
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
} from '@console/shared/src/components/status/icons';
import { useCanClusterUpgrade } from '@console/shared/src/hooks/useCanClusterUpgrade';
import {
  getAlertDescription,
  getAlertMessage,
  getAlertName,
  getAlertSeverity,
  getAlertTime,
} from '@console/shared/src/components/dashboard/status-card/alert-utils';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
  MenuToggle,
  MenuToggleElement,
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
import { useClusterVersion } from '@console/shared/src/hooks/useClusterVersion';
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
import { LinkifyExternal } from './utils/link';
import { LabelSelector } from '@console/internal/module/k8s/label-selector';
import { useNotificationAlerts } from '@console/shared/src/hooks/useNotificationAlerts';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { DEFAULT_TOAST_DRAWER_GROUP } from '@console/shared/src/components/toast/types';
import { useNotificationHistory } from '@console/shared/src/components/toast/useNotificationHistory';
import {
  getCustomToastDrawerGroups,
  getToastDrawerGroupTitle,
  getToastNotificationsForGroup,
  groupToastNotifications,
} from '@console/shared/src/components/toast/toastNotificationUtils';
import { ToastNotificationDrawerItems } from './ToastNotificationDrawerItems';
import { NotificationTypes } from './utils/types';
import { RhUiEllipsisVerticalIcon } from '@patternfly/react-icons';

const AlertErrorState: FC<AlertErrorProps> = ({ errorText }) => {
  const { t } = useTranslation('public');
  return (
    <EmptyState
      headingLevel="h5"
      icon={RedExclamationCircleIcon}
      titleText={<>{t('Alerts could not be loaded')}</>}
      variant={EmptyStateVariant.full}
    >
      <EmptyStateFooter>
        {errorText && <EmptyStateBody>{errorText}</EmptyStateBody>}
      </EmptyStateFooter>
    </EmptyState>
  );
};

const AlertEmptyState: FC<AlertEmptyProps> = ({ drawerToggle }) => {
  const { t } = useTranslation('public');
  return (
    <EmptyState
      headingLevel="h5"
      titleText={<>{t('No critical alerts')}</>}
      variant={EmptyStateVariant.full}
      className="co-status-card__alerts-msg"
    >
      <EmptyStateBody>
        {t(
          'There are currently no critical alerts firing. There may be firing alerts of other severities or silenced critical alerts however.',
        )}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Link to="/monitoring/alerts" onClick={drawerToggle}>
            {t('View all alerts')}
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
    action: () => navigate('/settings/cluster/alertmanagerconfig'),
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
  pluginInfoEntries: PluginInfoEntry[],
  itemOnClick: (location: string) => void,
): ReactNode[] => {
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

  const failedPlugins = pluginInfoEntries.filter((plugin) => plugin.status === 'failed');

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
          key={`${plugin.manifest.name}-dynamic-plugin-fail`}
          onClick={() => {
            itemOnClick(resourcePath(referenceForModel(ConsolePluginModel), plugin.manifest.name));
          }}
        >
          <NotificationDrawerListItemHeader
            variant={NotificationTypes.warning}
            title={i18next.t('public~Dynamic plugin error')}
          />
          <NotificationDrawerListItemBody>
            {i18next.t('public~Something went wrong with the {{pluginName}} plugin.', {
              pluginName: plugin.manifest.name,
            })}
          </NotificationDrawerListItemBody>
        </NotificationDrawerListItem>
      )),
    );
  }
  return entries;
};

export const NotificationDrawer: FC<NotificationDrawerProps> = ({
  isDrawerExpanded,
  onDrawerChange,
  drawerRef,
}) => {
  const { t } = useTranslation('public');
  const clusterID = getClusterID(useClusterVersion());
  const showServiceLevelNotification = useShowServiceLevelNotifications(clusterID);
  const pluginInfoEntries = usePluginInfo();
  const dispatch = useConsoleDispatch();
  const clusterVersion: ClusterVersionKind = useClusterVersion();
  const [alerts, , loadError] = useNotificationAlerts();
  const launchModal = useOverlay();
  const alertIds = useMemo(() => alerts?.map((alert) => alert.rule.name) || [], [alerts]);
  const [alertActionExtensions] = useResolvedExtensions<AlertAction>(
    useCallback(
      (e): e is AlertAction => isAlertAction(e) && alertIds.includes(e.properties.alert),
      [alertIds],
    ),
  );
  const {
    notifications: toastNotifications,
    unreadCount: toastUnreadCount,
    markNotificationRead,
    markNotificationUnread,
    clearNotification,
    clearAllNotifications,
    markAllNotificationsRead,
  } = useNotificationHistory();
  const groupedToastNotifications = useMemo(() => groupToastNotifications(toastNotifications), [
    toastNotifications,
  ]);
  const otherAlertsToastNotifications = getToastNotificationsForGroup(
    groupedToastNotifications,
    DEFAULT_TOAST_DRAWER_GROUP,
  );
  const customToastDrawerGroups = getCustomToastDrawerGroups(groupedToastNotifications);
  const [isHeaderActionsOpen, setIsHeaderActionsOpen] = useState(false);

  const toggleNotificationDrawer = () => {
    dispatch(UIActions.notificationDrawerToggleExpanded());
  };
  const navigate = useNavigate();
  const itemOnClick = (location: string) => {
    toggleNotificationDrawer();
    navigate(location);
  };

  const alertActionExtensionsMap = useMemo(() => getAlertActions(alertActionExtensions, navigate), [
    alertActionExtensions,
    navigate,
  ]);

  const canUpgrade = useCanClusterUpgrade();
  const updateList: ReactNode[] = getUpdateNotificationEntries(
    canUpgrade,
    clusterVersion,
    pluginInfoEntries,
    itemOnClick,
  );

  const [criticalAlerts, nonCriticalAlerts] = useMemo(() => {
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
  const hasOtherAlertsToastNotifications = otherAlertsToastNotifications.length > 0;
  const [isAlertExpanded, toggleAlertExpanded] = useState(hasCriticalAlerts);
  const [isNonCriticalAlertExpanded, toggleNonCriticalAlertExpanded] = useState(true);
  const [isClusterUpdateExpanded, toggleClusterUpdateExpanded] = useState(true);
  const [expandedToastGroups, setExpandedToastGroups] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (hasCriticalAlerts && isDrawerExpanded) {
      toggleAlertExpanded(true);
    }
    if (hasNonCriticalAlerts && isDrawerExpanded) {
      toggleNonCriticalAlertExpanded(true);
    }
  }, [hasCriticalAlerts, hasNonCriticalAlerts, isDrawerExpanded]);

  useEffect(() => {
    onDrawerChange();
  }, [isDrawerExpanded, onDrawerChange]);

  const emptyState = loadError ? (
    <AlertErrorState errorText={loadError.toString()} />
  ) : (
    <AlertEmptyState drawerToggle={toggleNotificationDrawer} />
  );

  const ItemActionButton: FC<ItemActionButtonProps> = ({ alert }) => {
    const action = alertActionExtensionsMap.get(alert.rule.name);
    if (!action?.action && !action?.text) {
      return null;
    }

    return (
      <Button
        variant="link"
        onClick={(event) => {
          event.stopPropagation();
          toggleNotificationDrawer();
          action.action?.(alert, launchModal);
        }}
      >
        {action.text}
      </Button>
    );
  };

  const criticalAlertCategory: ReactElement = (
    <NotificationDrawerGroup
      key="critical-alerts"
      isExpanded={isAlertExpanded}
      title={t('Critical Alerts')}
      count={criticalAlerts.length}
      onExpand={() => {
        toggleAlertExpanded(!isAlertExpanded);
      }}
    >
      <NotificationDrawerList
        isHidden={!isAlertExpanded}
        aria-label={t('Notifications in the critical alerts group')}
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
  const nonCriticalAlertCategory: ReactElement =
    hasNonCriticalAlerts || hasOtherAlertsToastNotifications ? (
      <NotificationDrawerGroup
        key="other-alerts"
        isExpanded={isNonCriticalAlertExpanded}
        title={t('Other Alerts')}
        count={nonCriticalAlerts.length + otherAlertsToastNotifications.length}
        onExpand={() => {
          toggleNonCriticalAlertExpanded(!isNonCriticalAlertExpanded);
        }}
      >
        <NotificationDrawerList
          isHidden={!isNonCriticalAlertExpanded}
          aria-label={t('Notifications in the other alerts group')}
        >
          <ToastNotificationDrawerItems
            notifications={otherAlertsToastNotifications}
            onClear={clearNotification}
            onMarkRead={markNotificationRead}
            onMarkUnread={markNotificationUnread}
          />
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

  const toastNotificationCategories: ReactElement[] = customToastDrawerGroups.map((groupName) => {
    const groupNotifications = getToastNotificationsForGroup(groupedToastNotifications, groupName);
    const groupTitle = getToastDrawerGroupTitle(groupName, t);
    const isExpanded = expandedToastGroups[groupName] ?? true;

    return (
      <NotificationDrawerGroup
        key={`toast-group-${groupName}`}
        isExpanded={isExpanded}
        title={groupTitle}
        count={groupNotifications.length}
        onExpand={() => {
          setExpandedToastGroups((state) => ({
            ...state,
            [groupName]: !isExpanded,
          }));
        }}
      >
        <NotificationDrawerList
          isHidden={!isExpanded}
          aria-label={t('Notifications in the {{groupName}} group', { groupName: groupTitle })}
        >
          <ToastNotificationDrawerItems
            notifications={groupNotifications}
            onClear={clearNotification}
            onMarkRead={markNotificationRead}
            onMarkUnread={markNotificationUnread}
          />
        </NotificationDrawerList>
      </NotificationDrawerGroup>
    );
  });

  if (showServiceLevelNotification) {
    updateList.push(
      <ServiceLevelNotification key="service-level-notification" clusterID={clusterID} />,
    );
  }
  const recommendationsCategory: ReactElement = !_.isEmpty(updateList) ? (
    <NotificationDrawerGroup
      key="recommendations"
      isExpanded={isClusterUpdateExpanded}
      title={t('Recommendations')}
      count={updateList.length}
      onExpand={() => {
        toggleClusterUpdateExpanded(!isClusterUpdateExpanded);
      }}
    >
      <NotificationDrawerList
        isHidden={!isClusterUpdateExpanded}
        aria-label={t('Notifications in the recommendations group')}
      >
        {updateList}
      </NotificationDrawerList>
    </NotificationDrawerGroup>
  ) : null;

  return (
    <PfNotificationDrawer ref={drawerRef}>
      <NotificationDrawerHeader
        title={t('Notifications')}
        count={toastUnreadCount || undefined}
        unreadText={toastUnreadCount ? t('unread') : undefined}
        onClose={toggleNotificationDrawer}
      >
        {toastNotifications.length > 0 && (
          <Dropdown
            isOpen={isHeaderActionsOpen}
            onOpenChange={(open) => setIsHeaderActionsOpen(open)}
            onSelect={() => setIsHeaderActionsOpen(false)}
            popperProps={{ position: 'right' }}
            toggle={(toggleRef: Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                isExpanded={isHeaderActionsOpen}
                variant="plain"
                onClick={() => setIsHeaderActionsOpen(!isHeaderActionsOpen)}
                aria-label={t('Notification drawer actions')}
                icon={<RhUiEllipsisVerticalIcon />}
              />
            )}
          >
            <DropdownList>
              <DropdownItem onClick={markAllNotificationsRead}>{t('Mark all read')}</DropdownItem>
              <DropdownItem onClick={clearAllNotifications}>{t('Clear all')}</DropdownItem>
            </DropdownList>
          </Dropdown>
        )}
      </NotificationDrawerHeader>
      <NotificationDrawerBody>
        <NotificationDrawerGroupList>
          {[
            criticalAlertCategory,
            nonCriticalAlertCategory,
            ...toastNotificationCategories,
            recommendationsCategory,
          ]}
        </NotificationDrawerGroupList>
      </NotificationDrawerBody>
    </PfNotificationDrawer>
  );
};

export type NotificationDrawerProps = {
  isDrawerExpanded: boolean;
  onDrawerChange: () => void;
  drawerRef: Ref<HTMLElement>;
};

type AlertErrorProps = {
  errorText: string;
};

type AlertEmptyProps = {
  drawerToggle: (event: MouseEvent<HTMLElement>) => void;
};

type AlertAccumulator = [Alert[], Alert[]];

type ItemActionButtonProps = {
  alert: Alert;
};
