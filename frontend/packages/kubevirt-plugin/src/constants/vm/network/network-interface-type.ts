/* eslint-disable lines-between-class-members */
import { ValueEnum } from '../../value-enum';

export class NetworkInterfaceType extends ValueEnum<string> {
  static readonly MASQUERADE = new NetworkInterfaceType('masquerade');
  static readonly BRIDGE = new NetworkInterfaceType('bridge');
  static readonly SRIOV = new NetworkInterfaceType('sriov');
  static readonly SLIRP = new NetworkInterfaceType('slirp');

  private static readonly ALL = Object.freeze(
    ValueEnum.getAllClassEnumProperties<NetworkInterfaceType>(NetworkInterfaceType),
  );

  private static readonly stringMapper = NetworkInterfaceType.ALL.reduce(
    (accumulator, networkType: NetworkInterfaceType) => ({
      ...accumulator,
      [networkType.value]: networkType,
    }),
    {},
  );

  static getAll = () => NetworkInterfaceType.ALL;

  static fromString = (model: string): NetworkInterfaceType =>
    NetworkInterfaceType.stringMapper[model];

  static fromSerialized = (networkInterfaceType: { value: string }): NetworkInterfaceType =>
    NetworkInterfaceType.fromString(networkInterfaceType && networkInterfaceType.value);
}
