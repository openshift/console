import * as _ from 'lodash';
import { ObjectWithTypePropertyWrapper } from '../common/object-with-type-property-wrapper';
import { V1Disk } from '../../../types/vm/disk/V1Disk';
import { DiskType, DiskBus } from '../../../constants/vm/storage';

type CombinedTypeData = {
  bus?: string | DiskBus;
};

export class DiskWrapper extends ObjectWithTypePropertyWrapper<
  V1Disk,
  DiskType,
  CombinedTypeData,
  DiskWrapper
> {
  /**
   * @deprecated FIXME deprecate initializeFromSimpleData in favor of init
   */
  static initializeFromSimpleData = ({
    name,
    type,
    bus,
    bootOrder,
  }: {
    name?: string;
    type?: DiskType;
    bus?: DiskBus;
    bootOrder?: number;
  }) =>
    new DiskWrapper({
      name,
      bootOrder,
    }).setType(type, { bus: bus?.getValue() });

  constructor(disk?: V1Disk | DiskWrapper, copy = false) {
    super(disk, copy, DiskType);
  }

  init({ name, bootOrder }: { name?: string; bootOrder?: number }) {
    if (name !== undefined) {
      this.data.name = name;
    }
    if (bootOrder !== undefined) {
      this.data.bootOrder = bootOrder;
    }
    return this;
  }

  getName = () => this.get('name');

  getDiskBus = (): DiskBus => DiskBus.fromString(this.getIn([this.getTypeValue(), 'bus']));

  getReadableDiskBus = () => {
    const diskBus = this.getDiskBus();
    return diskBus && diskBus.toString();
  };

  getBootOrder = () => this.get('bootOrder');

  isFirstBootableDevice = () => this.getBootOrder() === 1;

  hasBootOrder = () => this.getBootOrder() != null;

  protected sanitize(type: DiskType, { bus }: CombinedTypeData) {
    switch (type) {
      case DiskType.FLOPPY:
        return {};
      default:
        return {
          bus: _.isString(bus) ? bus : bus?.getValue(),
        };
    }
  }

  isDiskEqual = (
    otherDisk: V1Disk,
    omitRuntimeData?: boolean,
    omitBootOrder?: boolean,
  ): boolean => {
    if (!otherDisk) {
      return false;
    }

    const currDisk = omitBootOrder ? _.omit(this.data, 'bootOrder') : this.data;
    const othrDisk = omitBootOrder ? _.omit(otherDisk, 'bootOrder') : otherDisk;

    if (!omitRuntimeData) {
      return _.isEqual(currDisk, othrDisk);
    }

    const diskWrapper = new DiskWrapper(otherDisk);
    const thisDiskType = this.getType();

    if (diskWrapper.getType() !== thisDiskType) {
      return false;
    }

    switch (thisDiskType) {
      case DiskType.CDROM:
        return _.isEqual(
          _.omit(currDisk, 'cdrom.readonly', 'cdrom.tray'),
          _.omit(othrDisk, 'cdrom.readonly', 'cdrom.tray'),
        );
      default:
        return _.isEqual(currDisk, othrDisk);
    }
  };
}
