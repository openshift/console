/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '@console/shared/src/constants/object-enum';
import { VolumeType } from '../../../constants';
import { DataVolumeSourceType, DiskType } from '../../../constants/vm/storage';
import { getStringEnumValues } from '../../../utils/types';
import { BinaryUnit } from '../../form/size-unit-utils';
import {
  UI_SOURCE_ATTACH_CLONED_DISK_DESC,
  UI_SOURCE_ATTACH_DISK_DESC,
  UI_SOURCE_BLANK_DESC,
  UI_SOURCE_CONTAINER_DESC,
  UI_SOURCE_IMPORT_DISK_DESC,
  UI_SOURCE_URL_DESC,
} from '../../../utils/strings';
import {
  SelectDropdownData,
  SelectDropdownObjectEnum,
} from '../../../constants/select-dropdown-object-enum';

export class StorageUISource extends SelectDropdownObjectEnum<string> {
  static readonly BLANK = new StorageUISource(
    'Blank',
    {
      volumeType: VolumeType.DATA_VOLUME,
      dataVolumeSourceType: DataVolumeSourceType.BLANK,
    },
    {
      description: UI_SOURCE_BLANK_DESC,
      order: 1,
    },
  );
  static readonly URL = new StorageUISource(
    'URL',
    {
      volumeType: VolumeType.DATA_VOLUME,
      dataVolumeSourceType: DataVolumeSourceType.HTTP,
    },
    {
      label: 'Upload via URL',
      description: UI_SOURCE_URL_DESC,
      order: 2,
    },
  );
  static readonly CONTAINER = new StorageUISource(
    'Container',
    {
      volumeType: VolumeType.CONTAINER_DISK,
    },
    {
      description: UI_SOURCE_CONTAINER_DESC,
      order: 6,
    },
  );
  static readonly ATTACH_CLONED_DISK = new StorageUISource(
    'Attach Cloned Disk',
    {
      volumeType: VolumeType.DATA_VOLUME,
      dataVolumeSourceType: DataVolumeSourceType.PVC,
    },
    {
      label: 'Clone an existing PVC',
      description: UI_SOURCE_ATTACH_CLONED_DISK_DESC,
      order: 4,
    },
  );
  static readonly ATTACH_DISK = new StorageUISource(
    'Attach Disk',
    {
      volumeType: VolumeType.PERSISTENT_VOLUME_CLAIM,
    },
    {
      label: 'Use an existing PVC',
      description: UI_SOURCE_ATTACH_DISK_DESC,
      order: 3,
    },
  );
  static readonly IMPORT_DISK = new StorageUISource(
    'Import Disk',
    {
      volumeType: VolumeType.PERSISTENT_VOLUME_CLAIM,
      hasNewPVC: true,
    },
    {
      label: 'Import an existing PVC',
      description: UI_SOURCE_IMPORT_DISK_DESC,
      order: 7,
    },
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
    {
      volumeType,
      dataVolumeSourceType,
      hasNewPVC = false,
    }: {
      volumeType?: VolumeType;
      dataVolumeSourceType?: DataVolumeSourceType;
      hasNewPVC?: boolean;
    } = {},
    selectData: SelectDropdownData = {},
  ) {
    super(value, selectData);
    this.volumeType = volumeType;
    this.dataVolumeSourceType = dataVolumeSourceType;
    this.hasNewPVC = hasNewPVC;
  }

  static getAll = () => StorageUISource.ALL;

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

  isSizeEditingSupported = (size: number) => size === 0 || this !== StorageUISource.IMPORT_DISK; // if imported disk has 0 size, leave the user to decide

  isPlainDataVolume = (isCreateTemplate: boolean) =>
    isCreateTemplate && this === StorageUISource.URL;

  hasDynamicSize = () => this === StorageUISource.CONTAINER;

  canBeChangedToThisSource = (diskType: DiskType) => {
    if (diskType === DiskType.CDROM) {
      return (
        this === StorageUISource.ATTACH_DISK ||
        this === StorageUISource.ATTACH_CLONED_DISK ||
        this === StorageUISource.URL ||
        this === StorageUISource.CONTAINER
      );
    }
    return this !== StorageUISource.IMPORT_DISK && this !== StorageUISource.OTHER;
  };
}
