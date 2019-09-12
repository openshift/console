import * as React from 'react';
import * as _ from 'lodash';
import { ListGroup } from 'patternfly-react';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink, ExternalLink } from '@console/internal/components/utils';
import { RouteModelAlpha, RouteModelBeta } from '@console/knative-plugin';

export type RoutesOverviewListItemProps = {
  route: K8sResourceKind;
};

export type RoutesOverviewListProps = {
  ksroutes: K8sResourceKind[];
};

const RoutesOverviewListItemAlpha: React.FC<RoutesOverviewListItemProps> = ({
  route: {
    metadata: { name, namespace },
    status: { url },
  },
}) => {
  return (
    <li className="list-group-item">
      <ResourceLink kind={referenceForModel(RouteModelAlpha)} name={name} namespace={namespace} />
      <span className="text-muted">Location: </span>
      <ExternalLink href={url} additionalClassName="co-external-link--block" text={url} />
    </li>
  );
};

export const RoutesOverviewListAlpha: React.FC<RoutesOverviewListProps> = ({ ksroutes }) => (
  <ListGroup componentClass="ul">
    {_.map(ksroutes, (route) => (
      <RoutesOverviewListItemAlpha key={route.metadata.uid} route={route} />
    ))}
  </ListGroup>
);

const RoutesOverviewListItemBeta: React.FC<RoutesOverviewListItemProps> = ({
  route: {
    metadata: { name, namespace },
    status: { url },
  },
}) => {
  return (
    <li className="list-group-item">
      <ResourceLink kind={referenceForModel(RouteModelBeta)} name={name} namespace={namespace} />
      <span className="text-muted">Location: </span>
      <ExternalLink href={url} additionalClassName="co-external-link--block" text={url} />
    </li>
  );
};

export const RoutesOverviewListBeta: React.FC<RoutesOverviewListProps> = ({ ksroutes }) => (
  <ListGroup componentClass="ul">
    {_.map(ksroutes, (route) => (
      <RoutesOverviewListItemBeta key={route.metadata.uid} route={route} />
    ))}
  </ListGroup>
);
