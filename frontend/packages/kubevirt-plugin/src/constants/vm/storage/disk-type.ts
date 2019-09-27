/* eslint-disable lines-between-class-members */
import { ValueEnum } from '../../value-enum';

export class DiskType extends ValueEnum<string> {
  static readonly DISK = new DiskType('disk');
  static readonly CDROM = new DiskType('cdrom');
  static readonly FLOPPY = new DiskType('floppy');
  static readonly LUN = new DiskType('lun');

  private static readonly ALL = Object.freeze(
    ValueEnum.getAllClassEnumProperties<DiskType>(DiskType),
  );

  private static readonly stringMapper = DiskType.ALL.reduce(
    (accumulator, diskType: DiskType) => ({
      ...accumulator,
      [diskType.value]: diskType,
    }),
    {},
  );

  static getAll = () => DiskType.ALL;

  static fromSerialized = (diskType: { value: string }): DiskType =>
    DiskType.fromString(diskType && diskType.value);

  static fromString = (model: string): DiskType => DiskType.stringMapper[model];
}
