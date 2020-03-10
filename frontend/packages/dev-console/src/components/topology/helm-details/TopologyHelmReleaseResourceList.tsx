import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import TopologyHelmReleaseResourceItem from './TopologyHelmReleaseResourceItem';

type TopologyHelmReleaseResourceListProps = {
  resources: K8sResourceKind[];
};

const TopologyHelmReleaseResourceList: React.FC<TopologyHelmReleaseResourceListProps> = ({
  resources,
}) => {
  return (
    <ul className="list-group">
      {resources
        .sort((r1, r2) => r1.metadata.name.localeCompare(r2.metadata.name))
        .map((resource) => (
          <TopologyHelmReleaseResourceItem key={resource.metadata.name} item={resource} />
        ))}
    </ul>
  );
};

export default TopologyHelmReleaseResourceList;
