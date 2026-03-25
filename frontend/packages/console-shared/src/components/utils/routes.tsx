import type { ComponentProps, FC } from 'react';
import i18next from 'i18next';
import * as _ from 'lodash';
import { ExternalLinkWithCopy } from '@console/internal/components/utils/link';
import type { RouteKind, RouteIngress } from '@console/internal/module/k8s';

const getSubdomain = (route: RouteKind): string => {
  const hostname = _.get(route, 'spec.host', '');
  return hostname.replace(/^[a-z0-9]([-a-z0-9]*[a-z0-9])\./, '');
};

const getRouteHost = (route: RouteKind, onlyAdmitted: boolean): string => {
  let oldestAdmittedIngress: RouteIngress;
  let oldestTransitionTime: string;
  _.each(route.status.ingress, (ingress) => {
    const admittedCondition = _.find(ingress.conditions, { type: 'Admitted', status: 'True' });
    if (
      admittedCondition &&
      (!oldestTransitionTime || oldestTransitionTime > admittedCondition.lastTransitionTime)
    ) {
      oldestAdmittedIngress = ingress;
      oldestTransitionTime = admittedCondition.lastTransitionTime;
    }
  });

  if (oldestAdmittedIngress) {
    return oldestAdmittedIngress.host;
  }

  return onlyAdmitted ? null : route.spec.host;
};

export const getRouteWebURL = (route: RouteKind): string => {
  const scheme = _.get(route, 'spec.tls.termination') ? 'https' : 'http';
  let url = `${scheme}://${getRouteHost(route, false)}`;
  if (route.spec.path) {
    url += route.spec.path;
  }
  return url;
};

export const RouteLinkAndCopy: FC<RouteLinkAndCopyProps> = ({ route, className }) => {
  const link = getRouteWebURL(route);
  return (
    <ExternalLinkWithCopy className={className} href={link} text={link} dataTestID="route-link" />
  );
};

const isWebRoute = (route: RouteKind): boolean => {
  return !!getRouteHost(route, true) && _.get(route, 'spec.wildcardPolicy') !== 'Subdomain';
};

const getRouteLabel = (route: RouteKind): string => {
  if (isWebRoute(route)) {
    return getRouteWebURL(route);
  }

  let label = getRouteHost(route, false);
  if (!label) {
    return i18next.t('public~unknown host');
  }

  if (_.get(route, 'spec.wildcardPolicy') === 'Subdomain') {
    label = `*.${getSubdomain(route)}`;
  }

  if (route.spec.path) {
    label += route.spec.path;
  }
  return label;
};

// Renders LinkAndCopy for non subdomains
export const RouteLocation: FC<RouteHostnameProps> = ({ obj }) => (
  <div className="co-break-word">
    {isWebRoute(obj) ? <RouteLinkAndCopy route={obj} /> : getRouteLabel(obj)}
  </div>
);
RouteLocation.displayName = 'RouteLocation';

export const routeStatus = (route: RouteKind): string => {
  let atLeastOneAdmitted: boolean = false;

  if (!route.status || !route.status.ingress) {
    return 'Pending';
  }

  _.each(route.status.ingress, (ingress) => {
    const isAdmitted = _.some(ingress.conditions, { type: 'Admitted', status: 'True' });
    if (isAdmitted) {
      atLeastOneAdmitted = true;
    }
  });

  return atLeastOneAdmitted ? 'Accepted' : 'Rejected';
};

type RouteHostnameProps = {
  obj: RouteKind;
};

type RouteLinkAndCopyProps = {
  route: RouteKind;
  className?: ComponentProps<typeof ExternalLinkWithCopy>['className'];
};
