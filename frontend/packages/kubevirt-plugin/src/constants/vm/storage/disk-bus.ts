/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';
import { READABLE_VIRTIO } from '../constants';

export class DiskBus extends ObjectEnum<string> {
  static readonly VIRTIO = new DiskBus('virtio');
  static readonly SATA = new DiskBus('sata');
  static readonly SCSI = new DiskBus('scsi');

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<DiskBus>(DiskBus),
  );

  private static readonly stringMapper = DiskBus.ALL.reduce(
    (accumulator, diskBusType: DiskBus) => ({
      ...accumulator,
      [diskBusType.value]: diskBusType,
    }),
    {},
  );

  static getAll = () => DiskBus.ALL;

  static fromString = (model: string): DiskBus => DiskBus.stringMapper[model];

  toString() {
    if (this === DiskBus.VIRTIO) {
      return READABLE_VIRTIO;
    }
    return this.value;
  }
}
