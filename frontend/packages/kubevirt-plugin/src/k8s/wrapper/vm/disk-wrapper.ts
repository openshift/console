import { ObjectWithTypePropertyWrapper } from '../common/object-with-type-property-wrapper';
import { V1Disk } from '../../../types/vm/disk/V1Disk';
import { DiskType, DiskBus } from '../../../constants/vm/storage';

type CombinedTypeData = {
  bus?: DiskBus;
};

const sanitizeTypeData = (type: DiskType, typeData: CombinedTypeData) => {
  if (!type || !typeData || type === DiskType.FLOPPY) {
    return null;
  }
  const { bus } = typeData;

  return { bus: bus?.getValue() };
};

export class DiskWrapper extends ObjectWithTypePropertyWrapper<V1Disk, DiskType, DiskWrapper> {
  static readonly EMPTY = new DiskWrapper();

  static mergeWrappers = (...disks: DiskWrapper[]): DiskWrapper =>
    ObjectWithTypePropertyWrapper.defaultMergeWrappersWithType(DiskWrapper, disks);

  static initializeFromSimpleData = (params?: {
    name?: string;
    type?: DiskType;
    bus?: DiskBus;
    bootOrder?: number;
  }) => {
    if (!params) {
      return new DiskWrapper();
    }
    const { name, type, bus, bootOrder } = params;
    return new DiskWrapper(
      {
        name,
        bootOrder,
      },
      false,
      {
        initializeWithType: type,
        initializeWithTypeData: bus ? { bus: bus.getValue() } : undefined,
      },
    );
  };

  constructor(
    disk?: V1Disk,
    copy = false,
    opts?: { initializeWithType?: DiskType; initializeWithTypeData?: any },
  ) {
    super(disk, copy, opts, DiskType);
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

  appendTypeData = (typeData: CombinedTypeData, sanitize = true) => {
    this.addTypeData(sanitize ? sanitizeTypeData(this.getType(), typeData) : typeData);
    return this;
  };
}
