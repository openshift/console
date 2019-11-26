import * as React from 'react';
import { ActivityProgress } from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { NodeModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getNodeMaintenanceProgressPercent } from '../../selectors';

const MaintenanceActivity: React.FC<MaintenanceActivityProps> = ({ resource }) => (
  <ActivityProgress
    title="Starting maintenance"
    progress={getNodeMaintenanceProgressPercent(resource)}
  >
    <ResourceLink kind={NodeModel.kind} name={resource.spec.nodeName} />
  </ActivityProgress>
);

export default MaintenanceActivity;

type MaintenanceActivityProps = {
  resource: K8sResourceKind;
};
