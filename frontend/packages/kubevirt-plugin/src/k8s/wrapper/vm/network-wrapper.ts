import { NetworkType, POD_NETWORK } from '../../../constants';
import { V1Network } from '../../../types/vm';
import { ObjectWithTypePropertyWrapper } from '../common/object-with-type-property-wrapper';

type CombinedTypeData = {
  networkName?: string;
};

export class NetworkWrapper extends ObjectWithTypePropertyWrapper<
  V1Network,
  NetworkType,
  CombinedTypeData,
  NetworkWrapper
> {
  constructor(network?: V1Network | NetworkWrapper, copy = false) {
    super(network, copy, NetworkType);
  }

  init({ name }: { name?: string }) {
    if (name !== undefined) {
      this.data.name = name;
    }
    return this;
  }

  getName = () => this.data?.name;

  getMultusNetworkName = () => this.data?.multus?.networkName;

  isPodNetwork = () => this.getType() === NetworkType.POD;

  getReadableName = () => {
    switch (this.getType()) {
      case NetworkType.MULTUS:
        return this.getMultusNetworkName();
      case NetworkType.POD:
        return POD_NETWORK;
      default:
        return null;
    }
  };

  protected sanitize(type: NetworkType, { networkName }: CombinedTypeData) {
    switch (type) {
      case NetworkType.MULTUS:
        return { networkName };
      default:
        return {};
    }
  }
}
