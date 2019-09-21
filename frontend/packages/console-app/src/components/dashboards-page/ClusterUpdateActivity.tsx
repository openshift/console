import * as React from 'react';
import {
  ClusterVersionKind,
  getClusterUpdateStatus,
  ClusterUpdateStatus,
} from '@console/internal/module/k8s';
import { ActivityItem } from '@console/internal/components/dashboard/activity-card/activity-item';

export const isClusterUpdateActivity = (cv: ClusterVersionKind) =>
  getClusterUpdateStatus(cv) === ClusterUpdateStatus.Updating;

export const getClusterUpdateTimestamp = (cv: ClusterVersionKind) =>
  cv && cv.status.history[0] ? new Date(cv.status.history[0].startedTime) : null;

const getVersion = (cv: ClusterVersionKind) =>
  cv && cv.status.history[0] ? cv.status.history[0].version : null;

const ClusterUpdateActivity: React.FC<ClusterUpdateActivityProps> = React.memo(
  ({ resource }) => <ActivityItem title={`Updating cluster to ${getVersion(resource)}`} />,
  (prevProps, newProps) => getVersion(prevProps.resource) === getVersion(newProps.resource),
);

export default ClusterUpdateActivity;

type ClusterUpdateActivityProps = {
  resource: ClusterVersionKind;
};
