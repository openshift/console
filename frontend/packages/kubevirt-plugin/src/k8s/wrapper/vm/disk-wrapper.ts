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

export class DiskWrapper extends ObjectWithTypePropertyWrapper<V1Disk, DiskType> {
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
      return DiskWrapper.EMPTY;
    }
    const { name, type, bus, bootOrder } = params;
    return new DiskWrapper(
      {
        name,
        bootOrder,
      },
      {
        initializeWithType: type,
        initializeWithTypeData: bus ? { bus: bus.getValue() } : undefined,
      },
    );
  };

  static initialize = (disk?: V1Disk, copy?: boolean) => new DiskWrapper(disk, copy && { copy });

  protected constructor(
    disk?: V1Disk,
    opts?: { initializeWithType?: DiskType; initializeWithTypeData?: any; copy?: boolean },
  ) {
    super(disk, opts?.copy, opts, DiskType);
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
}

export class MutableDiskWrapper extends DiskWrapper {
  public constructor(disk?: V1Disk, copy = false) {
    super(disk, { copy });
  }

  appendTypeData = (typeData: CombinedTypeData, sanitize = true) => {
    this.addTypeData(sanitize ? sanitizeTypeData(this.getType(), typeData) : typeData);
    return this;
  };

  asMutableResource = () => this.data;
}
