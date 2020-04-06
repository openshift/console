/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';
import { DiskBus } from '../../vm/storage';

export class OvirtDiskBus extends ObjectEnum<string> {
  static readonly IDE = new OvirtDiskBus('ide', DiskBus.SATA);
  static readonly SATA = new OvirtDiskBus('sata', DiskBus.SATA);
  static readonly SPAPR_VSCSI = new OvirtDiskBus('spapr_vscsi', DiskBus.SCSI);
  static readonly VIRTIO = new OvirtDiskBus('virtio', DiskBus.VIRTIO);
  static readonly VIRTIO_SCSI = new OvirtDiskBus('virtio_scsi', DiskBus.VIRTIO);

  private readonly kubevirtBus: DiskBus;

  protected constructor(value: string, kubevirtBus: DiskBus) {
    super(value);
    this.kubevirtBus = kubevirtBus;
  }

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<OvirtDiskBus>(OvirtDiskBus),
  );

  private static readonly stringMapper = OvirtDiskBus.ALL.reduce(
    (accumulator, type: OvirtDiskBus) => ({
      ...accumulator,
      [type.value]: type,
    }),
    {},
  );

  static getAll = () => OvirtDiskBus.ALL;

  static fromString = (model: string): OvirtDiskBus => OvirtDiskBus.stringMapper[model];

  getKubevirtBus = () => {
    return this.kubevirtBus;
  };
}
