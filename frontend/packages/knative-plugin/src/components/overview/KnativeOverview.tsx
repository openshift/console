import * as React from 'react';
import { ResourceSummary, StatusBox } from '@console/internal/components/utils';
import { OverviewItem, PodRing, usePodsWatcher } from '@console/shared';
import { RevisionModel } from '../../models';

type KnativeOverviewProps = {
  item?: OverviewItem;
};

const KnativeOverview: React.FC<KnativeOverviewProps> = ({ item }) => {
  const { obj } = item;
  const { podData, loaded, loadError } = usePodsWatcher(obj);
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {obj.kind === RevisionModel.kind && (
        <StatusBox loaded={loaded} data={podData} loadError={loadError}>
          <div className="resource-overview__pod-counts">
            <PodRing
              pods={podData?.current ? podData?.current.pods : []}
              obj={obj}
              rc={podData?.current && podData?.current.obj}
              resourceKind={RevisionModel}
              path="/spec/replicas"
            />
          </div>
        </StatusBox>
      )}
      <div className="resource-overview__summary">
        <ResourceSummary resource={obj} />
      </div>
    </div>
  );
};

export default KnativeOverview;
