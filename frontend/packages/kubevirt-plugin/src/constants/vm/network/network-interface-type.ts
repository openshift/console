/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';
import { SelectDropdownObjectEnum } from '../../select-dropdown-object-enum';
import {
  NIC_TYPE_BRIDGE_DESC,
  NIC_TYPE_MASQUERADE_DESC,
  NIC_TYPE_SRIOV_DESC,
} from '../../../utils/strings';

export class NetworkInterfaceType extends SelectDropdownObjectEnum<string> {
  static readonly MASQUERADE = new NetworkInterfaceType('masquerade', {
    label: 'Masquerade',
    description: NIC_TYPE_MASQUERADE_DESC,
    order: 1,
  });
  static readonly BRIDGE = new NetworkInterfaceType('bridge', {
    label: 'Bridge',
    description: NIC_TYPE_BRIDGE_DESC,
    order: 2,
  });
  static readonly SRIOV = new NetworkInterfaceType('sriov', {
    label: 'SR-IOV',
    description: NIC_TYPE_SRIOV_DESC,
    order: 3,
  });
  static readonly SLIRP = new NetworkInterfaceType('slirp');

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<NetworkInterfaceType>(NetworkInterfaceType),
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
}
