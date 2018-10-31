import * as React from 'react';
import * as _ from 'lodash-es';
import { Icon, ListGroup } from 'patternfly-react';

import { K8sResourceKind } from '../../module/k8s';
import { ResourceLink, SidebarSectionHeading } from '../utils';
import { RouteLocation } from '../routes';

const ServicePortList: React.SFC<ServicePortListProps> = ({service}) => {
  const ports = _.get(service, 'spec.ports', []);
  return <ul className="port-list">
    {
      _.map(ports, ({name, port, protocol, targetPort}) =>
        <li key={name || `${protocol}/${port}`}>
          <span className="text-muted">Service port:</span> {name || `${protocol}/${port}`}
          &nbsp;<Icon type="fa" name="long-arrow-right" />&nbsp;
          <span className="text-muted">Pod Port:</span> {targetPort}
        </li>
      )
    }
  </ul>;
};

const ServicesOverviewListItem: React.SFC<ServiceOverviewListItemProps> = ({service}) => {
  const {name, namespace} = service.metadata;
  return <li className="list-group-item">
    <ResourceLink kind="Service" name={name} namespace={namespace} />
    <ServicePortList service={service} />
  </li>;
};

const ServicesOverviewList: React.SFC<ServiceOverviewListProps> = ({services}) => (
  <ListGroup componentClass="ul">
    {_.map(services, (service) => <ServicesOverviewListItem key={service.metadata.uid} service={service} />)}
  </ListGroup>
);

const RoutesOverviewListItem: React.SFC<RoutesOverviewListItemProps> = ({route}) => {
  const {name, namespace} = route.metadata;
  return <li className="list-group-item">
    <ResourceLink kind="Route" name={name} namespace={namespace} />
    <span className="text-muted">{'Location: '}</span><RouteLocation obj={route} />
  </li>;
};

const RoutesOverviewList: React.SFC<RoutesOverviewListProps> = ({routes}) => <ListGroup componentClass="ul">
  {_.map(routes, route => <RoutesOverviewListItem key={route.metadata.uid} route={route} />)}
</ListGroup>;

export const NetworkingOverview: React.SFC<NetworkingOverviewProps> = ({routes, services}) => {
  return <React.Fragment>
    <SidebarSectionHeading text="Services" />
    {
      _.isEmpty(services)
        ? <span className="text-muted">No Services found for this resource.</span>
        : <ServicesOverviewList services={services} />
    }


    <SidebarSectionHeading text="Routes" />
    {
      _.isEmpty(routes)
        ? <span className="text-muted">No Routes found for this resource.</span>
        : <RoutesOverviewList routes={routes} />
    }
  </React.Fragment>;
};

/* eslint-disable no-unused-vars, no-undef */
type RoutesOverviewListProps = {
  routes: K8sResourceKind[];
};

type RoutesOverviewListItemProps = {
  route: K8sResourceKind;
};

type NetworkingOverviewProps = {
  routes: K8sResourceKind[];
  services: K8sResourceKind[];
};

type ServicePortListProps = {
  service: K8sResourceKind;
};

type ServiceOverviewListProps = {
  services: K8sResourceKind[];
};

type ServiceOverviewListItemProps = {
  service: K8sResourceKind;
};
/* eslint-enable no-unused-vars, no-undef */
