import type { FC } from 'react';
import { List, ListItem } from '@patternfly/react-core';
import { LongArrowAltRightIcon } from '@patternfly/react-icons/dist/esm/icons/long-arrow-alt-right-icon';
import { useTranslation } from 'react-i18next';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { K8sResourceKind, RouteKind } from '@console/internal/module/k8s';
import { useRoutesWatcher, useServicesWatcher } from '@console/shared';
import { RouteLocation } from '@console/shared/src/components/utils/routes';

const ServicePortList: FC<ServicePortListProps> = ({ service }) => {
  const ports = service.spec?.ports ?? [];
  const { t } = useTranslation();
  return (
    <ul className="port-list">
      {ports.map(({ name, port, protocol, targetPort }) => (
        <li key={name || `${protocol}/${port}`}>
          <span className="pf-v6-u-text-color-subtle">{t('topology~Service port:')}</span>{' '}
          {name || `${protocol}/${port}`}
          &nbsp;
          <LongArrowAltRightIcon />
          &nbsp;
          <span className="pf-v6-u-text-color-subtle">{t('topology~Pod port:')}</span> {targetPort}
        </li>
      ))}
    </ul>
  );
};

const ServicesOverviewListItem: FC<ServiceOverviewListItemProps> = ({ service }) => {
  const { name, namespace } = service.metadata;
  return (
    <ListItem>
      <ResourceLink kind="Service" name={name} namespace={namespace} />
      <ServicePortList service={service} />
    </ListItem>
  );
};

const ServicesOverviewList: FC<ServiceOverviewListProps> = ({ services }) => (
  <List isPlain isBordered>
    {services?.map((service) => (
      <ServicesOverviewListItem key={service.metadata.uid} service={service} />
    ))}
  </List>
);

const RoutesOverviewListItem: FC<RoutesOverviewListItemProps> = ({ route }) => {
  const { name, namespace } = route.metadata;
  const { t } = useTranslation();
  return (
    <ListItem>
      <ResourceLink kind="Route" name={name} namespace={namespace} />
      <span className="pf-v6-u-text-color-subtle">{t('topology~Location:')}</span>
      <RouteLocation obj={route} />
    </ListItem>
  );
};

const RoutesOverviewList: FC<RoutesOverviewListProps> = ({ routes }) => (
  <List isPlain isBordered>
    {routes?.map((route) => (
      <RoutesOverviewListItem key={route.metadata.uid} route={route} />
    ))}
  </List>
);

export const NetworkingOverview: FC<NetworkingOverviewProps> = ({ obj }) => {
  const { t } = useTranslation();
  const serviceResources = useServicesWatcher(obj);
  const services =
    serviceResources.loaded && !serviceResources.loadError ? serviceResources.services : [];
  const routeResources = useRoutesWatcher(obj);
  const routes = routeResources.loaded && !routeResources.loadError ? routeResources.routes : [];
  return (
    <>
      <SidebarSectionHeading text={t('topology~Services')} />
      {!(services?.length > 0) ? (
        <span className="pf-v6-u-text-color-subtle">
          {t('topology~No Services found for this resource.')}
        </span>
      ) : (
        <ServicesOverviewList services={services} />
      )}

      <SidebarSectionHeading text={t('topology~Routes')} />
      {!(routes?.length > 0) ? (
        <span className="pf-v6-u-text-color-subtle">
          {t('topology~No Routes found for this resource.')}
        </span>
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
