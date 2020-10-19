/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '@console/shared/src/constants/object-enum';
import { SelectDropdownObjectEnum } from '../../select-dropdown-object-enum';
import {
  DISK_TYPE_SATA_DESC,
  DISK_TYPE_VIRTIO_DESC,
  DISK_TYPE_SCSI_DESC,
} from '../../../utils/strings';

export class DiskBus extends SelectDropdownObjectEnum<string> {
  static readonly VIRTIO = new DiskBus('virtio', {
    description: DISK_TYPE_VIRTIO_DESC,
  });
  static readonly SATA = new DiskBus('sata', {
    description: DISK_TYPE_SATA_DESC,
  });
  static readonly SCSI = new DiskBus('scsi', {
    description: DISK_TYPE_SCSI_DESC,
  });

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
}
