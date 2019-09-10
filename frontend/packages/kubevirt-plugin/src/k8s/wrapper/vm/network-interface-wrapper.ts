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
      { initializeWithType: interfaceType },
    );
  };

  static initialize = (nic?: V1NetworkInterface, copy?: boolean) =>
    new NetworkInterfaceWrapper(nic, copy && { copy });

  protected constructor(
    nic?: V1NetworkInterface,
    opts?: { initializeWithType?: NetworkInterfaceType; copy?: boolean },
  ) {
    super(nic, opts, NetworkInterfaceType);
  }

  getName = (): string => this.get('name');

  getModel = (): NetworkInterfaceModel => NetworkInterfaceModel.fromString(this.get('model'));

  getReadableModel = () => {
    const model = this.getModel();
    return model && model.toString();
  };

  getMACAddress = () => this.get('macAddress');

  getBootOrder = () => this.get('bootOrder');

  isFirstBootableDevice = () => this.getBootOrder() === 1;

  hasBootOrder = () => this.getBootOrder() != null;
}
