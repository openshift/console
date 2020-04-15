/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';
import { READABLE_VIRTIO } from '../constants';

export class NetworkInterfaceModel extends ObjectEnum<string> {
  static readonly VIRTIO = new NetworkInterfaceModel('virtio');
  static readonly E1000 = new NetworkInterfaceModel('e1000');
  static readonly E1000E = new NetworkInterfaceModel('e1000e');
  static readonly NE2kPCI = new NetworkInterfaceModel('ne2kPCI');
  static readonly PCNET = new NetworkInterfaceModel('pcnet');
  static readonly RTL8139 = new NetworkInterfaceModel('rtl8139');

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

  toString() {
    if (this === NetworkInterfaceModel.VIRTIO) {
      return READABLE_VIRTIO;
    }
    return this.value;
  }
}
