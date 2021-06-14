/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '@console/shared/src/constants/object-enum';
import { SelectDropdownData, SelectDropdownObjectEnum } from '../../select-dropdown-object-enum';

export class NetworkInterfaceModel extends SelectDropdownObjectEnum<string> {
  static readonly VIRTIO = new NetworkInterfaceModel(
    'virtio',
    { isSupported: true },
    {
      // t('kubevirt-plugin~virtio')
      labelKey: 'kubevirt-plugin~virtio',
      // t('kubevirt-plugin~Optimized for best performance. Supported by most Linux distributions. Windows requires additional drivers to use this model')
      descriptionKey:
        'kubevirt-plugin~Optimized for best performance. Supported by most Linux distributions. Windows requires additional drivers to use this model',
      order: 1,
    },
  );
  static readonly E1000 = new NetworkInterfaceModel(
    'e1000',
    { isSupported: false },
    {
      // t('kubevirt-plugin~E1000')
      labelKey: 'kubevirt-plugin~E1000',
      order: 2,
    },
  );
  static readonly E1000E = new NetworkInterfaceModel(
    'e1000e',
    { isSupported: true },
    {
      // t('kubevirt-plugin~e1000e')
      labelKey: 'kubevirt-plugin~e1000e',
      order: 3,
      // t('kubevirt-plugin~Supported by most operating systems including Windows out of the box. Offers lower performance compared to virtio.')
      descriptionKey:
        'kubevirt-plugin~Supported by most operating systems including Windows out of the box. Offers lower performance compared to virtio.',
    },
  );
  static readonly NE2kPCI = new NetworkInterfaceModel(
    'ne2kPCI',
    { isSupported: false },
    {
      // t('kubevirt-plugin~ne2kPCI')
      labelKey: 'kubevirt-plugin~ne2kPCI',
      order: 4,
    },
  );
  static readonly PCNET = new NetworkInterfaceModel(
    'pcnet',
    { isSupported: false },
    {
      // t('kubevirt-plugin~PCnet')
      labelKey: 'kubevirt-plugin~PCnet',
      order: 5,
    },
  );
  static readonly RTL8139 = new NetworkInterfaceModel(
    'rtl8139',
    { isSupported: false },
    {
      // t('kubevirt-plugin~RTL8139')
      labelKey: 'kubevirt-plugin~RTL8139',
      order: 6,
    },
  );

  private readonly supported: boolean;

  protected constructor(
    value: string,
    { isSupported = true }: NetworkInterfaceModelConstructorOpts = {},
    selectData: SelectDropdownData,
  ) {
    super(value, selectData);
    this.supported = isSupported;
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

  isSupported = () => this.supported;
}

type NetworkInterfaceModelConstructorOpts = {
  isSupported?: boolean;
};
