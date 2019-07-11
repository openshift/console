import * as _ from 'lodash';
import { Alert } from '@console/internal/components/monitoring';

export const getPropsData = (data) => _.get(data, 'data.result[0].value[1]', null);

export const filterNooBaaAlerts = (alerts: Alert[]): Alert[] =>
  alerts.filter((alert) => _.get(alert, 'annotations.storage_type') === 'NooBaa');
