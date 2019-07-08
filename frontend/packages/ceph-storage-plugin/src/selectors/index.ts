import * as _ from 'lodash';
import { Alert } from '@console/internal/components/monitoring';

export const filterCephAlerts = (alerts: Alert[]): Alert[] =>
  alerts.filter((alert) => _.get(alert, 'annotations.storage_type') === 'ceph');
