import * as React from 'react';
import { List } from '@patternfly/react-core';
import { K8sResourceKind } from '@console/internal/module/k8s';
import TopologyGroupResourceItem from './TopologyGroupResourceItem';

type TopologyGroupResourceListProps = {
  resources: K8sResourceKind[];
  releaseNamespace: string;
  linkForResource?: (obj: K8sResourceKind) => React.ReactElement;
};

const TopologyGroupResourceList: React.FC<TopologyGroupResourceListProps> = ({
  resources,
  releaseNamespace,
  linkForResource,
}) => {
  return (
    <List isPlain isBordered>
      {resources
        .sort((r1, r2) => r1.metadata.name.localeCompare(r2.metadata.name))
        .map((resource) => (
          <TopologyGroupResourceItem
            key={resource.metadata.name}
            item={resource}
            releaseNamespace={releaseNamespace}
            linkForResource={linkForResource}
          />
        ))}
    </List>
  );
};

export default TopologyGroupResourceList;
