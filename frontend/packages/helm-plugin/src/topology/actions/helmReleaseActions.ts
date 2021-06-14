import { Node } from '@patternfly/react-topology';
import { KebabOption } from '@console/internal/components/utils/kebab';
import { getResource } from '@console/topology/src/utils/topology-utils';
import {
  deleteHelmRelease,
  rollbackHelmRelease,
  upgradeHelmRelease,
} from '../../actions/modify-helm-release';
import { HelmActionOrigins } from '../../types/helm-types';

export const helmReleaseActions = (helmRelease: Node): KebabOption[] => {
  const name = helmRelease.getLabel();
  const { namespace } = getResource(helmRelease)?.metadata;
  return name && namespace
    ? [
        upgradeHelmRelease(name, namespace, HelmActionOrigins.topology),
        rollbackHelmRelease(name, namespace, HelmActionOrigins.topology),
        deleteHelmRelease(name, namespace),
      ]
    : [];
};
