import { CogsIcon } from '@patternfly/react-icons/dist/esm/icons/cogs-icon';
import type { Perspective, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { FLAGS } from '@console/shared/src/constants/common';

export const icon: ResolvedExtension<Perspective>['properties']['icon'] = { default: CogsIcon };

export const getLandingPageURL: ResolvedExtension<Perspective>['properties']['landingPageURL'] = (
  flags,
) => {
  if (!flags[FLAGS.OPENSHIFT]) {
    return '/search';
  }
  return flags[FLAGS.CAN_LIST_NS] && flags[FLAGS.MONITORING]
    ? '/dashboards'
    : '/k8s/cluster/projects';
};

export const getImportRedirectURL: ResolvedExtension<
  Perspective
>['properties']['importRedirectURL'] = (namespace) => `/topology/ns/${namespace}`;
