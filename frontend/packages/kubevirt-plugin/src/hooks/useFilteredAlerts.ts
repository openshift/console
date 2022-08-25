import * as React from 'react';
import { Alert } from '@console/dynamic-plugin-sdk';
import { useNotificationAlerts } from '@console/shared/src/hooks/useNotificationAlerts';

export type UseFilteredAlerts = (filter: any) => [Alert[], boolean, Error];

const useFilteredAlerts: UseFilteredAlerts = (filter) => {
  const [alerts, loaded, loadError] = useNotificationAlerts();
  const filteredAlerts: Alert[] = React.useMemo(() => alerts?.filter((alert) => filter(alert)), [
    alerts,
    filter,
  ]);
  return [filteredAlerts, loaded, loadError];
};

export default useFilteredAlerts;
