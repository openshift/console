import { KebabOption } from '@console/internal/components/utils/kebab';
import { Node } from '@console/topology';
import {
  deleteHelmRelease,
  upgradeHelmRelease,
  rollbackHelmRelease,
} from '../../../../actions/modify-helm-release';
import { HelmActionOrigins } from '../../../helm/helm-types';

export const helmReleaseActions = (helmRelease: Node): KebabOption[] => {
  const name = helmRelease.getLabel();
  const { namespace } = helmRelease.getData().groupResources[0].resources.obj.metadata;
  return name && namespace
    ? [
        upgradeHelmRelease(name, namespace, HelmActionOrigins.topology),
        rollbackHelmRelease(name, namespace, HelmActionOrigins.topology),
        deleteHelmRelease(name, namespace),
      ]
    : [];
};
