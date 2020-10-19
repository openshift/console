/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '@console/shared/src/constants/object-enum';

export class DataVolumeSourceType extends ObjectEnum<string> {
  static readonly BLANK = new DataVolumeSourceType('blank');
  static readonly HTTP = new DataVolumeSourceType('http');
  static readonly PVC = new DataVolumeSourceType('pvc');
  static readonly REGISTRY = new DataVolumeSourceType('registry');
  static readonly S3 = new DataVolumeSourceType('s3');
  static readonly UPLOAD = new DataVolumeSourceType('upload');

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<DataVolumeSourceType>(DataVolumeSourceType),
  );

  private static readonly stringMapper = DataVolumeSourceType.ALL.reduce(
    (accumulator, dataVolumeSourceType: DataVolumeSourceType) => ({
      ...accumulator,
      [dataVolumeSourceType.value]: dataVolumeSourceType,
    }),
    {},
  );

  static getAll = () => DataVolumeSourceType.ALL;

  static fromString = (model: string): DataVolumeSourceType =>
    DataVolumeSourceType.stringMapper[model];
}
