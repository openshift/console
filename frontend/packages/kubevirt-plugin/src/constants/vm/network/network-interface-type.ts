/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';
import { SelectDropdownObjectEnum } from '../../select-dropdown-object-enum';

export class NetworkInterfaceType extends SelectDropdownObjectEnum<string> {
  static readonly MASQUERADE = new NetworkInterfaceType('masquerade', {
    // t('kubevirt-plugin~Masquerade')
    labelKey: 'kubevirt-plugin~Masquerade',
    // t('kubevirt-plugin~Put the VM behind a NAT Proxy for high compability with different network providers. The VMs IP will differ from the IP seen on the pod network')
    descriptionKey:
      'kubevirt-plugin~Put the VM behind a NAT Proxy for high compability with different network providers. The VMs IP will differ from the IP seen on the pod network',
    order: 1,
  });
  static readonly BRIDGE = new NetworkInterfaceType('bridge', {
    // t('kubevirt-plugin~Bridge')
    labelKey: 'kubevirt-plugin~Bridge',
    // t('kubevirt-plugin~The VM will be bridged to the selected network, ideal for L2 devices')
    descriptionKey:
      'kubevirt-plugin~The VM will be bridged to the selected network, ideal for L2 devices',
    order: 2,
  });
  static readonly SRIOV = new NetworkInterfaceType('sriov', {
    // t('kubevirt-plugin~SR-IOV')
    labelKey: 'kubevirt-plugin~SR-IOV',
    // t('kubevirt-plugin~Attach a virtual function network device to the VM for high performance')
    descriptionKey:
      'kubevirt-plugin~Attach a virtual function network device to the VM for high performance',
    order: 3,
  });
  static readonly SLIRP = new NetworkInterfaceType('slirp', {
    // t('kubevirt-plugin~slirp')
    labelKey: 'kubevirt-plugin~slirp',
  });

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
