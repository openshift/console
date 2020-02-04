import { NetworkType, POD_NETWORK } from '../../../constants';
import { V1Network } from '../../../types/vm';
import { ObjectWithTypePropertyWrapper } from '../common/object-with-type-property-wrapper';

export class NetworkWrapper extends ObjectWithTypePropertyWrapper<V1Network, NetworkType> {
  static readonly EMPTY = new NetworkWrapper();

  static mergeWrappers = (...networks: NetworkWrapper[]): NetworkWrapper =>
    ObjectWithTypePropertyWrapper.defaultMergeWrappersWithType(NetworkWrapper, networks);

  static initializeFromSimpleData = (params?: {
    name?: string;
    type?: NetworkType;
    multusNetworkName?: string;
  }) => {
    if (!params) {
      return NetworkWrapper.EMPTY;
    }
    const { name, type, multusNetworkName } = params;
    return new NetworkWrapper({ name }, false, {
      initializeWithType: type,
      initializeWithTypeData:
        type === NetworkType.MULTUS ? { networkName: multusNetworkName } : undefined,
    });
  };

  public constructor(
    network?: V1Network,
    copy = false,
    opts?: { initializeWithType?: NetworkType; initializeWithTypeData?: any },
  ) {
    super(network, copy, opts, NetworkType);
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
}
