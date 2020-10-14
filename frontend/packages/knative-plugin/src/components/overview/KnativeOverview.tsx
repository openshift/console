import * as React from 'react';
import { ResourceSummary } from '@console/internal/components/utils';
import { OverviewItem, PodRing } from '@console/shared';
import { RevisionModel } from '../../models';
import { usePodsForRevisions } from '../../utils/usePodsForRevisions';

type KnativeOverviewProps = {
  item?: OverviewItem;
};

export const KnativeOverviewRevisionPodsRing: React.FC<KnativeOverviewProps> = ({ item }) => {
  const { obj } = item;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const revisions = React.useMemo(() => [obj], [obj.metadata.uid]);
  const { pods } = usePodsForRevisions(revisions, obj.metadata.namespace);
  return (
    <div className="resource-overview__pod-counts">
      <PodRing
        pods={pods?.[0]?.pods || []}
        obj={obj}
        rc={pods?.[0]?.obj}
        resourceKind={RevisionModel}
        path="/spec/replicas"
      />
    </div>
  );
};

const KnativeOverview: React.FC<KnativeOverviewProps> = ({ item }) => {
  const { obj } = item;
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {obj.kind === RevisionModel.kind ? <KnativeOverviewRevisionPodsRing item={item} /> : null}
      <div className="resource-overview__summary">
        <ResourceSummary resource={obj} />
      </div>
    </div>
  );
};

export default KnativeOverview;
