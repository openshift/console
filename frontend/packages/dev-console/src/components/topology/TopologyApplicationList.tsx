import * as React from 'react';
import * as _ from 'lodash';
import { ListGroup } from 'patternfly-react';
import { ResourceLink } from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';

export type TopologyApplicationResourceListProps = {
  resources: K8sResourceKind[];
};

const TopologyApplicationResourceList: React.FC<TopologyApplicationResourceListProps> = ({
  resources,
}) => {
  return (
    <ListGroup componentClass="ul">
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
    </ListGroup>
  );
};

export default TopologyApplicationResourceList;
