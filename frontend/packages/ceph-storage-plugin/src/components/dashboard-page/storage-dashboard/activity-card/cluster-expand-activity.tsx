import * as React from 'react';
import ActivityItem from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const ClusterExpandActivity: React.FC = () => (
  <ActivityItem>Expanding OCS Cluster</ActivityItem>
);

export const isClusterExpandActivity = (storageCluster: K8sResourceKind): boolean =>
  storageCluster?.status?.phase === 'Expanding';
