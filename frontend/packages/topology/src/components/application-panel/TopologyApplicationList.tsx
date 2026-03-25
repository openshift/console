import type { FC } from 'react';
import { List, ListItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { ResourceLink } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';

type TopologyApplicationResourceListProps = {
  resources: K8sResourceKind[];
};

const TopologyApplicationResourceList: FC<TopologyApplicationResourceListProps> = ({
  resources,
}) => {
  return (
    <List isPlain isBordered>
      {_.map(resources, (resource) => {
        const {
          metadata: { name, namespace, uid },
        } = resource;
        return (
          <ListItem key={uid}>
            <ResourceLink kind={referenceFor(resource)} name={name} namespace={namespace} />
          </ListItem>
        );
      })}
    </List>
  );
};

export default TopologyApplicationResourceList;
