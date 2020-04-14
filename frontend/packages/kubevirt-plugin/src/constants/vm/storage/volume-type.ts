/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';

export class VolumeType extends ObjectEnum<string> {
  static readonly CLOUD_INIT_CONFIG_DRIVE = new VolumeType('cloudInitConfigDrive');
  static readonly CLOUD_INIT_NO_CLOUD = new VolumeType('cloudInitNoCloud');
  static readonly CONFIG_MAP = new VolumeType('configMap');
  static readonly CONTAINER_DISK = new VolumeType('containerDisk');
  static readonly DATA_VOLUME = new VolumeType('dataVolume');
  static readonly EMPTY_DISK = new VolumeType('emptyDisk');
  static readonly EPHEMERAL = new VolumeType('ephemeral');
  static readonly PERSISTENT_VOLUME_CLAIM = new VolumeType('persistentVolumeClaim');
  static readonly SECRET = new VolumeType('secret');
  static readonly SERVICE_ACCOUNT = new VolumeType('serviceAccount');

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
}
