import { useEffect, useMemo, useState } from 'react';
import * as _ from 'lodash';
import { HIDE_USER_WORKLOAD_NOTIFICATIONS_USER_PREFERENCE_KEY } from '@console/app/src/consts';
import { useNamespacedNotificationAlertsPoller } from '@console/app/src/hooks/useNamespacedNotificationAlertsPoller';
import type { ObjectMetadata } from '@console/internal/module/k8s';
import { LabelSelector } from '@console/internal/module/k8s';
import type { NotificationAlerts } from '@console/internal/reducers/observe';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { SYSTEM_ALERT_RULE_LABEL } from '../constants/monitoring';
import { useUserPreference } from './useUserPreference';

/** Get notification alerts from redux and filter by current user notification settings OR the
  provided override labels. Alerts that match on override labels will not be fitlered even if
  current user settings would normally exclude them.
  @argument overrideMatchLabels optional, filter alerts by proviced labels. Overrides the current \
  user settings.
  @returns [filteredAlerts, loaded, loadError]
*/
export const useNotificationAlerts = (
  overrideMatchLabels?: ObjectMetadata['labels'],
): [NotificationAlerts['data'], NotificationAlerts['loaded'], NotificationAlerts['loadError']] => {
  const [hideUserWorkloadNotifications] = useUserPreference(
    HIDE_USER_WORKLOAD_NOTIFICATIONS_USER_PREFERENCE_KEY,
    true,
    true,
  );
  const { data: alerts, loaded, loadError } = useConsoleSelector<NotificationAlerts>(
    ({ observe }) => observe.get('notificationAlerts') ?? {},
  );

  const [filteredAlerts, setFilteredAlerts] = useState<NotificationAlerts['data']>([]);

  const next = useMemo(() => {
    const alertLabelSelector = new LabelSelector(overrideMatchLabels);
    const alertRuleLabelSelector = new LabelSelector(
      hideUserWorkloadNotifications ? SYSTEM_ALERT_RULE_LABEL : {},
      true,
    );
    return (alerts ?? []).filter(
      (alert) =>
        alertLabelSelector.matchesLabels(alert.labels ?? {}) ||
        alertRuleLabelSelector.matchesLabels(alert.rule.labels ?? {}),
    );
  }, [alerts, overrideMatchLabels, hideUserWorkloadNotifications]);

  useEffect(() => {
    setFilteredAlerts((current) => (_.isEqual(current, next) ? current : next));
  }, [next]);
  return [filteredAlerts, loaded, loadError];
};

/** Fetches notification alerts using the prometheus tenancy api, filter by current user notification
  settings OR the provided override labels. Alerts that match on override labels will not be fitlered even if
  current user settings would normally exclude them.
  @argument overrideMatchLabels optional, filter alerts by proviced labels. Overrides the current \
  user settings.
  @returns [filteredAlerts, loaded, loadError]
*/
export const useNamespacedNotificationAlerts = (
  namespace: string,
  overrideMatchLabels?: ObjectMetadata['labels'],
): [NotificationAlerts['data'], NotificationAlerts['loaded'], NotificationAlerts['loadError']] => {
  const [filteredAlerts, setFilteredAlerts] = useState<NotificationAlerts['data']>([]);

  const { alerts, loaded, loadError } = useNamespacedNotificationAlertsPoller(namespace);

  const [hideUserWorkloadNotifications] = useUserPreference(
    HIDE_USER_WORKLOAD_NOTIFICATIONS_USER_PREFERENCE_KEY,
    true,
    true,
  );

  const next = useMemo(() => {
    const alertLabelSelector = new LabelSelector({ ...overrideMatchLabels, namespace });
    const alertRuleLabelSelector = new LabelSelector(
      hideUserWorkloadNotifications ? SYSTEM_ALERT_RULE_LABEL : {},
      true,
    );
    return (alerts ?? []).filter(
      (alert) =>
        alertLabelSelector.matchesLabels(alert.labels ?? {}) ||
        alertRuleLabelSelector.matchesLabels(alert.rule.labels ?? {}),
    );
  }, [alerts, overrideMatchLabels, hideUserWorkloadNotifications, namespace]);

  useEffect(() => {
    setFilteredAlerts((current) => (_.isEqual(current, next) ? current : next));
  }, [next]);

  return [filteredAlerts, loaded, loadError];
};
