import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash-es';
import { LongArrowAltRightIcon } from '@patternfly/react-icons';

import { K8sResourceKind, RouteKind } from '../../module/k8s';
import { RouteLocation } from '../routes';
import { ResourceLink, SidebarSectionHeading } from '../utils';
import { useRoutesWatcher, useServicesWatcher } from '@console/shared/src';

const ServicePortList: React.SFC<ServicePortListProps> = ({ service }) => {
  const ports = _.get(service, 'spec.ports', []);
  const { t } = useTranslation();
  return (
    <ul className="port-list">
      {_.map(ports, ({ name, port, protocol, targetPort }) => (
        <li key={name || `${protocol}/${port}`}>
          <span className="text-muted">{t('public~Service port:')}</span>{' '}
          {name || `${protocol}/${port}`}
          &nbsp;
          <LongArrowAltRightIcon />
          &nbsp;
          <span className="text-muted">{t('public~Pod port:')}</span> {targetPort}
        </li>
      ))}
    </ul>
  );
};

const ServicesOverviewListItem: React.SFC<ServiceOverviewListItemProps> = ({ service }) => {
  const { name, namespace } = service.metadata;
  return (
    <li className="list-group-item">
      <ResourceLink kind="Service" name={name} namespace={namespace} />
      <ServicePortList service={service} />
    </li>
  );
};

const ServicesOverviewList: React.SFC<ServiceOverviewListProps> = ({ services }) => (
  <ul className="list-group">
    {_.map(services, (service) => (
      <ServicesOverviewListItem key={service.metadata.uid} service={service} />
    ))}
  </ul>
);

const RoutesOverviewListItem: React.SFC<RoutesOverviewListItemProps> = ({ route }) => {
  const { name, namespace } = route.metadata;
  const { t } = useTranslation();
  return (
    <li className="list-group-item">
      <ResourceLink kind="Route" name={name} namespace={namespace} />
      <span className="text-muted">{t('public~Location:')}</span>
      <RouteLocation obj={route} />
    </li>
  );
};

const RoutesOverviewList: React.SFC<RoutesOverviewListProps> = ({ routes }) => (
  <ul className="list-group">
    {_.map(routes, (route) => (
      <RoutesOverviewListItem key={route.metadata.uid} route={route} />
    ))}
  </ul>
);

export const NetworkingOverview: React.SFC<NetworkingOverviewProps> = ({ obj }) => {
  const { t } = useTranslation();
  const serviceResources = useServicesWatcher(obj);
  const services =
    serviceResources.loaded && !serviceResources.loadError ? serviceResources.services : [];
  const routeResources = useRoutesWatcher(obj);
  const routes = routeResources.loaded && !routeResources.loadError ? routeResources.routes : [];
  return (
    <>
      <SidebarSectionHeading text={t('public~Services')} />
      {_.isEmpty(services) ? (
        <span className="text-muted">{t('public~No Services found for this resource.')}</span>
      ) : (
        <ServicesOverviewList services={services} />
      )}

      <SidebarSectionHeading text={t('public~Routes')} />
      {_.isEmpty(routes) ? (
        <span className="text-muted">{t('public~No Routes found for this resource.')}</span>
      ) : (
        <RoutesOverviewList routes={routes} />
      )}
    </>
  );
};

type RoutesOverviewListProps = {
  routes: RouteKind[];
};

type RoutesOverviewListItemProps = {
  route: RouteKind;
};

type NetworkingOverviewProps = {
  obj: K8sResourceKind;
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
