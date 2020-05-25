/* eslint-disable lines-between-class-members */
import * as _ from 'lodash';
import { ObjectEnum } from '../../object-enum';
import { DiskBus } from './disk-bus';

export class DiskType extends ObjectEnum<string> {
  static readonly DISK = new DiskType('disk');
  static readonly CDROM = new DiskType(
    'cdrom',
    'CD-ROM',
    DiskBus.getAll().filter((bus) => bus !== DiskBus.VIRTIO), // kubevirt removed support for virtIO
  );
  static readonly FLOPPY = new DiskType('floppy');
  static readonly LUN = new DiskType('lun', 'LUN');

  private readonly label: string;
  private readonly supportedDiskBuses: Set<DiskBus>;

  protected constructor(value: string, label?: string, supportedDiskBuses?: DiskBus[]) {
    super(value);
    this.label = label || _.capitalize(value);
    this.supportedDiskBuses = new Set<DiskBus>(supportedDiskBuses || DiskBus.getAll());
  }

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<DiskType>(DiskType),
  );

  private static readonly stringMapper = DiskType.ALL.reduce(
    (accumulator, diskType: DiskType) => ({
      ...accumulator,
      [diskType.value]: diskType,
    }),
    {},
  );

  static getAll = () => DiskType.ALL;

  static fromString = (model: string): DiskType => DiskType.stringMapper[model];

  isBusSupported = (bus: DiskBus) => this.supportedDiskBuses.has(bus);

  // Overide ObjectEnum's default toString method.
  toString() {
    return this.label;
  }
}
