/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';

interface VolumeMetadata {
  isEnvType?: boolean;
}

export class VolumeType extends ObjectEnum<string> {
  private readonly isEnvironmentType: boolean;
  protected constructor(value: string, { isEnvType }: VolumeMetadata = {}) {
    super(value);
    this.isEnvironmentType = isEnvType || false;
  }

  static readonly CLOUD_INIT_CONFIG_DRIVE = new VolumeType('cloudInitConfigDrive');
  static readonly CLOUD_INIT_NO_CLOUD = new VolumeType('cloudInitNoCloud');
  static readonly CONTAINER_DISK = new VolumeType('containerDisk');
  static readonly DATA_VOLUME = new VolumeType('dataVolume');
  static readonly EMPTY_DISK = new VolumeType('emptyDisk');
  static readonly EPHEMERAL = new VolumeType('ephemeral');
  static readonly PERSISTENT_VOLUME_CLAIM = new VolumeType('persistentVolumeClaim');
  static readonly SECRET = new VolumeType('secret', { isEnvType: true });
  static readonly CONFIG_MAP = new VolumeType('configMap', { isEnvType: true });
  static readonly SERVICE_ACCOUNT = new VolumeType('serviceAccount', { isEnvType: true });

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<VolumeType>(VolumeType),
  );

  private static readonly stringMapper = VolumeType.ALL.reduce(
    (accumulator, volumeType: VolumeType) => ({
      ...accumulator,
      [volumeType.value]: volumeType,
    }),
    {},
  );

  static getAll = () => VolumeType.ALL;

  static fromString = (model: string): VolumeType => VolumeType.stringMapper[model];

  isEnvType = () => this.isEnvironmentType || false;
}
