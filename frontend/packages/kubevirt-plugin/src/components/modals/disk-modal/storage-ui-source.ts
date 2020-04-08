/* eslint-disable lines-between-class-members */

import { ObjectEnum, VolumeType } from '../../../constants';
import { DataVolumeSourceType, DiskType } from '../../../constants/vm/storage';
import { getStringEnumValues } from '../../../utils/types';
import { BinaryUnit } from '../../form/size-unit-utils';

export class StorageUISource extends ObjectEnum<string> {
  static readonly BLANK = new StorageUISource(
    'Blank',
    VolumeType.DATA_VOLUME,
    DataVolumeSourceType.BLANK,
  );
  static readonly URL = new StorageUISource(
    'URL',
    VolumeType.DATA_VOLUME,
    DataVolumeSourceType.HTTP,
  );
  static readonly CONTAINER = new StorageUISource('Container', VolumeType.CONTAINER_DISK);
  static readonly ATTACH_CLONED_DISK = new StorageUISource(
    'Attach Cloned Disk',
    VolumeType.DATA_VOLUME,
    DataVolumeSourceType.PVC,
  );
  static readonly ATTACH_DISK = new StorageUISource(
    'Attach Disk',
    VolumeType.PERSISTENT_VOLUME_CLAIM,
    undefined,
  );
  static readonly IMPORT_DISK = new StorageUISource(
    'Import Disk',
    VolumeType.PERSISTENT_VOLUME_CLAIM,
    undefined,
    true,
  );

  static readonly OTHER = new StorageUISource('Other');

  private readonly volumeType: VolumeType;
  private readonly dataVolumeSourceType: DataVolumeSourceType;
  private readonly hasNewPVC: boolean;

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<StorageUISource>(StorageUISource),
  );

  private static readonly stringMapper = StorageUISource.ALL.reduce(
    (accumulator, volumeType: StorageUISource) => ({
      ...accumulator,
      [volumeType.value]: volumeType,
    }),
    {},
  );

  protected constructor(
    value: string,
    volumeType?: VolumeType,
    dataVolumeSourceType?: DataVolumeSourceType,
    hasNewPVC: boolean = false,
  ) {
    super(value);
    this.volumeType = volumeType;
    this.dataVolumeSourceType = dataVolumeSourceType;
    this.hasNewPVC = hasNewPVC;
  }

  static getAll = () => StorageUISource.ALL;

  static fromSerialized = (volumeType: { value: string }): StorageUISource =>
    StorageUISource.fromString(volumeType && volumeType.value);

  static fromString = (model: string): StorageUISource => StorageUISource.stringMapper[model];

  static fromTypes = (
    volumeType: VolumeType,
    dataVolumeSourceType?: DataVolumeSourceType,
    hasNewPVC: boolean = false,
  ) =>
    StorageUISource.ALL.find(
      (storageUIType) =>
        storageUIType !== StorageUISource.OTHER &&
        storageUIType.volumeType == volumeType && // eslint-disable-line eqeqeq
        storageUIType.dataVolumeSourceType == dataVolumeSourceType && // eslint-disable-line eqeqeq
        storageUIType.hasNewPVC == hasNewPVC, // eslint-disable-line eqeqeq
    ) || StorageUISource.OTHER;

  getVolumeType = () => this.volumeType;

  getDataVolumeSourceType = () => this.dataVolumeSourceType;

  getAllowedUnits = () =>
    this === StorageUISource.IMPORT_DISK
      ? getStringEnumValues<BinaryUnit>(BinaryUnit)
      : [BinaryUnit.Mi, BinaryUnit.Gi, BinaryUnit.Ti];

  requiresPVC = () =>
    this === StorageUISource.ATTACH_DISK || this === StorageUISource.ATTACH_CLONED_DISK;

  requiresNewPVC = () => this.hasNewPVC;

  requiresContainerImage = () => this === StorageUISource.CONTAINER;

  requiresURL = () => this === StorageUISource.URL;

  requiresSize = () => this.requiresDatavolume() || this.hasNewPVC;

  requiresStorageClass = () => this.requiresDatavolume() || this.hasNewPVC;

  requiresVolumeType = () => !!this.volumeType;

  requiresDatavolume = () => !!this.dataVolumeSourceType;

  requiresNamespace = () => this === StorageUISource.ATTACH_CLONED_DISK;

  requiresAccessModes = () =>
    this !== StorageUISource.ATTACH_DISK &&
    this !== StorageUISource.CONTAINER &&
    this !== StorageUISource.OTHER;

  requiresVolumeMode = () =>
    this !== StorageUISource.ATTACH_DISK &&
    this !== StorageUISource.CONTAINER &&
    this !== StorageUISource.OTHER;

  requiresVolumeModeOrAccessModes = () => this.requiresAccessModes() || this.requiresVolumeMode();

  isNameEditingSupported = (diskType: DiskType) => diskType !== DiskType.CDROM;

  isSizeEditingSupported = (size: number) => size === 0 || this !== StorageUISource.IMPORT_DISK; // if imported disk has 0 size, leave the user to decide

  isPlainDataVolume = (isCreateTemplate: boolean) =>
    isCreateTemplate && this === StorageUISource.URL;

  hasDynamicSize = () => this === StorageUISource.CONTAINER;

  canBeChangedToThisSource = (diskType: DiskType) => {
    if (diskType === DiskType.CDROM) {
      return (
        this === StorageUISource.ATTACH_DISK ||
        this === StorageUISource.URL ||
        this === StorageUISource.CONTAINER
      );
    }
    return this !== StorageUISource.IMPORT_DISK && this !== StorageUISource.OTHER;
  };
}
