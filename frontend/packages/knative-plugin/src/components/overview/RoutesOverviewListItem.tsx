import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink, ExternalLink } from '@console/internal/components/utils';
import { RouteModel } from '../../models';

export type RoutesOverviewListItemProps = {
  route: K8sResourceKind;
  resource: K8sResourceKind;
};

const RoutesOverviewListItem: React.FC<RoutesOverviewListItemProps> = ({ route, resource }) => {
  const {
    metadata: { name, namespace },
    status: { url },
  } = route;
  const trafficData = _.find(route.status.traffic, {
    revisionName: resource.metadata.name,
  });
  const routeUrl = _.get(trafficData, 'url', url);
  return (
    <li className="list-group-item">
      <ResourceLink kind={referenceForModel(RouteModel)} name={name} namespace={namespace} />
      <span className="text-muted">Location: </span>
      <ExternalLink href={routeUrl} additionalClassName="co-external-link--block" text={routeUrl} />
    </li>
  );
};

export default RoutesOverviewListItem;
