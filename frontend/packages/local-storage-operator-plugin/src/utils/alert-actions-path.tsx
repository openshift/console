import { Alert } from '@console/internal/components/monitoring/types';

export const getAlertActionPath = (alertData: Alert) =>
  `/k8s/cluster/nodes/${alertData.labels.host}/disks/node-disk-name=${alertData.labels.device}`;
