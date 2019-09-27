/* eslint-disable lines-between-class-members */
import { ValueEnum } from '../../value-enum';
import { READABLE_VIRTIO } from '../constants';

export class DiskBus extends ValueEnum<string> {
  static readonly VIRTIO = new DiskBus('virtio');
  static readonly SATA = new DiskBus('sata');
  static readonly SCSI = new DiskBus('scsi');

  private static readonly ALL = Object.freeze(
    ValueEnum.getAllClassEnumProperties<DiskBus>(DiskBus),
  );

  private static readonly stringMapper = DiskBus.ALL.reduce(
    (accumulator, diskBusType: DiskBus) => ({
      ...accumulator,
      [diskBusType.value]: diskBusType,
    }),
    {},
  );

  static getAll = () => DiskBus.ALL;

  static fromSerialized = (diskBusType: { value: string }): DiskBus =>
    DiskBus.fromString(diskBusType && diskBusType.value);

  static fromString = (model: string): DiskBus => DiskBus.stringMapper[model];

  toString = () => {
    if (this === DiskBus.VIRTIO) {
      return READABLE_VIRTIO;
    }
    return this.value;
  };
}
