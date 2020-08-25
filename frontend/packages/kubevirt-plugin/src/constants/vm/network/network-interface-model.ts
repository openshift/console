/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';
import { READABLE_VIRTIO } from '../constants';
import { NIC_MODEL_E1000E_DESC, NIC_MODEL_VIRTIO_DESC } from '../../../utils/strings';
import { SelectDropdownObjectEnum, SelectDropdownData } from '../../select-dropdown-object-enum';

export class NetworkInterfaceModel extends SelectDropdownObjectEnum<string> {
  static readonly VIRTIO = new NetworkInterfaceModel(
    'virtio',
    { isSupported: true },
    {
      label: READABLE_VIRTIO,
      description: NIC_MODEL_VIRTIO_DESC,
      order: 1,
    },
  );
  static readonly E1000 = new NetworkInterfaceModel(
    'e1000',
    { isSupported: false },
    {
      label: 'E1000',
      order: 2,
    },
  );
  static readonly E1000E = new NetworkInterfaceModel(
    'e1000e',
    { isSupported: true },
    {
      label: 'e1000e',
      order: 3,
      description: NIC_MODEL_E1000E_DESC,
    },
  );
  static readonly NE2kPCI = new NetworkInterfaceModel(
    'ne2kPCI',
    { isSupported: false },
    {
      order: 4,
    },
  );
  static readonly PCNET = new NetworkInterfaceModel(
    'pcnet',
    { isSupported: false },
    {
      label: 'PCnet',
      order: 5,
    },
  );
  static readonly RTL8139 = new NetworkInterfaceModel(
    'rtl8139',
    { isSupported: false },
    {
      label: 'RTL8139',
      order: 6,
    },
  );

  private readonly supported: boolean;

  protected constructor(
    value: string,
    { isSupported = true }: NetworkInterfaceModelConstructorOpts = {},
    selectData: SelectDropdownData = {},
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
