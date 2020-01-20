import * as React from 'react';
import { ClusterVersionKind } from '@console/internal/module/k8s';
import ActivityItem from '@console/shared/src/components/dashboard/activity-card/ActivityItem';

const getVersion = (cv: ClusterVersionKind) =>
  cv && cv.status.history[0] ? cv.status.history[0].version : null;

const ClusterUpgradeActivity: React.FC<ClusterUpgradeActivityProps> = React.memo(
  ({ resource }) => <ActivityItem>{`Upgrading cluster to ${getVersion(resource)}`}</ActivityItem>,
  (prevProps, newProps) => getVersion(prevProps.resource) === getVersion(newProps.resource),
);

export default ClusterUpgradeActivity;

type ClusterUpgradeActivityProps = {
  resource: ClusterVersionKind;
};
