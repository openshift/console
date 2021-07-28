/* eslint-disable lines-between-class-members */
import { VolumeType, ObjectEnum } from '../../../constants';
import {
  SelectDropdownData,
  SelectDropdownObjectEnum,
} from '../../../constants/select-dropdown-object-enum';
import { DataVolumeSourceType, DiskType } from '../../../constants/vm/storage';
import { getStringEnumValues } from '../../../utils/types';
import { BinaryUnit } from '../../form/size-unit-utils';

export class StorageUISource extends SelectDropdownObjectEnum<string> {
  static readonly BLANK = StorageUISource.fromDataVolume(DataVolumeSourceType.BLANK, 1);
  static readonly URL = StorageUISource.fromDataVolume(DataVolumeSourceType.HTTP, 2);
  static readonly CONTAINER = StorageUISource.fromDataVolume(DataVolumeSourceType.REGISTRY, 6);
  static readonly ATTACH_CLONED_DISK = StorageUISource.fromDataVolume(DataVolumeSourceType.PVC, 4);
  static readonly CONTAINER_EPHEMERAL = new StorageUISource(
    'Container (ephemeral)',
    {
      volumeType: VolumeType.CONTAINER_DISK,
    },
    {
      // t('kubevirt-plugin~Container (ephemeral)')
      labelKey: 'kubevirt-plugin~Container (ephemeral)',
      // t('kubevirt-plugin~Upload content from a container located in a registry accessible from the cluster. The container disk is meant to be used only for read-only filesystems such as CD-ROMs or for small short-lived throw-away VMs.')
      descriptionKey: `kubevirt-plugin~Upload content from a container located in a registry accessible from the cluster. The container disk is meant to be used only for read-only filesystems such
      as CD-ROMs or for small short-lived throw-away VMs.`,
      order: 7,
    },
  );
  static readonly ATTACH_DISK = new StorageUISource(
    'Attach Disk',
    {
      volumeType: VolumeType.PERSISTENT_VOLUME_CLAIM,
    },
    {
      // t('kubevirt-plugin~Use an existing PVC')
      labelKey: 'kubevirt-plugin~Use an existing PVC',
      // t('kubevirt-plugin~Use a persistent volume claim (PVC) already available on the cluster')
      descriptionKey:
        'kubevirt-plugin~Use a persistent volume claim (PVC) already available on the cluster',
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
      // t('kubevirt-plugin~Import an existing PVC')
      labelKey: 'kubevirt-plugin~Import an existing PVC',
      order: 8,
    },
  );

  static readonly OTHER = new StorageUISource(
    'Other',
    {},
    {
      // t('kubevirt-plugin~Other')
      labelKey: 'kubevirt-plugin~Other',
    },
  );

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

  private static fromDataVolume(dvType: DataVolumeSourceType, order: number) {
    return new StorageUISource(
      dvType.getValue(),
      { volumeType: VolumeType.DATA_VOLUME, dataVolumeSourceType: dvType },
      {
        descriptionKey: dvType.getDescriptionKey(),
        labelKey: dvType.toString(),
        order,
      },
    );
  }

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
    selectData: SelectDropdownData,
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

  requiresBlankDisk = () => this === StorageUISource.BLANK;

  requiresPVC = () =>
    this === StorageUISource.ATTACH_DISK || this === StorageUISource.ATTACH_CLONED_DISK;

  requiresNewPVC = () => this.hasNewPVC;

  requiresContainerImage = () =>
    [StorageUISource.CONTAINER, StorageUISource.CONTAINER_EPHEMERAL].includes(this);

  requiresURL = () => this === StorageUISource.URL;

  requiresSize = () => this.requiresDatavolume() || this.hasNewPVC;

  requiresStorageClass = () => this.requiresDatavolume() || this.hasNewPVC;

  requiresVolumeType = () => !!this.volumeType;

  requiresDatavolume = () => !!this.dataVolumeSourceType;

  requiresNamespace = () => this === StorageUISource.ATTACH_CLONED_DISK;

  requiresAccessModes = () =>
    this !== StorageUISource.ATTACH_DISK &&
    this !== StorageUISource.CONTAINER_EPHEMERAL &&
    this !== StorageUISource.OTHER;

  requiresVolumeMode = () =>
    this !== StorageUISource.ATTACH_DISK &&
    this !== StorageUISource.CONTAINER_EPHEMERAL &&
    this !== StorageUISource.OTHER;

  requiresVolumeModeOrAccessModes = () => this.requiresAccessModes() || this.requiresVolumeMode();

  isSizeEditingSupported = (size: number) => size === 0 || this !== StorageUISource.IMPORT_DISK; // if imported disk has 0 size, leave the user to decide

  hasDynamicSize = () => this === StorageUISource.CONTAINER_EPHEMERAL;

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

  hotplugDiskSources = (diskType: DiskType, isVMRunning: boolean) => {
    if (isVMRunning) {
      return (
        this === StorageUISource.ATTACH_DISK ||
        this === StorageUISource.ATTACH_CLONED_DISK ||
        this === StorageUISource.URL ||
        this === StorageUISource.CONTAINER ||
        this === StorageUISource.BLANK
      );
    }
    return this.canBeChangedToThisSource(diskType);
  };
}
