import { Alert } from '@console/internal/components/monitoring/types';
import { history } from '@console/internal/components/utils';

export const getAlertActionPath = (alertData: Alert) =>
  history.push(
    `/k8s/cluster/nodes/${alertData.labels.host}/disks?node-disk-name=${alertData.labels.device}`,
  );
