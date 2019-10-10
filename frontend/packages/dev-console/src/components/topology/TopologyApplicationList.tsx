import * as React from 'react';
import * as _ from 'lodash';
import { ListGroup } from 'patternfly-react';
import { ResourceLink } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';

export type TopologyApplicationResourceListProps = {
  resources: K8sResourceKind[];
};

const TopologyApplicationResourceList: React.FC<TopologyApplicationResourceListProps> = ({
  resources,
}) => {
  return (
    <ListGroup componentClass="ul">
      {_.map(resources, ({ metadata: { name, namespace, uid }, kind }) => (
        <li className="list-group-item  container-fluid" key={uid}>
          <ResourceLink kind={kind} name={name} namespace={namespace} />
        </li>
      ))}
    </ListGroup>
  );
};

export default TopologyApplicationResourceList;
