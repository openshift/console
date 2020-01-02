import * as React from 'react';
import { ResourceSummary } from '@console/internal/components/utils';
import { OverviewItem, PodRing } from '@console/shared';
import { RevisionModel } from '../../models';

export type KnativeOverviewProps = {
  item?: OverviewItem;
};

export const KnativeOverview: React.FC<KnativeOverviewProps> = ({ item }) => {
  const { obj, current } = item;
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {obj.kind === RevisionModel.kind && (
        <div className="resource-overview__pod-counts">
          <PodRing
            pods={current ? current.pods : []}
            obj={obj}
            rc={current && current.obj}
            resourceKind={RevisionModel}
            path="/spec/replicas"
          />
        </div>
      )}
      <div className="resource-overview__summary">
        <ResourceSummary resource={obj} />
      </div>
    </div>
  );
};
