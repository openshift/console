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
  constructor(nic?: V1NetworkInterface | NetworkInterfaceWrapper, copy = false) {
    super(nic, copy, NetworkInterfaceType);
  }

  init({
    name,
    model,
    macAddress,
    bootOrder,
  }: {
    name?: string;
    model?: NetworkInterfaceModel;
    macAddress?: string;
    bootOrder?: number;
  }) {
    if (name !== undefined) {
      this.data.name = name;
    }
    if (model !== undefined) {
      this.data.model = model && model.getValue();
    }
    if (macAddress !== undefined) {
      this.data.macAddress = macAddress;
    }
    if (bootOrder !== undefined) {
      this.data.bootOrder = bootOrder;
    }
    return this;
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
