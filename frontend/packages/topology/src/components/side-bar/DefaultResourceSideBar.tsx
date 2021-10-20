import * as React from 'react';
import { ResourceSummary } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const DefaultResourceSideBar: React.FC<{ resource: K8sResourceKind }> = ({ resource }) => {
  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-body resource-overview__body">
        <div className="resource-overview__summary">
          <ResourceSummary resource={resource} />
        </div>
      </div>
    </div>
  );
};
