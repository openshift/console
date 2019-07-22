import * as React from 'react';
import * as _ from 'lodash';
import { ListGroup } from 'patternfly-react';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink } from '@console/internal/components/utils';
import { ConfigurationModel } from '@console/knative-plugin';

export type ConfigurationsOverviewListProps = {
  configurations: K8sResourceKind[];
};

export type ConfigurationsOverviewListItemProps = {
  configuration: K8sResourceKind;
};

const ConfigurationsOverviewListItem: React.FC<ConfigurationsOverviewListItemProps> = ({
  configuration: {
    metadata: { name, namespace },
    status: { latestCreatedRevisionName, latestReadyRevisionName },
  },
}) => {
  return (
    <li className="list-group-item">
      <ResourceLink
        kind={referenceForModel(ConfigurationModel)}
        name={name}
        namespace={namespace}
      />
      <span className="text-muted">Latest Created Revision name: </span>
      <span>{latestCreatedRevisionName}</span>
      <br />
      <span className="text-muted">Latest Ready Revision name: </span>
      <span>{latestReadyRevisionName}</span>
    </li>
  );
};

const ConfigurationsOverviewList: React.FC<ConfigurationsOverviewListProps> = ({
  configurations,
}) => (
  <ListGroup componentClass="ul">
    {_.map(configurations, (configuration) => (
      <ConfigurationsOverviewListItem
        key={configuration.metadata.uid}
        configuration={configuration}
      />
    ))}
  </ListGroup>
);

export default ConfigurationsOverviewList;
