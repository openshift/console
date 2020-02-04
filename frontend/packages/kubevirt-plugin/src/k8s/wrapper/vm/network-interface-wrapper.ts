import { V1NetworkInterface } from '../../../types/vm';
import { NetworkInterfaceModel, NetworkInterfaceType } from '../../../constants/vm';
import { ObjectWithTypePropertyWrapper } from '../common/object-with-type-property-wrapper';

export class NetworkInterfaceWrapper extends ObjectWithTypePropertyWrapper<
  V1NetworkInterface,
  NetworkInterfaceType
> {
  static readonly EMPTY = new NetworkInterfaceWrapper();

  static mergeWrappers = (...interfaces: NetworkInterfaceWrapper[]): NetworkInterfaceWrapper =>
    ObjectWithTypePropertyWrapper.defaultMergeWrappersWithType(NetworkInterfaceWrapper, interfaces);

  static initializeFromSimpleData = (params?: {
    name?: string;
    model?: NetworkInterfaceModel;
    interfaceType?: NetworkInterfaceType;
    macAddress?: string;
    bootOrder?: number;
  }) => {
    if (!params) {
      return NetworkInterfaceWrapper.EMPTY;
    }
    const { name, model, macAddress, interfaceType, bootOrder } = params;
    return new NetworkInterfaceWrapper(
      { name, model: model && model.getValue(), macAddress, bootOrder },
      false,
      { initializeWithType: interfaceType },
    );
  };

  public constructor(
    nic?: V1NetworkInterface,
    copy = false,
    opts?: { initializeWithType?: NetworkInterfaceType },
  ) {
    super(nic, copy, opts, NetworkInterfaceType);
  }

  getName = () => this.data?.name;

  getModel = (): NetworkInterfaceModel => NetworkInterfaceModel.fromString(this.data?.model);

  getReadableModel = () => {
    const model = this.getModel();
    return model && model.toString();
  };

  getMACAddress = () => this.data?.macAddress;

  getBootOrder = () => this.data?.bootOrder;

  isFirstBootableDevice = () => this.getBootOrder() === 1;

  hasBootOrder = () => this.getBootOrder() != null;
}
