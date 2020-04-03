import { KebabOption } from '@console/internal/components/utils/kebab';
import { Node } from '@console/topology';
import { regroupActions } from './regroupActions';
import { deleteHelmRelease, upgradeHelmRelease } from '../../../actions/modify-helm-release';

export const helmReleaseActions = (helmRelease: Node): KebabOption[] => {
  const name = helmRelease.getLabel();
  const { namespace } = helmRelease.getData().groupResources[0].resources.obj.metadata;
  return name && namespace
    ? [
        upgradeHelmRelease(name, namespace),
        deleteHelmRelease(name, namespace),
        ...regroupActions(helmRelease),
      ]
    : [];
};
