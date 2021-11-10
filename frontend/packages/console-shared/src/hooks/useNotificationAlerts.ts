import * as React from 'react';
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useSelector } from 'react-redux';
import { HIDE_USER_WORKLOAD_NOTIFICATIONS_USER_SETTINGS_KEY } from '@console/app/src/consts';
import { Alert } from '@console/dynamic-plugin-sdk';
import { LabelSelector, ObjectMetadata } from '@console/internal/module/k8s';
import { NotificationAlerts } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { SYSTEM_ALERT_RULE_LABEL } from '../constants/monitoring';
import { useUserSettings } from './useUserSettings';

/** Get notification alerts from redux and filter by current user notification settings OR the
  provided override labels. Alerts that match on override labels will not be fitlered even if
  current user settings would normally exclude them.
  @argument overrideMatchLabels optional, filter alerts by proviced labels. Overrides the current \
  user settings.
  @returns [filteredAlerts, loaded, loadError]
*/
export const useNotificationAlerts = (
  overrideMatchLabels?: ObjectMetadata['labels'],
): [Alert[], boolean, Error] => {
  const [hideUserWorkloadNotifications] = useUserSettings(
    HIDE_USER_WORKLOAD_NOTIFICATIONS_USER_SETTINGS_KEY,
    true,
    true,
  );
  const { data: alerts, loaded, loadError } = useSelector<NotificationAlerts>(
    ({ UI }: RootState) => UI.getIn(['monitoring', 'notificationAlerts']) ?? {},
  );

  const [filteredAlerts, setFilteredAlerts] = React.useState<Alert[]>([]);

  const next = React.useMemo(() => {
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

  React.useEffect(() => {
    setFilteredAlerts((current) => (_.isEqual(current, next) ? current : next));
  }, [next]);
  return [filteredAlerts, loaded, loadError];
};
