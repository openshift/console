import * as React from 'react';
import { ResourceLink } from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import { PrometheusActivityProps, K8sActivityProps } from '@console/plugin-sdk';
import { getNamespace, getName } from '@console/shared';
import ActivityItem, {
  ActivityProgress,
} from '@console/shared/src/components/dashboard/activity-card/ActivityItem';

export const DemoActivity: React.FC<K8sActivityProps> = ({ resource }) => (
  <ActivityProgress title={`Demo activity for node ${getName(resource)}`} progress={30}>
    <ResourceLink
      kind={NodeModel.kind}
      name={getName(resource)}
      namespace={getNamespace(resource)}
    />
  </ActivityProgress>
);

export const DemoPrometheusActivity: React.FC<PrometheusActivityProps> = () => (
  <ActivityItem>Demo prometheus activity</ActivityItem>
);
