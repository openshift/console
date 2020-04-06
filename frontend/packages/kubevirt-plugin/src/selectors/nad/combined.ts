import { K8sResourceKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared/src';
import { NetworkType } from '../../constants/vm';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';

export const getNetworkChoices = (
  nads: K8sResourceKind[],
  usedNetworkNames: Set<string>,
  allowPodNetwork,
): NetworkWrapper[] => {
  const networkChoices = nads
    .map((nad) => getName(nad))
    .filter((nadName) => !(usedNetworkNames && usedNetworkNames.has(nadName)))
    .map((networkName) =>
      new NetworkWrapper().setType(NetworkType.MULTUS, {
        networkName,
      }),
    );

  if (allowPodNetwork) {
    networkChoices.push(new NetworkWrapper().setType(NetworkType.POD));
  }
  return networkChoices;
};
