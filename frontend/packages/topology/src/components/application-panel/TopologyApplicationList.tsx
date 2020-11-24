import * as React from 'react';
import * as _ from 'lodash';
import { ResourceLink } from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';

type TopologyApplicationResourceListProps = {
  resources: K8sResourceKind[];
};

const TopologyApplicationResourceList: React.FC<TopologyApplicationResourceListProps> = ({
  resources,
}) => {
  return (
    <ul className="list-group">
      {_.map(resources, (resource) => {
        const {
          metadata: { name, namespace, uid },
        } = resource;
        return (
          <li className="list-group-item  container-fluid" key={uid}>
            <ResourceLink kind={referenceFor(resource)} name={name} namespace={namespace} />
          </li>
        );
      })}
    </ul>
  );
};

export default TopologyApplicationResourceList;
