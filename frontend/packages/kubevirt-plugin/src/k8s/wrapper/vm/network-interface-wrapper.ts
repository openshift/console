import { V1NetworkInterface } from '../../../types/vm';
import { NetworkInterfaceModel, NetworkInterfaceType } from '../../../constants/vm';
import { ObjectWithTypePropertyWrapper } from '../common/object-with-type-property-wrapper';

type CombinedTypeData = {};

export class NetworkInterfaceWrapper extends ObjectWithTypePropertyWrapper<
  V1NetworkInterface,
  NetworkInterfaceType,
  CombinedTypeData,
  NetworkInterfaceWrapper
> {
  /**
   * @deprecated FIXME deprecate initializeFromSimpleData in favor of init
   */
  static initializeFromSimpleData = ({
    name,
    model,
    macAddress,
    interfaceType,
    bootOrder,
  }: {
    name?: string;
    model?: NetworkInterfaceModel;
    interfaceType?: NetworkInterfaceType;
    macAddress?: string;
    bootOrder?: number;
  }) =>
    new NetworkInterfaceWrapper({ name, model: model?.getValue(), macAddress, bootOrder }).setType(
      interfaceType,
    );

  constructor(nic?: V1NetworkInterface | NetworkInterfaceWrapper, copy = false) {
    super(nic, copy, NetworkInterfaceType);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
  protected sanitize(type: NetworkInterfaceType, typeData: CombinedTypeData): any {
    return {};
  }
}
