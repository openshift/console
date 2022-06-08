import * as React from 'react';
import { useNotificationAlerts } from '@console/shared/src/hooks/useNotificationAlerts';
import { Alert } from 'public/components/monitoring/types';

export type UseFilteredAlerts = (filter: any) => Alert[];

const useFilteredAlerts: UseFilteredAlerts = (filter) => {
  const [alerts] = useNotificationAlerts();
  return React.useMemo(() => alerts?.filter((alert) => filter(alert)), [alerts, filter]);
};

export default useFilteredAlerts;
