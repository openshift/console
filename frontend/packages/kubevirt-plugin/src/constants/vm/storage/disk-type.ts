/* eslint-disable lines-between-class-members */
import * as _ from 'lodash';
import { ValueEnum } from '../../value-enum';

export class DiskType extends ValueEnum<string> {
  static readonly DISK = new DiskType('disk');
  static readonly CDROM = new DiskType('cdrom', 'CD-ROM');
  static readonly FLOPPY = new DiskType('floppy');
  static readonly LUN = new DiskType('lun', 'LUN');

  private readonly label: string;

  protected constructor(value: string, label?: string) {
    super(value);
    this.label = label || _.capitalize(value);
  }

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

  // Overide ValueEnum's default toString method.
  toString = () => this.label;
}
