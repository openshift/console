/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../../object-enum';

export class VolumeMode extends ObjectEnum<string> {
  static readonly BLOCK = new VolumeMode('Block');
  static readonly FILESYSTEM = new VolumeMode('Filesystem');

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<VolumeMode>(VolumeMode),
  );

  private static readonly stringMapper = VolumeMode.ALL.reduce(
    (accumulator, volumeMode: VolumeMode) => ({
      ...accumulator,
      [volumeMode.value]: volumeMode,
    }),
    {},
  );

  static getAll = () => VolumeMode.ALL;

  static fromString = (model: string): VolumeMode => VolumeMode.stringMapper[model];
}
