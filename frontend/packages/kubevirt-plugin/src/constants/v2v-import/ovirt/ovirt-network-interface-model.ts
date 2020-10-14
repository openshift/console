/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';
import { NetworkInterfaceModel } from '../../vm/network';

export class OvirtNetworkInterfaceModel extends ObjectEnum<string> {
  static readonly E1000 = new OvirtNetworkInterfaceModel('e1000', NetworkInterfaceModel.E1000E);
  static readonly PCI_PASSTHROUGH = new OvirtNetworkInterfaceModel(
    'pci_passthrough',
    NetworkInterfaceModel.E1000E,
  );
  static readonly RTL8139 = new OvirtNetworkInterfaceModel(
    'rtl8139',
    NetworkInterfaceModel.RTL8139,
  );
  static readonly RTL8139_VIRTIO = new OvirtNetworkInterfaceModel(
    'rtl8139_virtio',
    NetworkInterfaceModel.RTL8139,
  );
  static readonly SPAPR_VLAN = new OvirtNetworkInterfaceModel(
    'spapr_vlan',
    NetworkInterfaceModel.VIRTIO,
  );
  static readonly VIRTIO = new OvirtNetworkInterfaceModel('virtio', NetworkInterfaceModel.VIRTIO);

  private readonly kubevirtNetworkInterfaceModel: NetworkInterfaceModel;

  protected constructor(value: string, kubevirtNetworkInterfaceModel: NetworkInterfaceModel) {
    super(value);
    this.kubevirtNetworkInterfaceModel = kubevirtNetworkInterfaceModel;
  }

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<OvirtNetworkInterfaceModel>(OvirtNetworkInterfaceModel),
  );

  private static readonly stringMapper = OvirtNetworkInterfaceModel.ALL.reduce(
    (accumulator, type: OvirtNetworkInterfaceModel) => ({
      ...accumulator,
      [type.value]: type,
    }),
    {},
  );

  static getAll = () => OvirtNetworkInterfaceModel.ALL;

  static fromString = (model: string): OvirtNetworkInterfaceModel =>
    OvirtNetworkInterfaceModel.stringMapper[model];

  getKubevirtNetworkInterfaceModel = () => {
    return this.kubevirtNetworkInterfaceModel;
  };
}
