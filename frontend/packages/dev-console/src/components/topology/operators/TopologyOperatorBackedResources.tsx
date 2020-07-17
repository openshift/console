import * as React from 'react';
import OperatorBackedOwnerReferences from '@console/internal/components/utils';
import { TopologyDataObject } from '../topology-types';
import TopologyGroupResourcesPanel from '../components/TopologyGroupResourcesPanel';
import { OverviewItem } from '@console/shared';

type TopologyOperatorBackedResourcesProps = {
  item: TopologyDataObject;
};

const TopologyOperatorBackedResources: React.FC<TopologyOperatorBackedResourcesProps> = ({
  item,
}) => {
  const { groupResources = [] } = item;
  const finalRes = groupResources.map((val) => val.resources.obj);
  const ownerReferencedResources = groupResources.reduce(
    (acc, val) => {
      acc.obj = { ...val.resources.obj, ...acc.obj };
      return acc;
    },
    { obj: {}, isOperatorBackedService: true },
  );

  return (
    <div className="overview__sidebar-pane-body">
      <OperatorBackedOwnerReferences item={ownerReferencedResources as OverviewItem} />
      <TopologyGroupResourcesPanel
        manifestResources={finalRes}
        releaseNamespace={item.resources.obj.metadata.namespace}
      />
    </div>
  );
};

export default TopologyOperatorBackedResources;
