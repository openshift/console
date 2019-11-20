import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import {
  ResourceLink,
  ExternalLink,
  SidebarSectionHeading,
} from '@console/internal/components/utils';
import { RouteModel } from '@console/knative-plugin';

export type RoutesOverviewListItemProps = {
  route: K8sResourceKind;
  resource: K8sResourceKind;
};

export type RoutesOverviewListProps = {
  ksroutes: K8sResourceKind[];
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

const RoutesOverviewList: React.FC<RoutesOverviewListProps> = ({ ksroutes, resource }) => (
  <>
    <SidebarSectionHeading text="Routes" />
    {_.isEmpty(ksroutes) ? (
      <span className="text-muted">No Routes found for this resource.</span>
    ) : (
      <ul className="list-group">
        {_.map(ksroutes, (route) => (
          <RoutesOverviewListItem key={route.metadata.uid} route={route} resource={resource} />
        ))}
      </ul>
    )}
  </>
);

export default RoutesOverviewList;
