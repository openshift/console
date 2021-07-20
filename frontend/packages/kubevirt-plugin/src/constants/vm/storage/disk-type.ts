/* eslint-disable lines-between-class-members */
import * as _ from 'lodash';
import { ObjectEnum } from '../../object-enum';
import { DiskBus } from './disk-bus';

export class DiskType extends ObjectEnum<string> {
  static readonly DISK = new DiskType('disk');
  static readonly CDROM = new DiskType('cdrom', {
    label: 'CD-ROM',
    supportedDiskBuses: DiskBus.getAll().filter((bus) => bus !== DiskBus.VIRTIO), // kubevirt removed support for virtIO
  });
  static readonly FLOPPY = new DiskType('floppy', { isDeprecated: true });
  static readonly LUN = new DiskType('lun', { label: 'LUN' });

  private readonly label: string;
  private readonly deprecated: boolean;
  private readonly supportedDiskBuses: Set<DiskBus>;

  protected constructor(
    value: string,
    { isDeprecated = false, label, supportedDiskBuses }: DiskTypeConstructorOpts = {},
  ) {
    super(value);
    this.label = label || _.capitalize(value);
    this.deprecated = isDeprecated;
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

  isDeprecated = () => this.deprecated;

  // Overide ObjectEnum's default toString method.
  toString() {
    return this.label;
  }
}

type DiskTypeConstructorOpts = {
  isDeprecated?: boolean;
  label?: string;
  supportedDiskBuses?: DiskBus[];
};
