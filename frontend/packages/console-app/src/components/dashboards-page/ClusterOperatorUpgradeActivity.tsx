import * as React from 'react';
import { ClusterOperator, referenceForModel } from '@console/internal/module/k8s';
import { getName } from '@console/shared/src/selectors/common';
import ActivityItem from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { ClusterOperatorModel } from '@console/internal/models';

import './activity.scss';

const ClusterOperatorUpgradeActivity: React.FC<ClusterOperatorUpgradeActivityProps> = ({
  resource,
}) => (
  <>
    <ActivityItem>Upgrading</ActivityItem>
    <ResourceLink
      kind={referenceForModel(ClusterOperatorModel)}
      name={getName(resource)}
      inline
      className="co-cluster-operator__upgrade"
    />
  </>
);

export default ClusterOperatorUpgradeActivity;

type ClusterOperatorUpgradeActivityProps = {
  resource: ClusterOperator;
};
