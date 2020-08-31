/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';
import { READABLE_VIRTIO } from '../constants';

export class NetworkInterfaceModel extends ObjectEnum<string> {
  static readonly VIRTIO = new NetworkInterfaceModel('virtio');
  static readonly E1000 = new NetworkInterfaceModel('e1000', { isDeprecated: true });
  static readonly E1000E = new NetworkInterfaceModel('e1000e');
  static readonly NE2kPCI = new NetworkInterfaceModel('ne2kPCI', { isDeprecated: true });
  static readonly PCNET = new NetworkInterfaceModel('pcnet', { isDeprecated: true });
  static readonly RTL8139 = new NetworkInterfaceModel('rtl8139', { isDeprecated: true });

  private readonly deprecated: boolean;

  protected constructor(
    value: string,
    { isDeprecated = false }: NetworkInterfaceModelConstructorOpts = {},
  ) {
    super(value);
    this.deprecated = isDeprecated;
  }

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<NetworkInterfaceModel>(NetworkInterfaceModel),
  );

  private static readonly stringMapper = NetworkInterfaceModel.ALL.reduce(
    (accumulator, networkInterfaceModel: NetworkInterfaceModel) => ({
      ...accumulator,
      [networkInterfaceModel.value]: networkInterfaceModel,
    }),
    {},
  );

  static getAll = () => NetworkInterfaceModel.ALL;

  static fromString = (model: string): NetworkInterfaceModel =>
    NetworkInterfaceModel.stringMapper[model];

  isDeprecated = () => this.deprecated;

  toString() {
    if (this === NetworkInterfaceModel.VIRTIO) {
      return READABLE_VIRTIO;
    }
    return this.value;
  }
}

type NetworkInterfaceModelConstructorOpts = {
  isDeprecated?: boolean;
};
