import * as React from 'react';
import { useTranslation } from 'react-i18next';
import ActivityItem from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/activity-card/ActivityItem';
import { ClusterVersionKind } from '@console/internal/module/k8s';

const getVersion = (cv: ClusterVersionKind) =>
  cv && cv.status.history[0] ? cv.status.history[0].version : null;

const ClusterUpdateActivityText: React.FC<ClusterUpdateActivityProps> = ({ resource }) => {
  const { t } = useTranslation();
  return (
    <ActivityItem>
      {t('console-app~Updating cluster to {{version}}', { version: getVersion(resource) })}
    </ActivityItem>
  );
};

const ClusterUpdateActivity: React.FC<ClusterUpdateActivityProps> = React.memo(
  ({ resource }) => <ClusterUpdateActivityText resource={resource} />,
  (prevProps, newProps) => getVersion(prevProps.resource) === getVersion(newProps.resource),
);

export default ClusterUpdateActivity;

type ClusterUpdateActivityProps = {
  resource: ClusterVersionKind;
};
