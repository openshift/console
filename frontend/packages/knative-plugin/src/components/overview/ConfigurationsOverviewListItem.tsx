import * as React from 'react';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink } from '@console/internal/components/utils';
import { ConfigurationModel } from '../../models';

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
export default ConfigurationsOverviewListItem;
