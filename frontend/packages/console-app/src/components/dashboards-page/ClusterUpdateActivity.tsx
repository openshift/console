import * as React from 'react';
import { ClusterVersionKind } from '@console/internal/module/k8s';
import ActivityItem from '@console/shared/src/components/dashboard/activity-card/ActivityItem';

const getVersion = (cv: ClusterVersionKind) =>
  cv && cv.status.history[0] ? cv.status.history[0].version : null;

const ClusterUpdateActivity: React.FC<ClusterUpdateActivityProps> = React.memo(
  ({ resource }) => <ActivityItem>{`Updating cluster to ${getVersion(resource)}`}</ActivityItem>,
  (prevProps, newProps) => getVersion(prevProps.resource) === getVersion(newProps.resource),
);

export default ClusterUpdateActivity;

type ClusterUpdateActivityProps = {
  resource: ClusterVersionKind;
};
