import * as React from 'react';
import { TopologyDataObject } from '../topology-types';
import TopologyGroupResourcesPanel from '../components/TopologyGroupResourcesPanel';

type TopologyOperatorBackedResourcesProps = {
  item: TopologyDataObject;
};

const TopologyOperatorBackedResources: React.FC<TopologyOperatorBackedResourcesProps> = ({
  item,
}) => {
  const { groupResources = [] } = item;
  const finalRes = groupResources.map((val) => val.resource).filter((r) => r !== undefined);

  return (
    <div className="overview__sidebar-pane-body">
      <TopologyGroupResourcesPanel
        manifestResources={finalRes}
        releaseNamespace={item.resources.obj.metadata.namespace}
      />
    </div>
  );
};

export default TopologyOperatorBackedResources;
